/**
 * One run of the action, from the environment to the check run.
 *
 * It is here rather than in `index.ts` so that the whole path can be driven by
 * a test with a fake environment. `index.ts` is the three lines that call it.
 */

import { appendFileSync } from "node:fs";

import { decideGate } from "@maple-kit/core/gate";

import { readComments, storeFor } from "./comments.js";
import { readContext } from "./context.js";
import { gateFor, isMergeGroup, outputsFor } from "./gate.js";
import { InvalidInputError, readInputs } from "./inputs.js";
import { stickyBody, syncSticky } from "./sync.js";

import type { Comment, GateVerdict } from "@maple-kit/core";

import type { RunContext } from "./context.js";
import type { Inputs } from "./inputs.js";

/** What a surface Maple is not reviewing concludes: neutral, and saying so. */
const NO_REVIEW = decideGate(undefined, { hasReview: false });

/** Writes the outputs, the only supported way since the set-output removal. */
function report(env: NodeJS.ProcessEnv, verdict: GateVerdict): void {
  const file = env["GITHUB_OUTPUT"];
  if (file === undefined) return;

  const lines = Object.entries(outputsFor(verdict)).map(([name, value]) => `${name}=${value}\n`);
  appendFileSync(file, lines.join(""), "utf8");
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** What one run found: the comments, when it could read them, and the verdict. */
interface Review {
  readonly comments?: readonly Comment[];
  readonly verdict: GateVerdict;
}

/**
 * The review of one pull request.
 *
 * A store that throws leaves `comments` undefined, which `decideGate` reads as
 * neutral. It is deliberately not a failure: a gate that cannot see must not
 * block, and an action that exits 1 blocks with nothing a reviewer can act on.
 */
async function reviewOf(context: RunContext, inputs: Inputs): Promise<Review> {
  if (inputs.branch === undefined) {
    throw new InvalidInputError("branch", "is required when the run has no head ref");
  }

  const store = storeFor(context, inputs.token);
  const comments = await readComments(store, inputs.branch).catch((error: unknown) => {
    process.stderr.write(`::warning::Maple could not read the comments: ${messageOf(error)}\n`);
    return undefined;
  });

  const verdict = decideGate(comments, { statusTracked: store.capabilities.setStatus });
  return { verdict, ...(comments === undefined ? {} : { comments }) };
}

/**
 * Publishes the verdict, and fails the step when it cannot.
 *
 * A gate that quietly failed to publish is a gate that stops holding merges
 * and says nothing, which is worse than one that blocks the workflow loudly.
 */
async function publish(context: RunContext, inputs: Inputs, verdict: GateVerdict): Promise<void> {
  if (context.sha === undefined) return;

  await gateFor(context, inputs.token, inputs.appId).publish({
    branch: inputs.branch ?? context.ref,
    sha: context.sha,
    verdict,
  });
}

/**
 * Writes the sticky comment, and falls back to the step summary rather than
 * failing: a fork's token is read-only whatever the workflow asked for, and a
 * contributor who did nothing wrong should not meet a failed step.
 */
async function sync(env: NodeJS.ProcessEnv, context: RunContext, inputs: Inputs, review: Review) {
  const body = stickyBody(review.verdict, review.comments, inputs.branch ?? context.ref);

  const written = await syncSticky(context, inputs.token, body).catch((error: unknown) => {
    process.stderr.write(`::warning::Maple could not write the comment: ${messageOf(error)}\n`);
    return "skipped" as const;
  });

  if (written === "skipped") appendSummary(env, body);
}

/** The step summary, which every run can write, including one on a fork. */
function appendSummary(env: NodeJS.ProcessEnv, body: string): void {
  const file = env["GITHUB_STEP_SUMMARY"];
  if (file !== undefined) appendFileSync(file, `${body}\n`, "utf8");
}

/**
 * Runs the action once.
 *
 * @throws {Error} on anything that leaves the gate unreported. A read that
 * fails is not one of those; a publish that fails is.
 */
export async function run(env: NodeJS.ProcessEnv): Promise<GateVerdict> {
  const context = readContext(env);

  // A merge-queue entry has nobody to comment on it and a run off a pull
  // request has nothing to read. Both pass, and both are checked before the
  // inputs, because neither has a head ref for `branch` to fall back to.
  const reviewed = !isMergeGroup(context.eventName) && context.sha !== undefined;
  const inputs = readInputs(env);
  const review = reviewed ? await reviewOf(context, inputs) : { verdict: NO_REVIEW };

  if (inputs.mode === "sync" && reviewed) await sync(env, context, inputs, review);
  if (inputs.mode === "gate") await publish(context, inputs, review.verdict);

  report(env, review.verdict);
  return review.verdict;
}
