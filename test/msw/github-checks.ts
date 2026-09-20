/**
 * A fake of the check-run endpoints the gate publishes through.
 *
 * The same shape as maple's, trimmed to what the action drives: what is under
 * test here is that a run is created on the right commit at all, not the
 * connector's own behaviour, which its contract suite already covers.
 */

import { http, HttpResponse } from "msw";

import type { RequestHandler } from "msw";

const API = "https://api.github.com";

/** One check run, as the fake holds it. */
export interface FakeRun {
  id: number;
  name: string;
  head_sha: string;
  status: string;
  conclusion: string | null;
  external_id: string | null;
  output: { title: string | null; summary: string | null } | null;
}

/** A fake repository's check runs. */
export interface ChecksFake {
  readonly handlers: RequestHandler[];
  /** Every run created on a commit, oldest first. */
  runsOn(sha: string): readonly FakeRun[];
  /** Answers every write with this status instead of creating a run. */
  failWith(status: number): void;
  /** Forgets every run, so one test cannot see another's. */
  reset(): void;
}

/** Creates the fake. */
export function createChecksFake(owner = "maple-kit", repo = "app"): ChecksFake {
  let runs: FakeRun[] = [];
  let nextId = 500;
  let failure: number | undefined;

  /** The 403 a workflow without `checks: write` actually gets. */
  const denied = (): Response | undefined =>
    failure === undefined
      ? undefined
      : HttpResponse.json(
          { message: "Resource not accessible by integration" },
          { status: failure },
        );

  const handlers: RequestHandler[] = [
    http.get(`${API}/repos/${owner}/${repo}/commits/:sha/check-runs`, ({ params, request }) => {
      const name = new URL(request.url).searchParams.get("check_name");
      const matching = runs.filter(
        (run) => run.head_sha === String(params["sha"]) && (name === null || run.name === name),
      );

      const body = matching.slice(-1);
      return HttpResponse.json({ total_count: body.length, check_runs: body });
    }),

    http.post(`${API}/repos/${owner}/${repo}/check-runs`, async ({ request }) => {
      const refused = denied();
      if (refused) return refused;

      const sent = (await request.json()) as Partial<FakeRun>;
      nextId += 1;
      const created: FakeRun = {
        id: nextId,
        name: sent.name ?? "",
        head_sha: sent.head_sha ?? "",
        status: sent.status ?? "queued",
        conclusion: sent.conclusion ?? null,
        external_id: sent.external_id ?? null,
        output: sent.output ?? null,
      };

      runs.push(created);
      return HttpResponse.json(created, { status: 201 });
    }),

    http.patch(`${API}/repos/${owner}/${repo}/check-runs/:id`, async ({ params, request }) => {
      const refused = denied();
      if (refused) return refused;

      const found = runs.find((run) => run.id === Number(params["id"]));
      if (!found) return HttpResponse.json({ message: "Not Found" }, { status: 404 });

      Object.assign(found, await request.json(), { id: found.id });
      return HttpResponse.json(found);
    }),
  ];

  return {
    handlers,
    runsOn: (sha) => runs.filter((run) => run.head_sha === sha),
    failWith: (status) => {
      failure = status;
    },
    reset: () => {
      runs = [];
      nextId = 500;
      failure = undefined;
    },
  };
}
