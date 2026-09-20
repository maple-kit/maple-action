/**
 * The action's entrypoint: run once, and turn a throw into a failed step.
 *
 * Everything else is in `run.ts`, which takes the environment as an argument
 * so a test can drive the whole path without a process.
 */

import { run } from "./run.js";

run(process.env).catch((error: unknown) => {
  process.stderr.write(`::error::${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
