/**
 * The action's entrypoint.
 *
 * It reads the inputs, asks `@maple-kit/core` for the verdict and writes it to
 * the outputs. Reading the comments and publishing the check run are wired in
 * the slices after this one; the decision they feed is already this one.
 */

import { appendFileSync } from "node:fs";

import { decideGate } from "@maple-kit/core/gate";

import type { GateVerdict } from "@maple-kit/core";

import { isMergeGroup, outputsFor } from "./gate.js";
import { readInputs } from "./inputs.js";

/**
 * What a surface Maple is not reviewing concludes: neutral, and saying so.
 *
 * A merge-queue entry has nobody to comment on it, and until the store is
 * wired every run is in the same position for a duller reason.
 */
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

/** Reads inputs, decides, and reports. Never throws; sets the exit code instead. */
function main(): void {
  try {
    // Before the inputs, not after: a merge-queue run has no head ref to read,
    // so validating one would fail the very run that has to pass immediately.
    if (isMergeGroup(process.env["GITHUB_EVENT_NAME"] ?? "")) {
      report(NO_REVIEW);
      return;
    }

    readInputs(process.env);
    report(NO_REVIEW);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`::error::${message}\n`);
    process.exitCode = 1;
  }
}

main();
