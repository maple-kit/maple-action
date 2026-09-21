/**
 * The parts of the gate that belong to the action rather than to the decision.
 *
 * `decideGate` in `@maple-kit/core/gate` decides and `githubGate` publishes.
 * Neither is restated here: a second copy of a decision is a second answer to
 * the same question, and the two drift without anything looking wrong.
 */

import { githubGate } from "@maple-kit/core/connectors";

import type { GateConnector, GateVerdict } from "@maple-kit/core";

import type { RunContext } from "./context.js";
import type { Mode } from "./inputs.js";

/** A merge-queue run passes immediately; the review happened on the pull request. */
export function isMergeGroup(eventName: string): boolean {
  return eventName === "merge_group";
}

/** True when the mode writes to the pull request and so needs a write token. */
export function needsWriteAccess(mode: Mode): boolean {
  return mode === "sync";
}

/**
 * The connector that publishes `maple/visual-review` for this run.
 *
 * Hand-rolling the Checks API is how a gate ends up parked at `completed` and
 * unable to reopen. `githubGate` is contract-tested against the property that
 * matters: a blocked commit can become clear with no new push.
 */
export function gateFor(context: RunContext, token: string, appId?: string): GateConnector {
  return githubGate({
    owner: context.owner,
    repo: context.repo,
    baseUrl: context.apiUrl,
    token,
    ...(appId === undefined ? {} : { appId }),
  });
}

/**
 * The verdict as the action's outputs.
 *
 * `reason` is here because that is what it is for: a workflow can branch on
 * `no-review` or `unreadable`, and cannot branch on a summary sentence.
 */
export function outputsFor(verdict: GateVerdict): Record<string, string> {
  return {
    conclusion: verdict.conclusion,
    reason: verdict.reason,
    "open-count": String(verdict.open),
  };
}
