import { decideGate } from "@maple-kit/core/gate";
import { storedComment } from "@maple-kit/core/testing";
import { describe, expect, it } from "vitest";

import { isMergeGroup, needsWriteAccess, outputsFor } from "../src/gate.js";

import type { Comment } from "@maple-kit/core";

/** The decision's own fixture, so this test cannot disagree with it. */
function comment(status: Comment["status"], id: string): Comment {
  return storedComment({ id, status });
}

describe("the merge queue", () => {
  it("recognises a merge_group run", () => {
    expect(isMergeGroup("merge_group")).toBe(true);
    expect(isMergeGroup("pull_request")).toBe(false);
  });
});

describe("permissions", () => {
  it("needs write access only to sync", () => {
    expect(needsWriteAccess("sync")).toBe(true);
    expect(needsWriteAccess("gate")).toBe(false);
  });
});

describe("the verdict as outputs", () => {
  it("reports an open comment as blocked, with its count and reason", () => {
    const verdict = decideGate([comment("open", "c_1"), comment("resolved", "c_2")]);

    expect(outputsFor(verdict)).toEqual({
      conclusion: "blocked",
      reason: "comments-open",
      "open-count": "1",
    });
  });

  it("reports a resolved surface as clear", () => {
    expect(outputsFor(decideGate([comment("resolved", "c_1")]))).toMatchObject({
      conclusion: "clear",
      reason: "all-resolved",
    });
  });

  it("reports a pull request Maple never reviewed as neutral, not blocked", () => {
    expect(outputsFor(decideGate(undefined, { hasReview: false }))).toEqual({
      conclusion: "neutral",
      reason: "no-review",
      "open-count": "0",
    });
  });

  it("writes every value as a string, because an output has no other type", () => {
    const values = Object.values(outputsFor(decideGate(undefined)));

    expect(values.every((value) => typeof value === "string")).toBe(true);
  });
});
