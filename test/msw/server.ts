/**
 * The msw server every suite that touches the network starts from.
 *
 * The same shape as maple's own harness, so a person moving between the two
 * repositories reads one thing. Handlers are passed in per suite rather than
 * registered globally: a test file declares the requests it expects.
 */

import { setupServer } from "msw/node";

import type { RequestHandler } from "msw";
import type { SetupServer } from "msw/node";

/**
 * Starts a server for the current suite and tears it down afterwards.
 *
 * `onUnhandledRequest: "error"` is the point of it. A request that slips
 * through is a real call to a real service from a test run, and msw's default
 * of warning makes that a line in a log nobody reads.
 */
export function useTestServer(
  handlers: RequestHandler[],
  hooks: {
    beforeAll: (fn: () => void) => void;
    afterEach: (fn: () => void) => void;
    afterAll: (fn: () => void) => void;
  },
): SetupServer {
  const server = setupServer(...handlers);

  hooks.beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  hooks.afterEach(() => server.resetHandlers());
  hooks.afterAll(() => server.close());

  return server;
}
