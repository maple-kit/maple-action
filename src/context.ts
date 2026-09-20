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
  /** `GITHUB_API_URL`, so an Enterprise Server run reaches its own API. */
  readonly apiUrl: string;
  /** The ref this run is on, as a label for a surface the inputs did not name. */
  readonly ref: string;
  /**
   * The commit a verdict is about: a pull request's head, or a merge-queue
   * entry's. Absent on a run that is neither. Never `GITHUB_SHA`, which on a
   * `pull_request` event is the merge commit GitHub invented.
   */
  readonly sha?: string;
  /** The pull request's number, absent when the run is not on one. */
  readonly pull?: number;
  /**
   * True when the head is a fork. Its token is read-only however the workflow
   * declares its permissions, so `sync` degrades instead of failing.
   */
  readonly fork: boolean;
}

/** Raised when the environment is not one this action can run in. */
export class MissingContextError extends Error {
  override readonly name = "MissingContextError";

  constructor(variable: string) {
    super(`${variable} is not set; this action only runs inside GitHub Actions.`);
  }
}

/** The event payload, trimmed to the fields read out of it. */
interface EventPayload {
  readonly pull_request?: {
    readonly number?: number;
    readonly head?: { readonly sha?: string; readonly repo?: { readonly full_name?: string } };
  };
  readonly merge_group?: { readonly head_sha?: string };
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

  return {
    owner,
    repo,
    eventName: env["GITHUB_EVENT_NAME"] ?? "",
    apiUrl: env["GITHUB_API_URL"] ?? "https://api.github.com",
    ref: env["GITHUB_REF_NAME"] ?? "",
    ...surfaceOf(eventPayload(env, read), repository),
  };
}

/** What the payload says about the surface: its commit, its number, whose it is. */
function surfaceOf(
  payload: EventPayload | undefined,
  repository: string,
): Pick<RunContext, "fork" | "pull" | "sha"> {
  const sha = payload?.pull_request?.head?.sha ?? payload?.merge_group?.head_sha;
  const pull = payload?.pull_request?.number;
  const head = payload?.pull_request?.head?.repo?.full_name;

  return {
    fork: head !== undefined && head !== repository,
    ...(sha === undefined ? {} : { sha }),
    ...(pull === undefined ? {} : { pull }),
  };
}

/**
 * A payload that cannot be read is a run with no pull request, not a failure:
 * a `push` or a `schedule` has no `pull_request` in it either.
 */
function eventPayload(
  env: NodeJS.ProcessEnv,
  read: (path: string) => string,
): EventPayload | undefined {
  const path = env["GITHUB_EVENT_PATH"];
  if (path === undefined || path === "") return undefined;

  try {
    return JSON.parse(read(path)) as EventPayload;
  } catch {
    return undefined;
  }
}
