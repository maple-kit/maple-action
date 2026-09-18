# maple-action

The GitHub Action for [Maple](https://github.com/maple-kit/maple): it writes the
visual review comments onto a pull request, and holds the merge until they are
resolved.

**Status: skeleton.** The inputs, outputs and the gate decision are implemented
and tested. The GitHub API calls behind them arrive with the collaborative
layer.

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

- **Comments open** → the run is held at `in_progress`. A required check passes
  only on `success`, `skipped` or `neutral`, so this blocks a merge as hard as a
  failure while still being exitable without pushing a new commit.
- **All resolved** → `completed` / `success`.
- **No Maple review on the pull request** → `completed` / `neutral`.

That last case matters more than it looks. Forks, Dependabot pull requests and
anything without a preview deployment all reach the gate. A gate that blocks
them is a gate someone deletes from the ruleset within a week, so it reports
`neutral` and gets out of the way.

Needs no write permissions at all.

## Inputs

| Input              | Required | Default                     | Meaning                                                  |
| ------------------ | -------- | --------------------------- | -------------------------------------------------------- |
| `mode`             | yes      | —                           | `sync` or `gate`.                                        |
| `branch`           | no       | the pull request's head ref | Which branch's comments to act on.                       |
| `token`            | no       | `${{ github.token }}`       | Token for the API calls.                                 |
| `fail-on-orphaned` | no       | `true`                      | Treat a comment Maple could not re-anchor as unresolved. |

## Outputs

| Output       | Meaning                                       |
| ------------ | --------------------------------------------- |
| `open-count` | Comments still holding the gate.              |
| `conclusion` | The check run's conclusion, or `in_progress`. |

## Merge queues

A `merge_group` run passes immediately. The review happened on the pull request;
re-running it in the queue is what leaves a merge queue hung, and that failure
has sunk this exact feature in other tools.

## Notes for maintainers

- `dist/` is **committed**. A JavaScript action runs what is in the repository,
  not what a build produces, and CI fails if the bundle is out of date.
- Built for `node24`. Node 20 was removed from the runners, so there is no
  fallback to fall back to.
- `pull_request_target` is not documented and not supported. Running untrusted
  code with a write token is not a trade-off worth offering.

## Licence

Apache-2.0. Sign off your commits with `git commit -s`; see [DCO](DCO).
