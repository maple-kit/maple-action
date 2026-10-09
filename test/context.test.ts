import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { http, HttpResponse } from "msw";

import { MissingContextError, readContext, resolveHead } from "../src/context.js";
import { createGitHubFake } from "./msw/github.js";
import { useTestServer } from "./msw/server.js";

const PAYLOAD = JSON.stringify({ pull_request: { head: { sha: "head_sha" } } });

const BASE = {
  GITHUB_REPOSITORY: "maple-kit/app",
  GITHUB_EVENT_NAME: "pull_request",
  GITHUB_EVENT_PATH: "/tmp/event.json",
  GITHUB_SHA: "merge_sha",
};

describe("readContext", () => {
  it("splits the repository into its owner and its name", () => {
    expect(readContext(BASE, () => PAYLOAD)).toMatchObject({
      owner: "maple-kit",
      repo: "app",
      eventName: "pull_request",
    });
  });

  it("takes the head commit from the payload, never GITHUB_SHA", () => {
    expect(readContext(BASE, () => PAYLOAD).sha).toBe("head_sha");
  });

  it("has no commit when the event is not about a pull request", () => {
    const push = JSON.stringify({ ref: "refs/heads/main" });

    expect(readContext({ ...BASE, GITHUB_EVENT_NAME: "push" }, () => push).sha).toBeUndefined();
  });

  it("has no commit when there is no payload to read", () => {
    expect(readContext({ GITHUB_REPOSITORY: "maple-kit/app" }, () => "").sha).toBeUndefined();
  });

  it("treats an unreadable payload as no pull request, not as a failure", () => {
    const thrown = () => {
      throw new Error("ENOENT");
    };

    expect(readContext(BASE, thrown).sha).toBeUndefined();
  });

  it("rejects an environment that is not GitHub Actions", () => {
    expect(() => readContext({}, () => PAYLOAD)).toThrow(MissingContextError);
    expect(() => readContext({ GITHUB_REPOSITORY: "maple-kit" }, () => PAYLOAD)).toThrow(
      /only runs inside GitHub Actions/,
    );
  });
});

const github = createGitHubFake();
const server = useTestServer(github.handlers, { beforeAll, afterEach, afterAll });
afterEach(() => {
  github.reset();
});

const COMMENT = {
  ...BASE,
  GITHUB_EVENT_NAME: "issue_comment",
};
const ON_PULL = JSON.stringify({ issue: { number: 42, pull_request: {} } });

describe("resolveHead", () => {
  it("reads the number off an issue_comment on a pull request, and no commit yet", () => {
    const context = readContext(COMMENT, () => ON_PULL);

    expect(context.pull).toBe(42);
    expect(context.sha).toBeUndefined();
  });

  it("fetches the head's commit and branch", async () => {
    const context = await resolveHead(
      readContext(COMMENT, () => ON_PULL),
      "token",
    );

    expect(context).toMatchObject({
      pull: 42,
      sha: "commit_sha",
      headRef: "feature/x",
      fork: false,
    });
  });

  it("marks a head in another repository as a fork, as pull_request does", async () => {
    server.use(
      http.get("https://api.github.com/repos/maple-kit/app/pulls/42", () =>
        HttpResponse.json({
          head: { sha: "fork_sha", ref: "patch-1", repo: { full_name: "someone/app" } },
        }),
      ),
    );

    const context = await resolveHead(
      readContext(COMMENT, () => ON_PULL),
      "token",
    );

    expect(context).toMatchObject({ sha: "fork_sha", headRef: "patch-1", fork: true });
  });

  it("leaves a comment on a plain issue alone, without calling the API", async () => {
    const plain = JSON.stringify({ issue: { number: 7 } });
    const context = readContext(COMMENT, () => plain);

    expect(context.pull).toBeUndefined();
    expect(await resolveHead(context, "token")).toBe(context);
    expect(github.pullLookups()).toBe(0);
  });

  it("leaves every other event alone", async () => {
    const context = readContext(BASE, () => PAYLOAD);

    expect(await resolveHead(context, "token")).toBe(context);
    expect(github.pullLookups()).toBe(0);
  });

  it("throws GitHub's own status when the pull request cannot be read", async () => {
    github.failPullWith(403);

    await expect(
      resolveHead(
        readContext(COMMENT, () => ON_PULL),
        "token",
      ),
    ).rejects.toThrow(/403 on \/pulls\/42/);
  });
});
