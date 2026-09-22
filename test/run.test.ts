import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { storedComment } from "@maple-kit/core/testing";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { run } from "../src/run.js";
import { createChecksFake } from "./msw/github-checks.js";
import { createGitHubFake } from "./msw/github.js";
import { useTestServer } from "./msw/server.js";

const github = createGitHubFake();
const checks = createChecksFake();

useTestServer([...github.handlers, ...checks.handlers], { beforeAll, afterEach, afterAll });
afterEach(() => {
  github.reset();
  checks.reset();
});

const HEAD = "commit_sha";
const PULL_REQUEST = {
  pull_request: {
    number: 42,
    head: { sha: HEAD, repo: { full_name: "maple-kit/app" } },
  },
};
const directory = mkdtempSync(join(tmpdir(), "maple-action-"));

/** A run's environment, with its event payload and output file on disk. */
function env(overrides: NodeJS.ProcessEnv = {}, payload?: unknown): NodeJS.ProcessEnv {
  const unique = String(Math.random()).slice(2);
  const eventPath = join(directory, `event-${unique}.json`);
  const outputPath = join(directory, `output-${unique}.txt`);
  const summaryPath = join(directory, `summary-${unique}.md`);
  writeFileSync(eventPath, JSON.stringify(payload ?? PULL_REQUEST));
  writeFileSync(outputPath, "");
  writeFileSync(summaryPath, "");

  return {
    GITHUB_REPOSITORY: "maple-kit/app",
    GITHUB_EVENT_NAME: "pull_request",
    GITHUB_REF_NAME: "3/merge",
    GITHUB_HEAD_REF: "feature/x",
    GITHUB_EVENT_PATH: eventPath,
    GITHUB_OUTPUT: outputPath,
    GITHUB_STEP_SUMMARY: summaryPath,
    INPUT_MODE: "gate",
    INPUT_TOKEN: "token",
    ...overrides,
  };
}

/** What the run wrote to `GITHUB_OUTPUT`, as a map. */
function outputs(environment: NodeJS.ProcessEnv): Record<string, string> {
  const written = readFileSync(environment["GITHUB_OUTPUT"] ?? "", "utf8");
  return Object.fromEntries(
    written
      .split("\n")
      .filter((line) => line !== "")
      .map((line) => line.split("=") as [string, string]),
  );
}

describe("a pull request with an open comment", () => {
  it("holds the check run at in_progress and says how many", async () => {
    github.put(
      storedComment({ id: "c_1", status: "open" }),
      storedComment({ id: "c_2", status: "resolved" }),
    );
    const environment = env();

    const verdict = await run(environment);

    expect(verdict.conclusion).toBe("blocked");
    expect(outputs(environment)).toEqual({
      conclusion: "blocked",
      reason: "comments-open",
      "open-count": "1",
    });

    const [published] = checks.runsOn(HEAD);
    expect(published).toMatchObject({ name: "maple/visual-review", status: "in_progress" });
    expect(published?.conclusion).toBeNull();
  });
});

describe("a pull request that has to be approved", () => {
  /** An approval of the commit under judgement, as a store hands one back. */
  function approvalOf(commit: string) {
    return {
      id: "a_1",
      branch: "feature/x",
      commit,
      author: { id: "u_1", name: "Dana", provenance: "server" as const },
      at: "2026-09-22T09:00:00.000Z",
    };
  }

  it("blocks on an empty surface nobody has approved", async () => {
    const environment = env({ "INPUT_REQUIRE-APPROVAL": "true" });

    const verdict = await run(environment);

    expect(verdict.conclusion).toBe("blocked");
    expect(verdict.reason).toBe("awaiting-approval");
    expect(checks.runsOn(HEAD)[0]).toMatchObject({ status: "in_progress" });
  });

  it("clears once somebody has approved this commit", async () => {
    github.approve(approvalOf(HEAD));

    const verdict = await run(env({ "INPUT_REQUIRE-APPROVAL": "true" }));

    expect(verdict.conclusion).toBe("clear");
    expect(checks.runsOn(HEAD)[0]).toMatchObject({ conclusion: "success" });
  });

  it("does not count an approval of the commit before this one", async () => {
    github.approve(approvalOf("older_sha"));

    const verdict = await run(env({ "INPUT_REQUIRE-APPROVAL": "true" }));

    expect(verdict.conclusion).toBe("blocked");
    expect(verdict.reason).toBe("awaiting-approval");
  });

  it("lets an open comment outrank a missing approval", async () => {
    github.put(storedComment({ id: "c_1", status: "open" }));

    const verdict = await run(env({ "INPUT_REQUIRE-APPROVAL": "true" }));

    expect(verdict.reason).toBe("comments-open");
  });

  it("clears an empty surface when no approval was asked for", async () => {
    const verdict = await run(env());

    expect(verdict.conclusion).toBe("clear");
    expect(verdict.reason).toBe("no-comments");
  });
});

describe("a pull request with nothing holding it", () => {
  it("completes the check run as a success", async () => {
    github.put(storedComment({ id: "c_1", status: "resolved" }));

    await run(env());

    expect(checks.runsOn(HEAD)[0]).toMatchObject({ status: "completed", conclusion: "success" });
  });

  it("publishes on the head commit, never on the merge commit GitHub invented", async () => {
    await run(env({ GITHUB_SHA: "merge_commit" }));

    expect(checks.runsOn(HEAD)).toHaveLength(1);
    expect(checks.runsOn("merge_commit")).toHaveLength(0);
  });
});

describe("a merge-queue entry", () => {
  it("passes on its own head commit without reading a comment", async () => {
    const payload = { merge_group: { head_sha: "queued_sha" } };
    const environment = env(
      { GITHUB_EVENT_NAME: "merge_group", GITHUB_HEAD_REF: "", GITHUB_REF_NAME: "queue/main" },
      payload,
    );

    await run(environment);

    expect(outputs(environment)).toMatchObject({ conclusion: "neutral", reason: "no-review" });
    expect(checks.runsOn("queued_sha")[0]).toMatchObject({
      status: "completed",
      conclusion: "neutral",
    });
    expect(github.pages()).toBe(0);
  });
});

describe("a run with no pull request", () => {
  it("reports neutral and publishes nothing, because there is no commit to publish on", async () => {
    const environment = env({ GITHUB_EVENT_NAME: "push" }, { ref: "refs/heads/main" });

    await run(environment);

    expect(outputs(environment)).toMatchObject({ conclusion: "neutral", reason: "no-review" });
    expect(checks.runsOn(HEAD)).toHaveLength(0);
  });
});

describe("when something is broken", () => {
  it("is neutral, not blocked, when the comments cannot be read", async () => {
    github.failWith(403);
    const environment = env();

    await run(environment);

    expect(outputs(environment)).toMatchObject({ conclusion: "neutral", reason: "unreadable" });
    expect(checks.runsOn(HEAD)[0]).toMatchObject({ conclusion: "neutral" });
  });

  it("fails the step when the check run cannot be published", async () => {
    checks.failWith(403);

    await expect(run(env())).rejects.toThrow(/403/);
  });

  it("rejects a run that names neither a branch nor a head ref", async () => {
    await expect(run(env({ GITHUB_HEAD_REF: "" }))).rejects.toThrow(/branch/);
  });
});

describe("sync mode", () => {
  /** The sticky comment, found the way the action finds it again. */
  function sticky() {
    return github.issueComments().find((comment) => comment.body.includes("maple:visual-review"));
  }

  it("decides without publishing a check run, which is gate's to write", async () => {
    github.put(storedComment({ id: "c_1", status: "open" }));
    const environment = env({ INPUT_MODE: "sync" });

    await run(environment);

    expect(outputs(environment)).toMatchObject({ conclusion: "blocked" });
    expect(checks.runsOn(HEAD)).toHaveLength(0);
  });

  it("writes one comment carrying the verdict and the table", async () => {
    github.put(storedComment({ id: "c_1", status: "open", body: "Spacing is off" }));

    await run(env({ INPUT_MODE: "sync" }));

    expect(sticky()?.body).toContain("### 1 of 1 comment still open");
    expect(sticky()?.body).toContain("Spacing is off");
  });

  it("carries no maple fence, which the store would read back as a comment", async () => {
    github.put(storedComment({ id: "c_1", status: "open" }));
    const environment = env({ INPUT_MODE: "sync" });

    await run(environment);
    const after = await run(env({ INPUT_MODE: "gate" }));

    expect(sticky()?.body).not.toContain("```maple");
    expect(after).toMatchObject({ open: 1, total: 1 });
  });

  it("rewrites the same comment rather than adding another", async () => {
    github.put(storedComment({ id: "c_1", status: "open" }));

    await run(env({ INPUT_MODE: "sync" }));
    const first = sticky()?.id;
    await run(env({ INPUT_MODE: "sync" }));

    expect(github.issueComments()).toHaveLength(2);
    expect(sticky()?.id).toBe(first);
  });

  it("says so when nobody has commented", async () => {
    await run(env({ INPUT_MODE: "sync" }));

    expect(sticky()?.body).toContain("Nobody has left a visual review comment");
  });

  it("degrades to the step summary on a fork instead of failing", async () => {
    github.put(storedComment({ id: "c_1", status: "open" }));
    const fork = {
      pull_request: { number: 42, head: { sha: HEAD, repo: { full_name: "someone/app" } } },
    };
    const environment = env({ INPUT_MODE: "sync" }, fork);

    await run(environment);

    expect(sticky()).toBeUndefined();
    expect(readFileSync(environment["GITHUB_STEP_SUMMARY"] ?? "", "utf8")).toContain(
      "1 of 1 comment still open",
    );
  });
});
