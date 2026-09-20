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
const directory = mkdtempSync(join(tmpdir(), "maple-action-"));

/** A run's environment, with its event payload and output file on disk. */
function env(overrides: NodeJS.ProcessEnv = {}, payload?: unknown): NodeJS.ProcessEnv {
  const eventPath = join(directory, `event-${String(Math.random()).slice(2)}.json`);
  const outputPath = join(directory, `output-${String(Math.random()).slice(2)}.txt`);
  writeFileSync(eventPath, JSON.stringify(payload ?? { pull_request: { head: { sha: HEAD } } }));
  writeFileSync(outputPath, "");

  return {
    GITHUB_REPOSITORY: "maple-kit/app",
    GITHUB_EVENT_NAME: "pull_request",
    GITHUB_REF_NAME: "3/merge",
    GITHUB_HEAD_REF: "feature/x",
    GITHUB_EVENT_PATH: eventPath,
    GITHUB_OUTPUT: outputPath,
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
  it("decides without publishing a check run, which is gate's to write", async () => {
    github.put(storedComment({ id: "c_1", status: "open" }));
    const environment = env({ INPUT_MODE: "sync" });

    await run(environment);

    expect(outputs(environment)).toMatchObject({ conclusion: "blocked" });
    expect(checks.runsOn(HEAD)).toHaveLength(0);
  });
});
