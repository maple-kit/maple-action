/**
 * What the run itself says about where it is.
 *
 * Inputs come from the workflow author; this comes from GitHub. The two are
 * kept apart because a wrong input is a mistake somebody can fix and a missing
 * environment variable means the action is not running in Actions at all.
 */

import { readFileSync } from "node:fs";

import { request } from "./sync.js";

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
  /**
   * The pull request's head branch, known only when it had to be fetched: a
   * run on `issue_comment` has no `GITHUB_HEAD_REF` to read it from.
   */
  readonly headRef?: string;
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
  readonly issue?: { readonly number?: number; readonly pull_request?: object };
}

/** The part of `GET /pulls/{n}` this action reads. */
interface PullResponse {
  readonly head?: {
    readonly sha?: string;
    readonly ref?: string;
    readonly repo?: { readonly full_name?: string } | null;
  };
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
  const pull = payload?.pull_request?.number ?? commentedPull(payload);
  const head = payload?.pull_request?.head?.repo?.full_name;

  return {
    fork: head !== undefined && head !== repository,
    ...(sha === undefined ? {} : { sha }),
    ...(pull === undefined ? {} : { pull }),
  };
}

/**
 * The number of the pull request a comment is on. A comment on a plain issue
 * carries no `pull_request` marker and is not a pull request.
 */
function commentedPull(payload: EventPayload | undefined): number | undefined {
  return payload?.issue?.pull_request === undefined ? undefined : payload.issue.number;
}

/**
 * Fills in the head of a pull request an `issue_comment` run is about.
 *
 * That payload names the pull request and nothing of its head, so the head is
 * asked of the API. Only the API: nothing is checked out and no code from the
 * pull request runs, which is what keeps a comment on a fork's pull request from
 * being a way to run it with this token. Every other event returns unchanged.
 *
 * @throws {Error} when the pull request cannot be read, because a verdict with
 * no commit to attach to has nowhere to go.
 */
export async function resolveHead(context: RunContext, token: string): Promise<RunContext> {
  if (context.eventName !== "issue_comment" || context.pull === undefined) return context;

  const { head } = await request<PullResponse>(context, token, `/pulls/${String(context.pull)}`);
  if (head?.sha === undefined || head.ref === undefined) {
    throw new Error(`GitHub returned no head for pull request ${String(context.pull)}.`);
  }

  const repository = `${context.owner}/${context.repo}`;
  return {
    ...context,
    sha: head.sha,
    headRef: head.ref,
    fork: head.repo?.full_name !== undefined && head.repo.full_name !== repository,
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
