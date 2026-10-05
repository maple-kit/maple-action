/**
 * `mode: lint`: map the inputs onto `runCiLint` and report what it returns.
 *
 * `runCiLint` in `@maple-kit/cli` does the work, including publishing the
 * `maple/design-lint` check run and writing SARIF. Nothing is restated here,
 * for the same reason as the gate: a second copy drifts.
 */

import { appendFileSync } from "node:fs";

import type { CiLintOptions, CiLintResult } from "@maple-kit/cli";

import type { RunContext } from "./context.js";
import type { LintInputs } from "./inputs.js";

export type RunCiLint = (options: CiLintOptions) => Promise<CiLintResult>;

export type { CiLintOptions, CiLintResult };

/** The one place the CLI is imported, so a test can pass a fake instead. */
export async function loadRunCiLint(): Promise<RunCiLint> {
  return (await import("@maple-kit/cli")).runCiLint;
}

/** The action's inputs as the CLI's options. A run off a pull request is a dry run. */
export function optionsFor(
  lint: LintInputs,
  context: RunContext,
  token: string,
  appId?: string,
): CiLintOptions {
  return {
    url: lint.previewUrl,
    tokenFiles: lint.tokenFiles,
    sarifPath: lint.sarifPath,
    ...(lint.viewports === undefined ? {} : { viewports: lint.viewports }),
    ...(lint.bypassHeaders === undefined ? {} : { bypassHeaders: lint.bypassHeaders }),
    ...(context.sha === undefined
      ? {}
      : {
          publish: {
            token,
            owner: context.owner,
            repo: context.repo,
            headSha: context.sha,
            ...(appId === undefined ? {} : { appId: Number(appId) }),
          },
        }),
  };
}

/** The outputs, in the CLI's own vocabulary: success, failure or neutral. */
export function lintOutputsFor(result: CiLintResult): Record<string, string> {
  return {
    conclusion: result.conclusion,
    "finding-count": String(result.findings.length),
    ...(result.sarifPath === undefined ? {} : { "sarif-path": result.sarifPath }),
    ...(result.checkRunId === undefined ? {} : { "check-run-id": String(result.checkRunId) }),
  };
}

/**
 * Runs lint once. A `failure` fails the step, after the outputs are written;
 * `neutral` does not, because a lint that could not see found nothing.
 */
export async function runLint(
  env: NodeJS.ProcessEnv,
  context: RunContext,
  inputs: { readonly lint: LintInputs; readonly token: string; readonly appId?: string },
  runCiLint: RunCiLint,
): Promise<CiLintResult> {
  const { lint, token, appId } = inputs;
  // A bypass value is a credential: mask it before anything can print it.
  for (const value of Object.values(lint.bypassHeaders ?? {})) {
    if (value !== "") process.stdout.write(`::add-mask::${value}\n`);
  }

  const result = await runCiLint(optionsFor(lint, context, token, appId));

  const file = env["GITHUB_OUTPUT"];
  if (file !== undefined) {
    const lines = Object.entries(lintOutputsFor(result)).map(([k, v]) => `${k}=${v}\n`);
    appendFileSync(file, lines.join(""), "utf8");
  }
  if (result.conclusion === "failure") {
    throw new Error(
      `Maple design lint found ${result.findings.length} finding(s); see maple/design-lint.`,
    );
  }
  return result;
}
