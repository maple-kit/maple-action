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

import type { GateVerdict } from "@maple-kit/core";

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

/**
 * The verdict for one pull request.
 *
 * A store that throws is `undefined`, which `decideGate` reads as neutral. It
 * is deliberately not a failure: a gate that cannot see must not block, and an
 * action that exits 1 blocks with nothing a reviewer can act on.
 */
async function verdictFor(context: RunContext, inputs: Inputs): Promise<GateVerdict> {
  if (inputs.branch === undefined) {
    throw new InvalidInputError("branch", "is required when the run has no head ref");
  }

  const store = storeFor(context, inputs.token);
  const comments = await readComments(store, inputs.branch).catch((error: unknown) => {
    process.stderr.write(`::warning::Maple could not read the comments: ${messageOf(error)}\n`);
    return undefined;
  });

  return decideGate(comments, { statusTracked: store.capabilities.setStatus });
}

/**
 * Publishes the verdict, and fails the step when it cannot.
 *
 * A gate that quietly failed to publish is a gate that stops holding merges
 * and says nothing, which is worse than one that blocks the workflow loudly.
 */
async function publish(context: RunContext, inputs: Inputs, verdict: GateVerdict): Promise<void> {
  if (context.sha === undefined) return;

  await gateFor(context, inputs.token).publish({
    branch: inputs.branch ?? context.ref,
    sha: context.sha,
    verdict,
  });
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
  const verdict = reviewed ? await verdictFor(context, inputs) : NO_REVIEW;

  if (inputs.mode === "gate") await publish(context, inputs, verdict);
  report(env, verdict);
  return verdict;
}
