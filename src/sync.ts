/**
 * The sticky comment `sync` keeps on the pull request.
 *
 * One comment, rewritten in place, so a reviewer who hits a blocked merge can
 * read on the pull request which comments are holding it. It is found again by
 * a marker rather than by remembering an id anywhere.
 */

import { exportMarkdown } from "@maple-kit/core/export";

import type { Comment, GateVerdict } from "@maple-kit/core";

import type { RunContext } from "./context.js";

/**
 * How the comment finds itself again. Hidden, because it is for this action and
 * not for a reader — unlike the fences, which are visible on purpose.
 */
const MARKER = "<!-- maple:visual-review -->";

/** One issue comment, trimmed to what this file reads. */
interface IssueComment {
  readonly id: number;
  readonly body: string;
}

/** What the sticky comment says: the verdict's own title and table. */
export function stickyBody(
  verdict: GateVerdict,
  comments: readonly Comment[] | undefined,
  branch: string,
): string {
  const detail =
    comments === undefined || comments.length === 0
      ? verdict.summary
      : exportMarkdown(comments, { branch, fence: false }).markdown;

  return [MARKER, `### ${verdict.title}`, "", detail, "", FOOTER].join("\n");
}

/**
 * Why this comment carries no ```maple fence, where a reader will look for one.
 * `docs/connectors.md` in maple has what a second fence would cost.
 */
const FOOTER =
  "_Each comment above is a comment of its own on this pull request, carrying " +
  "the `maple` JSON fence an agent reads; this summary carries none, because a " +
  "second copy reads back as a comment nobody can resolve. Resolve a comment in " +
  "the overlay and `maple/visual-review` clears with no new push._";

/** What the sync did, for the step's own log. */
export type SyncResult = "created" | "skipped" | "updated";

/**
 * Writes the sticky comment, or says why it could not.
 *
 * A fork's token is read-only whatever the workflow asked for, so there the
 * body goes to the step summary instead: degrading is right where failing
 * would block a contributor who did nothing wrong.
 */
export async function syncSticky(
  context: RunContext,
  token: string,
  body: string,
): Promise<SyncResult> {
  if (context.pull === undefined || context.fork) return "skipped";

  const existing = await findSticky(context, token);
  if (existing === undefined) {
    await request(context, token, `/issues/${String(context.pull)}/comments`, post("POST", body));
    return "created";
  }

  await request(context, token, `/issues/comments/${String(existing.id)}`, post("PATCH", body));
  return "updated";
}

/** The pages GitHub will be asked for before this gives up looking. */
const MAX_PAGES = 20;
const PAGE_SIZE = 100;

/** The comment this action last wrote, or undefined when it never has. */
async function findSticky(context: RunContext, token: string): Promise<IssueComment | undefined> {
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const path =
      `/issues/${String(context.pull ?? 0)}/comments` +
      `?per_page=${String(PAGE_SIZE)}&page=${String(page)}`;
    const listed = await request<IssueComment[]>(context, token, path);

    const found = listed.find((comment) => comment.body.includes(MARKER));
    if (found) return found;
    if (listed.length < PAGE_SIZE) return undefined;
  }

  return undefined;
}

/** A write of one comment body, as fetch takes it. */
function post(method: "PATCH" | "POST", body: string): RequestInit {
  return { method, body: JSON.stringify({ body }) };
}

/** The three calls this file makes, with GitHub's own message on a failure. */
async function request<T>(
  context: RunContext,
  token: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = `${context.apiUrl}/repos/${context.owner}/${context.repo}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "x-github-api-version": "2022-11-28",
      ...(init.body === undefined ? {} : { "content-type": "application/json" }),
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub ${String(response.status)} on ${path}: ${await detail(response)}`);
  }

  return (await response.json()) as T;
}

async function detail(response: Response): Promise<string> {
  const text = await response.text().catch(() => "");
  try {
    const { message } = JSON.parse(text) as { message?: unknown };
    return typeof message === "string" ? message : text;
  } catch {
    return text || response.statusText;
  }
}
