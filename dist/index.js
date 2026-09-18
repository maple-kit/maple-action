import './sourcemap-register.cjs';import { createRequire as __WEBPACK_EXTERNAL_createRequire } from "module";
var __webpack_exports__ = {};

;// CONCATENATED MODULE: external "node:fs"
const external_node_fs_namespaceObject = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:fs");
;// CONCATENATED MODULE: ./src/gate.ts
/**
 * The merge gate.
 *
 * The check run is held at `in_progress` while any comment is open. A required
 * check passes only on success, skipped or neutral, so in_progress blocks as
 * hard as a failure while still being exitable without a new commit.
 */
/** The name the check run is reported under. Pinned in the branch ruleset. */
const CHECK_NAME = "maple/visual-review";
/** Statuses that hold the gate closed. `resolved` is the only one that does not. */
const BLOCKING = new Set(["open", "needs_reverify"]);
/** True when `comment` should hold the merge. */
function blocks(comment, failOnOrphaned) {
    if (comment.status === "orphaned")
        return failOnOrphaned;
    return BLOCKING.has(comment.status);
}
/**
 * Decides what the check run should say.
 *
 * With no comments at all the conclusion is `neutral`, not `success`: the gate
 * reports on every pull request, including forks and ones with no preview, so
 * that a required-check rule is never the thing standing between a team and a
 * merge it cannot make.
 */
function decideGate(comments, options) {
    if (!options.hasReview) {
        return {
            status: "completed",
            conclusion: "neutral",
            openCount: 0,
            summary: "No Maple review on this pull request.",
        };
    }
    const open = comments.filter((comment) => blocks(comment, options.failOnOrphaned));
    if (open.length === 0) {
        return {
            status: "completed",
            conclusion: "success",
            openCount: 0,
            summary: `All ${comments.length} visual review comment(s) resolved.`,
        };
    }
    return {
        status: "in_progress",
        openCount: open.length,
        summary: `${open.length} of ${comments.length} visual review comment(s) still open.`,
    };
}
/** A merge-queue run passes immediately; the review happened on the pull request. */
function isMergeGroup(eventName) {
    return eventName === "merge_group";
}
/** True when the mode writes to the pull request and so needs a write token. */
function needsWriteAccess(mode) {
    return mode === "sync";
}

;// CONCATENATED MODULE: ./src/inputs.ts
/**
 * Reading the action's inputs.
 *
 * GitHub passes inputs as INPUT_<NAME> environment variables with the name
 * uppercased and spaces replaced. Reading them directly keeps the bundle small
 * and the behaviour easy to test.
 */
/** Raised when an input is missing or not one of its allowed values. */
class InvalidInputError extends Error {
    input;
    name = "InvalidInputError";
    constructor(input, reason) {
        super(`Input "${input}" ${reason}.`);
        this.input = input;
    }
}
/** Reads one input from the environment, trimmed. */
function readInput(env, name) {
    return (env[`INPUT_${name.toUpperCase().replace(/ /g, "_")}`] ?? "").trim();
}
/** Reads a boolean input, accepting only the YAML spellings GitHub documents. */
function readBoolean(env, name, fallback) {
    const raw = readInput(env, name).toLowerCase();
    if (raw === "")
        return fallback;
    if (raw === "true")
        return true;
    if (raw === "false")
        return false;
    throw new InvalidInputError(name, `must be "true" or "false", received "${raw}"`);
}
/**
 * Validates every input at once.
 *
 * @throws {InvalidInputError} on the first input that is missing or invalid.
 */
function readInputs(env) {
    const mode = readInput(env, "mode");
    if (mode !== "sync" && mode !== "gate") {
        throw new InvalidInputError("mode", `must be "sync" or "gate", received "${mode}"`);
    }
    const token = readInput(env, "token");
    if (token === "")
        throw new InvalidInputError("token", "is required");
    const branch = readInput(env, "branch") || (env["GITHUB_HEAD_REF"] ?? "");
    if (branch === "") {
        throw new InvalidInputError("branch", "is required when the run has no head ref");
    }
    return { mode, branch, token, failOnOrphaned: readBoolean(env, "fail-on-orphaned", true) };
}

;// CONCATENATED MODULE: ./src/index.ts
/**
 * The action's entrypoint.
 *
 * Phase 0 wires the inputs, the gate decision and the outputs. The GitHub API
 * calls that sync the comment and post the check run arrive with US2, behind
 * the same decision function that is already tested here.
 */



/** Writes an action output, the only supported way since the set-output removal. */
function setOutput(name, value) {
    const file = process.env["GITHUB_OUTPUT"];
    if (file === undefined)
        return;
    (0,external_node_fs_namespaceObject.appendFileSync)(file, `${name}=${value}\n`, "utf8");
}
/** Reads inputs, decides, and reports. Never throws; sets the exit code instead. */
function main() {
    try {
        const inputs = readInputs(process.env);
        if (isMergeGroup(process.env["GITHUB_EVENT_NAME"] ?? "")) {
            setOutput("open-count", "0");
            setOutput("conclusion", "success");
            return;
        }
        // Until the store is wired, there is no review to report on, so the gate
        // concludes neutral rather than blocking a merge on missing data.
        const outcome = decideGate([], {
            failOnOrphaned: inputs.failOnOrphaned,
            hasReview: false,
        });
        setOutput("open-count", String(outcome.openCount));
        setOutput("conclusion", outcome.conclusion ?? outcome.status);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        process.stderr.write(`::error::${message}\n`);
        process.exitCode = 1;
    }
}
main();


//# sourceMappingURL=index.js.map