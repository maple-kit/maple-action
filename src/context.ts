/**
 * What the run itself says about where it is.
 *
 * Inputs come from the workflow author; this comes from GitHub. The two are
 * kept apart because a wrong input is a mistake somebody can fix and a missing
 * environment variable means the action is not running in Actions at all.
 */

import { readFileSync } from "node:fs";

/** The repository, event and commit one run is about. */
export interface RunContext {
  readonly owner: string;
  readonly repo: string;
  readonly eventName: string;
  /**
   * The pull request's head commit, absent when the run is not on one. Never
   * `GITHUB_SHA`, which on a `pull_request` event is the merge commit GitHub
   * invented and not the commit a reviewer looked at.
   */
  readonly sha?: string;
}

/** Raised when the environment is not one this action can run in. */
export class MissingContextError extends Error {
  override readonly name = "MissingContextError";

  constructor(variable: string) {
    super(`${variable} is not set; this action only runs inside GitHub Actions.`);
  }
}

/** The event payload, trimmed to the one field read out of it. */
interface EventPayload {
  readonly pull_request?: { readonly head?: { readonly sha?: string } };
}

/** Reads the context out of the environment. `read` is injected in tests. */
export function readContext(
  env: NodeJS.ProcessEnv,
  read: (path: string) => string = (path) => readFileSync(path, "utf8"),
): RunContext {
  const repository = env["GITHUB_REPOSITORY"] ?? "";
  const [owner, repo] = repository.split("/");
  if (owner === undefined || repo === undefined || repo === "") {
    throw new MissingContextError("GITHUB_REPOSITORY");
  }

  const sha = headSha(env, read);
  return { owner, repo, eventName: env["GITHUB_EVENT_NAME"] ?? "", ...(sha ? { sha } : {}) };
}

/**
 * A payload that cannot be read is a run with no pull request, not a failure:
 * a `push` or a `schedule` has no `pull_request` in it either.
 */
function headSha(env: NodeJS.ProcessEnv, read: (path: string) => string): string | undefined {
  const path = env["GITHUB_EVENT_PATH"];
  if (path === undefined || path === "") return undefined;

  try {
    return (JSON.parse(read(path)) as EventPayload).pull_request?.head?.sha;
  } catch {
    return undefined;
  }
}
