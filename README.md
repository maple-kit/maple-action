# maple-action

The GitHub Action for [Maple](https://github.com/maple-kit/maple): it writes the
visual review comments onto a pull request, and holds the merge until they are
resolved.

**Status: both modes have now run against a real pull request.** The action
reads the pull request's Maple comments through `@maple-kit/core`, decides with
`decideGate`, publishes `maple/visual-review` through `githubGate`, and keeps
one sticky comment up to date. Every test is against msw; the first live run
was on 2026-09-21, and it found the permission error corrected above.

## Two modes, in this order

```yaml
name: Maple
on: pull_request

permissions:
  contents: read

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      checks: write # gate: the check run it reports
      pull-requests: write # sync writes the comment; gate reads them
    steps:
      - uses: maple-kit/maple-action@v0
        with:
          mode: sync

      - uses: maple-kit/maple-action@v0
        with:
          mode: gate
```

**Run `sync` before `gate`.** A reviewer who hits a blocked merge should be able
to read, on the pull request, which comments are holding it.

### `sync`

Keeps one sticky comment on the pull request: the verdict's own title, the
table of comments, and nothing else. It is found again by a hidden marker and
rewritten in place, so it never becomes a thread of its own.

**It carries no ` ```maple ` fence, on purpose.** Each Maple comment is already
its own comment on the pull request with its own fence, and `githubStore.list`
reads every comment that carries one — so a summary repeating them all would be
read back as one more comment, with an id nothing can resolve. It would hold the
gate for ever. The fences an agent reads are the ones on the comments
themselves.

The fences are deliberately visible, wherever they are. The GitHub Action that
hands a pull request body to a coding agent strips `<!-- -->` before the model
sees it, so anything hidden in an HTML comment never arrives. The marker is an
HTML comment because it is for this action and not for a reader.

Needs `pull-requests: write` and an explicit `contents: read`. **On a fork it
degrades**: a fork's token is read-only however the workflow declares its
permissions, so the same body goes to the step summary instead of failing a
contributor's run.

### `gate`

Reports a check run named `maple/visual-review`.

- **Comments open** (`blocked`) → the run is held at `in_progress`. A required
  check passes only on `success`, `skipped` or `neutral`, so this blocks a merge
  as hard as a failure while still being exitable without pushing a new commit.
- **All resolved, or nobody commented** (`clear`) → `completed` / `success`.
- **No Maple review on the pull request** (`no-review`) → `completed` /
  `neutral`.

That last case matters more than it looks. Forks, Dependabot pull requests and
anything without a preview deployment all reach the gate. A gate that blocks
them is a gate someone deletes from the ruleset within a week, so it reports
`neutral` and gets out of the way.

#### Requiring an approval

`require-approval: "true"` makes a surface with nothing open block until
somebody presses **Approve** in the overlay, instead of clearing. Without it,
a pull request nobody ever opened a preview for is indistinguishable from one
that was reviewed and found clean — both are `no-comments`.

```yaml
- uses: maple-kit/maple-action@v0
  with:
    mode: gate
    require-approval: "true"
```

**It has to match `RouteOptions.requireApproval`.** The action and the SDK route
publish the same check name, so if only one of them requires an approval, a push
clears a gate the other is holding and nothing says why.

Four rules come from `decideGate` rather than from here, and `docs/gate.md` in
the Maple repository argues each:

- An approval is about a **commit**. A push is a new preview, so the approval
  before it does not count toward this one.
- **An open comment outranks a missing approval**, so a reviewer reads
  `comments-open` rather than being told to approve a surface with work on it.
- A store with no `approvals` is `approval-untracked` and **neutral**, never a
  gate that blocks for ever.
- The route needs an identity connector for this, or anyone holding the preview
  URL clears a required check as "Guest".

Needs `checks: write` to publish the run and **`pull-requests: read`** to reach
the comments the verdict is decided from. A token without the second concludes
`unreadable` rather than failing — the gate does not break, it stops seeing,
and a gate that cannot see never blocks. That is the quiet direction to be
wrong in, so it is worth getting right the first time.

It needs no write access to the pull request: that is `sync`'s job, and the two
run as separate jobs here for exactly that reason.

**Why `app-id` exists.** GitHub lets only the App that created a check run
modify it. The gate is published twice by different identities — by this action
at push time as GitHub Actions, and by the SDK route at resolve time as Maple's
own App — so without knowing which App it is, the action cannot find its own
run among them and opens a fresh one every time, leaving the old one at
`in_progress` for ever. The default is GitHub Actions, which is what
`github.token` acts as. Set it only if you pass a token belonging to some other
App.

The pull request is found by the run's head commit — `GET /commits/{sha}/pulls`
names it rather than inferring it — falling back to the head branch's name and
then to a comparison that flattens both, because a preview hostname has to be a
DNS label and `feature/ABC-1` reaches the browser as `feature-abc-1`.

A read that fails is `neutral`, never a failed step: a gate that cannot see
must not block, and an action that exits 1 blocks with nothing a reviewer can
act on. The step annotates the run with why.

A **publish** that fails is the opposite: the step fails. A gate that quietly
did not report is a gate that stops holding merges and says nothing.

Blocked is published as `in_progress` rather than `failure`, and a completed
run is superseded by a new one rather than reopened. Both are `githubGate`'s
doing, and both are what let a reviewer resolve the last comment and watch the
check go green with no new push — the property its contract suite exists to
protect.

## Inputs

| Input    | Required | Default                     | Meaning                            |
| -------- | -------- | --------------------------- | ---------------------------------- |
| `mode`   | yes      | —                           | `sync` or `gate`.                  |
| `branch` | no       | the pull request's head ref | Which branch's comments to act on. |
| `token`  | no       | `${{ github.token }}`       | Token for the API calls.           |
| `app-id` | no       | `15368` (GitHub Actions)    | The App the token acts as.         |

There is no `fail-on-orphaned` input. A comment Maple could not re-anchor holds
the gate, because a layout change that orphans a comment must not be a layout
change that silently clears it. `decideGate`'s `blockOn` is where a team that
disagrees says so, and the action will expose it when somebody asks.

## Outputs

| Output       | Meaning                                                           |
| ------------ | ----------------------------------------------------------------- |
| `open-count` | Comments still holding the gate.                                  |
| `conclusion` | `blocked`, `clear` or `neutral` — Maple's verdict, not the run's. |
| `reason`     | `comments-open`, `all-resolved`, `no-comments`, `no-review`, …    |

`conclusion` is Maple's vocabulary rather than the check run's, because the two
are not the same thing: `blocked` is published as `in_progress`, and both
`clear` and `neutral` pass. Branch on `reason` when a workflow needs to tell a
fork from a store it could not read.

## Merge queues

A `merge_group` run passes immediately: it reads no comments and publishes a
`neutral` run on the queue entry's own head commit, which is in the payload and
not in `GITHUB_HEAD_REF` — a merge-queue ref has no head ref at all. The review
happened on the pull request; re-running it in the queue is what leaves a merge
queue hung, and that failure has sunk this exact feature in other tools.

## Notes for maintainers

- The gate decision lives in `@maple-kit/core`, never here. Three forges will
  publish the same verdict three ways; a second copy of the decision is a second
  answer to the same question.
- `dist/` is **committed**. A JavaScript action runs what is in the repository,
  not what a build produces, and CI fails if the bundle is out of date.
- Built for `node24`. Node 20 was removed from the runners, so there is no
  fallback to fall back to.
- `pull_request_target` is not documented and not supported. Running untrusted
  code with a write token is not a trade-off worth offering.

## Versioning

Tagged `v0.x.y`, with a moving **`v0`** that every release advances. Pin `@v0`
to follow patches, or a full `v0.1.0` to pin exactly.

It is `v0` rather than `v1` because nothing here promises a stable interface
yet, which is the same reason every `@maple-kit/*` package is 0.x. `uses:` reads
a major tag the same way whichever number it carries.

The version is the action's own and does not track `@maple-kit/core`'s. The
action releases when the action changes; core releases when core changes, and
lockstep numbering would diverge the first time either happened alone. Which
core a release bundles is in its release notes.

## Licence

Apache-2.0. Sign off your commits with `git commit -s`; see [DCO](DCO).
