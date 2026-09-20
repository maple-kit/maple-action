/**
 * A fake of the GitHub endpoints the store reads through.
 *
 * A fake rather than fixed responses because what is under test is following
 * a cursor: a handler that always answers with the same page cannot express a
 * second page, and the bug it would hide is a gate that reads half a review.
 */

import { exportMarkdown } from "@maple-kit/core/export";
import { http, HttpResponse } from "msw";

import type { Comment } from "@maple-kit/core";
import type { RequestHandler } from "msw";

const API = "https://api.github.com";

/** One issue comment, as the fake holds it. */
export interface StoredComment {
  id: number;
  body: string;
}

/** A fake repository: one pull request, its comments, and what it answers with. */
export interface GitHubFake {
  readonly handlers: RequestHandler[];
  /** Puts `comments` on the pull request, one issue comment each. */
  put(...comments: readonly Comment[]): void;
  /** Every issue comment on the pull request, including ones a run wrote. */
  issueComments(): readonly StoredComment[];
  /** How many comments each page returns, so a suite can force a second one. */
  pageSize(size: number): void;
  /** Answers every comment listing with this status instead of the comments. */
  failWith(status: number): void;
  /** Comment listings served, for asserting that a cursor was followed. */
  pages(): number;
  /** The `authorization` header of every listing served. */
  credentials(): readonly string[];
  /** Forgets everything, so one test cannot see another's. */
  reset(): void;
}

/** Creates the fake. The pull request is 42, on `feature/x` at `commit_sha`. */
export function createGitHubFake(owner = "maple-kit", repo = "app"): GitHubFake {
  let issues: StoredComment[] = [];
  let size = 100;
  let failure: number | undefined;
  let pages = 0;
  let nextId = 2000;
  let credentials: string[] = [];

  const pull = { number: 42, head: { ref: "feature/x" } };

  const handlers: RequestHandler[] = [
    http.get(`${API}/repos/${owner}/${repo}/commits/:sha/pulls`, ({ params }) =>
      HttpResponse.json(String(params["sha"]) === "commit_sha" ? [pull] : []),
    ),

    // Two lookups share this path: the head-branch one carries `head`, and the
    // fallback that `matches` filters lists every open pull request.
    http.get(`${API}/repos/${owner}/${repo}/pulls`, ({ request }) => {
      const head = new URL(request.url).searchParams.get("head");
      if (head === null) return HttpResponse.json([pull]);
      return HttpResponse.json(head === `${owner}:${pull.head.ref}` ? [pull] : []);
    }),

    http.get(`${API}/repos/${owner}/${repo}/issues/:pull/comments`, ({ request }) => {
      pages += 1;
      credentials.push(request.headers.get("authorization") ?? "");
      if (failure !== undefined) {
        return HttpResponse.json({ message: "Bad credentials" }, { status: failure });
      }

      const page = Number(new URL(request.url).searchParams.get("page") ?? "1");
      const from = (page - 1) * size;
      const body = issues.slice(from, from + size);
      const last = from + size >= issues.length;

      return HttpResponse.json(body, {
        headers: last ? {} : { link: `<${request.url}>; rel="next"` },
      });
    }),

    http.post(`${API}/repos/${owner}/${repo}/issues/:pull/comments`, async ({ request }) => {
      if (failure !== undefined) {
        return HttpResponse.json({ message: "Bad credentials" }, { status: failure });
      }

      nextId += 1;
      const created = { id: nextId, body: (await body(request)) ?? "" };
      issues.push(created);
      return HttpResponse.json(created, { status: 201 });
    }),

    http.patch(`${API}/repos/${owner}/${repo}/issues/comments/:id`, async ({ params, request }) => {
      if (failure !== undefined) {
        return HttpResponse.json({ message: "Bad credentials" }, { status: failure });
      }

      const found = issues.find((comment) => comment.id === Number(params["id"]));
      if (!found) return HttpResponse.json({ message: "Not Found" }, { status: 404 });

      found.body = (await body(request)) ?? found.body;
      return HttpResponse.json(found);
    }),
  ];

  return {
    handlers,
    put: (...put) => {
      issues = put.map(issueComment);
    },
    issueComments: () => issues,
    pageSize: (next) => {
      size = next;
    },
    failWith: (status) => {
      failure = status;
    },
    pages: () => pages,
    credentials: () => credentials,
    reset: () => {
      credentials = [];
      issues = [];
      nextId = 2000;
      size = 100;
      failure = undefined;
      pages = 0;
    },
  };
}

/** What the store wrote: the table a person reads, with the fence under it. */
function issueComment(comment: Comment, index: number): StoredComment {
  return {
    id: 1000 + index,
    body: exportMarkdown([comment], { branch: comment.branch }).markdown,
  };
}

/** The `body` field of a write, as the real API reads it. */
async function body(request: Request): Promise<string | undefined> {
  const sent = (await request.json()) as { body?: unknown };
  return typeof sent.body === "string" ? sent.body : undefined;
}
