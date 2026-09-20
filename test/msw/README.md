# Network mocks

Every network call this action makes is mocked here with
[msw](https://mswjs.io), the same way and with the same conventions as
[maple](https://github.com/maple-kit/maple)'s own `test/msw/`.

- A handler returns the shape the real API returns, including its error shapes.
  A test that only ever sees a 200 is not testing the code that handles a 500.
- Unhandled requests fail the test (`onUnhandledRequest: "error"`). A request
  nobody mocked is a request nobody noticed.
- `github.ts` is a **fake** rather than fixed responses: what is under test is
  following a cursor to the end, and a handler that always answers with the
  same page cannot express a second one. Each suite resets it between tests.
