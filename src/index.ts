/**
 * The action's entrypoint.
 *
 * It works out what the run is about, reads the comments through
 * `@maple-kit/core`, and asks `decideGate` for the verdict. Publishing that
 * verdict as a check run is the next slice; today it reaches the outputs.
 */

import { appendFileSync } from "node:fs";

import { decideGate } from "@maple-kit/core/gate";

import { storeFor, readComments } from "./comments.js";
import { readContext } from "./context.js";
import { isMergeGroup, outputsFor } from "./gate.js";
import { readInputs } from "./inputs.js";

import type { GateVerdict } from "@maple-kit/core";

import type { RunContext } from "./context.js";
import type { Inputs } from "./inputs.js";

/** What a surface Maple is not reviewing concludes: neutral, and saying so. */
const NO_REVIEW = decideGate(undefined, { hasReview: false });

/** Writes an action output, the only supported way since the set-output removal. */
function setOutput(name: string, value: string): void {
  const file = process.env["GITHUB_OUTPUT"];
  if (file === undefined) return;
  appendFileSync(file, `${name}=${value}\n`, "utf8");
}

/** Writes every output a verdict produces. */
function report(verdict: GateVerdict): void {
  for (const [name, value] of Object.entries(outputsFor(verdict))) setOutput(name, value);
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * The verdict for one pull request.
 *
 * A store that throws is `undefined`, which `decideGate` reads as neutral. It
 * is deliberately not a failure: a gate that cannot see must not block, and an
 * action that exits 1 blocks with no way for a reviewer to tell why.
 */
async function verdictFor(context: RunContext, inputs: Inputs): Promise<GateVerdict> {
  const store = storeFor(context, inputs.token);
  const comments = await readComments(store, inputs.branch).catch((error: unknown) => {
    process.stderr.write(`::warning::Maple could not read the comments: ${messageOf(error)}\n`);
    return undefined;
  });

  return decideGate(comments, { statusTracked: store.capabilities.setStatus });
}

/** Reads the run, decides, and reports. Never throws; sets the exit code instead. */
async function main(): Promise<void> {
  try {
    const context = readContext(process.env);

    // Before the inputs, not after: a merge-queue entry has nobody to comment
    // on it and a run off a pull request has no head ref, so validating one
    // would fail the very runs that have to pass.
    if (isMergeGroup(context.eventName) || context.sha === undefined) {
      report(NO_REVIEW);
      return;
    }

    const inputs = readInputs(process.env);
    report(await verdictFor(context, inputs));
  } catch (error) {
    process.stderr.write(`::error::${messageOf(error)}\n`);
    process.exitCode = 1;
  }
}

void main();
