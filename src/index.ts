/**
 * The action's entrypoint.
 *
 * Phase 0 wires the inputs, the gate decision and the outputs. The GitHub API
 * calls that sync the comment and post the check run arrive with US2, behind
 * the same decision function that is already tested here.
 */

import { appendFileSync } from "node:fs";

import { decideGate, isMergeGroup } from "./gate.js";
import { readInputs } from "./inputs.js";

/** Writes an action output, the only supported way since the set-output removal. */
function setOutput(name: string, value: string): void {
  const file = process.env["GITHUB_OUTPUT"];
  if (file === undefined) return;
  appendFileSync(file, `${name}=${value}\n`, "utf8");
}

/** Reads inputs, decides, and reports. Never throws; sets the exit code instead. */
function main(): void {
  try {
    const inputs = readInputs(process.env);

    if (isMergeGroup(process.env["GITHUB_EVENT_NAME"] ?? "")) {
      setOutput("open-count", "0");
      setOutput("conclusion", "success");
      return;
    }

    // Until the store is wired, there is no review to report on, so the gate
    // concludes neutral rather than blocking a merge on missing data.
    const outcome = decideGate([], {
      failOnOrphaned: inputs.failOnOrphaned,
      hasReview: false,
    });

    setOutput("open-count", String(outcome.openCount));
    setOutput("conclusion", outcome.conclusion ?? outcome.status);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`::error::${message}\n`);
    process.exitCode = 1;
  }
}

main();
