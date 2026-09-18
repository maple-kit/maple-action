/**
 * The merge gate.
 *
 * The check run is held at `in_progress` while any comment is open. A required
 * check passes only on success, skipped or neutral, so in_progress blocks as
 * hard as a failure while still being exitable without a new commit.
 */

import type { Mode } from "./inputs.js";

/** The name the check run is reported under. Pinned in the branch ruleset. */
export const CHECK_NAME = "maple/visual-review";

/** A comment, reduced to what the gate needs to decide. */
export interface GateComment {
  readonly id: string;
  readonly status: "needs_reverify" | "open" | "orphaned" | "resolved";
}

/** What the gate concluded and what it should report. */
export interface GateOutcome {
  readonly status: "completed" | "in_progress";
  /** Absent while the run is still in progress. */
  readonly conclusion?: "neutral" | "success";
  readonly openCount: number;
  readonly summary: string;
}

/** Statuses that hold the gate closed. `resolved` is the only one that does not. */
const BLOCKING = new Set(["open", "needs_reverify"]);

/** True when `comment` should hold the merge. */
function blocks(comment: GateComment, failOnOrphaned: boolean): boolean {
  if (comment.status === "orphaned") return failOnOrphaned;
  return BLOCKING.has(comment.status);
}

/**
 * Decides what the check run should say.
 *
 * With no comments at all the conclusion is `neutral`, not `success`: the gate
 * reports on every pull request, including forks and ones with no preview, so
 * that a required-check rule is never the thing standing between a team and a
 * merge it cannot make.
 */
export function decideGate(
  comments: readonly GateComment[],
  options: { readonly failOnOrphaned: boolean; readonly hasReview: boolean },
): GateOutcome {
  if (!options.hasReview) {
    return {
      status: "completed",
      conclusion: "neutral",
      openCount: 0,
      summary: "No Maple review on this pull request.",
    };
  }

  const open = comments.filter((comment) => blocks(comment, options.failOnOrphaned));
  if (open.length === 0) {
    return {
      status: "completed",
      conclusion: "success",
      openCount: 0,
      summary: `All ${comments.length} visual review comment(s) resolved.`,
    };
  }

  return {
    status: "in_progress",
    openCount: open.length,
    summary: `${open.length} of ${comments.length} visual review comment(s) still open.`,
  };
}

/** A merge-queue run passes immediately; the review happened on the pull request. */
export function isMergeGroup(eventName: string): boolean {
  return eventName === "merge_group";
}

/** True when the mode writes to the pull request and so needs a write token. */
export function needsWriteAccess(mode: Mode): boolean {
  return mode === "sync";
}
