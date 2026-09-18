import { describe, expect, it } from "vitest";

import { CHECK_NAME, decideGate, isMergeGroup, needsWriteAccess } from "../src/gate.js";

import type { GateComment } from "../src/gate.js";

const WITH_REVIEW = { failOnOrphaned: true, hasReview: true };

function comments(...statuses: GateComment["status"][]): GateComment[] {
  return statuses.map((status, index) => ({ id: `c_${index}`, status }));
}

describe("decideGate", () => {
  it("concludes neutral when there is no Maple review at all", () => {
    const outcome = decideGate([], { failOnOrphaned: true, hasReview: false });

    expect(outcome).toMatchObject({ status: "completed", conclusion: "neutral", openCount: 0 });
  });

  it("succeeds when every comment is resolved", () => {
    expect(decideGate(comments("resolved", "resolved"), WITH_REVIEW)).toMatchObject({
      status: "completed",
      conclusion: "success",
      openCount: 0,
    });
  });

  it("stays in_progress while a comment is open", () => {
    const outcome = decideGate(comments("open", "resolved"), WITH_REVIEW);

    expect(outcome.status).toBe("in_progress");
    expect(outcome.conclusion).toBeUndefined();
    expect(outcome.openCount).toBe(1);
  });

  it("never parks at completed/failure", () => {
    const outcome = decideGate(comments("open"), WITH_REVIEW);

    expect(outcome.conclusion).not.toBe("failure");
  });

  it("counts needs_reverify as unresolved", () => {
    expect(decideGate(comments("needs_reverify"), WITH_REVIEW).openCount).toBe(1);
  });

  it("counts an orphan as unresolved by default", () => {
    expect(decideGate(comments("orphaned"), WITH_REVIEW).openCount).toBe(1);
  });

  it("lets an orphan through when fail-on-orphaned is off", () => {
    const outcome = decideGate(comments("orphaned"), { failOnOrphaned: false, hasReview: true });

    expect(outcome.conclusion).toBe("success");
  });

  it("says how many of how many are open", () => {
    expect(decideGate(comments("open", "open", "resolved"), WITH_REVIEW).summary).toBe(
      "2 of 3 visual review comment(s) still open.",
    );
  });
});

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

describe("the check name", () => {
  it("is the name pinned in the branch ruleset", () => {
    expect(CHECK_NAME).toBe("maple/visual-review");
  });
});
