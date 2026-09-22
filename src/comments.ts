/**
 * Reading the comments the gate decides on.
 *
 * The store is built per run from the run's own token. Everything about how it
 * retries, times out, reports a failure and degrades around a capability the
 * backend lacks is `createCommentStore`'s; what is here is which repository to
 * read and how to follow a cursor to the end.
 */

import { createCommentStore } from "@maple-kit/core";
import { githubStore } from "@maple-kit/core/connectors";

import type { Comment, CommentStore } from "@maple-kit/core";
import type { RunContext } from "./context.js";

/** Pages one run will follow. 100 comments each; a pull request with more is not a review. */
const MAX_PAGES = 20;

/** Builds the store this run reads through. */
export function storeFor(context: RunContext, token: string): CommentStore {
  return createCommentStore(
    githubStore({
      owner: context.owner,
      repo: context.repo,
      baseUrl: context.apiUrl,
      token,
      pull: { ...(context.sha === undefined ? {} : { commit: context.sha }), matches: sameSurface },
    }),
  );
}

/**
 * Whether a head branch is the surface an identifier names.
 *
 * A preview hostname has to be a DNS label, so the identifier a reviewer's
 * browser knows is usually the branch with its slashes flattened. Comparing
 * both flattened costs nothing and resolves the common preview naming.
 */
export function sameSurface(head: string, identifier: string): boolean {
  return slug(head) === slug(identifier);
}

function slug(ref: string): string {
  return ref
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");
}

/**
 * Every comment on the surface, following the cursor to the end.
 *
 * @throws {Error} when the store fails, or when there are more pages than one
 * run will follow. Both are "I cannot tell", and a partial list is worse than
 * none: a comment nobody read is a comment that cannot hold the gate.
 */
export async function readComments(store: CommentStore, branch: string): Promise<Comment[]> {
  const all: Comment[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const listed = await store.list({ branch, ...(cursor === undefined ? {} : { cursor }) });
    all.push(...listed.comments);
    if (listed.cursor === undefined) return all;
    cursor = listed.cursor;
  }

  throw new Error(`More than ${String(MAX_PAGES)} pages of comments on ${branch}.`);
}
