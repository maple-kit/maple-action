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

/** A fake repository: one pull request, its comments, and what it answers with. */
export interface GitHubFake {
  readonly handlers: RequestHandler[];
  /** Puts `comments` on the pull request, one issue comment each. */
  put(...comments: readonly Comment[]): void;
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
  let comments: readonly Comment[] = [];
  let size = 100;
  let failure: number | undefined;
  let pages = 0;
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
      const body = comments.slice(from, from + size).map(issueComment);
      const last = from + size >= comments.length;

      return HttpResponse.json(body, {
        headers: last ? {} : { link: `<${request.url}>; rel="next"` },
      });
    }),
  ];

  return {
    handlers,
    put: (...put) => {
      comments = put;
    },
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
      comments = [];
      size = 100;
      failure = undefined;
      pages = 0;
    },
  };
}

/** What the store wrote: the table a person reads, with the fence under it. */
function issueComment(comment: Comment, index: number): { id: number; body: string } {
  return {
    id: 1000 + index,
    body: exportMarkdown([comment], { branch: comment.branch }).markdown,
  };
}
