# maple-action

The GitHub Action for [Maple](https://github.com/maple-kit/maple): it writes the
visual review comments onto a pull request, and holds the merge until they are
resolved.

**Status: partly wired.** The action reads the pull request's real Maple
comments through `@maple-kit/core` and decides with `decideGate`. What is
missing is the publication: nothing posts the `maple/visual-review` check run
yet, so the verdict reaches the outputs and nothing else. `sync` is not
implemented.

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
      pull-requests: write # sync only; gate needs no write access
    steps:
      - uses: maple-kit/maple-action@v1
        with:
          mode: sync

      - uses: maple-kit/maple-action@v1
        with:
          mode: gate
```

**Run `sync` before `gate`.** A reviewer who hits a blocked merge should be able
to read, on the pull request, which comments are holding it.

### `sync`

Writes a single sticky comment: a human-readable table of the open comments,
with a ` ```maple ` JSON fence under it that an agent reads.

The fence is deliberately visible. The GitHub Action that hands a pull request
body to a coding agent strips `<!-- -->` before the model sees it, so anything
hidden in an HTML comment never arrives.

Needs `pull-requests: write` and an explicit `contents: read`.

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

Needs no write permissions at all to decide. Posting the check run needs
`checks: write`, which arrives with the publication.

The pull request is found by the run's head commit — `GET /commits/{sha}/pulls`
names it rather than inferring it — falling back to the head branch's name and
then to a comparison that flattens both, because a preview hostname has to be a
DNS label and `feature/ABC-1` reaches the browser as `feature-abc-1`.

A read that fails is `neutral`, never a failed step: a gate that cannot see
must not block, and an action that exits 1 blocks with nothing a reviewer can
act on. The step annotates the run with why.

## Inputs

| Input    | Required | Default                     | Meaning                            |
| -------- | -------- | --------------------------- | ---------------------------------- |
| `mode`   | yes      | —                           | `sync` or `gate`.                  |
| `branch` | no       | the pull request's head ref | Which branch's comments to act on. |
| `token`  | no       | `${{ github.token }}`       | Token for the API calls.           |

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

A `merge_group` run passes immediately, before an input is even validated: a
merge-queue ref has no head ref to read, so validating one would fail the very
run that has to pass. The review happened on the pull request; re-running it in
the queue is what leaves a merge queue hung, and that failure has sunk this
exact feature in other tools.

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

## Licence

Apache-2.0. Sign off your commits with `git commit -s`; see [DCO](DCO).
