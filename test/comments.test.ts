import { storedComment } from "@maple-kit/core/testing";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { readComments, sameSurface, storeFor } from "../src/comments.js";
import { createGitHubFake } from "./msw/github.js";
import { useTestServer } from "./msw/server.js";

import type { RunContext } from "../src/context.js";

const CONTEXT: RunContext = {
  owner: "maple-kit",
  repo: "app",
  eventName: "pull_request",
  ref: "feature/x",
  sha: "commit_sha",
};

const github = createGitHubFake();
useTestServer(github.handlers, { beforeAll, afterEach, afterAll });
afterEach(() => {
  github.reset();
});

function store() {
  return storeFor(CONTEXT, "token");
}

describe("the surface a head branch belongs to", () => {
  it("matches a head against the identifier a preview hostname carries", () => {
    expect(sameSurface("feature/ABC-1", "feature-abc-1")).toBe(true);
    expect(sameSurface("feature/ABC-1", "feature/abc-1")).toBe(true);
  });

  it("does not match a different branch", () => {
    expect(sameSurface("feature/ABC-1", "feature-abc-2")).toBe(false);
  });
});

describe("reading the comments", () => {
  it("returns every comment on the pull request", async () => {
    github.put(storedComment({ id: "c_1", status: "open" }), storedComment({ id: "c_2" }));

    const comments = await readComments(store(), "feature/x");

    expect(comments).toHaveLength(2);
    expect(comments[0]?.status).toBe("open");
  });

  it("follows the cursor rather than stopping at the first page", async () => {
    github.pageSize(1);
    github.put(storedComment({ id: "c_1" }), storedComment({ id: "c_2" }));

    expect(await readComments(store(), "feature/x")).toHaveLength(2);
    expect(github.pages()).toBe(2);
  });

  it("is empty when nobody has commented", async () => {
    expect(await readComments(store(), "feature/x")).toEqual([]);
  });

  it("throws rather than returning half a review when the store fails", async () => {
    github.failWith(401);

    await expect(readComments(store(), "feature/x")).rejects.toThrow();
  });

  it("gives up on a server error rather than retrying for ever", async () => {
    github.failWith(500);

    await expect(readComments(store(), "feature/x")).rejects.toThrow();
  });

  it("carries the run's token as a bearer credential", async () => {
    await readComments(store(), "feature/x");

    expect(github.credentials()).toEqual(["Bearer token"]);
  });
});
