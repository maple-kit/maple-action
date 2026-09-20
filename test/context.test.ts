import { describe, expect, it } from "vitest";

import { MissingContextError, readContext } from "../src/context.js";

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
