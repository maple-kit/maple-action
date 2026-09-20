import './sourcemap-register.cjs';import { createRequire as __WEBPACK_EXTERNAL_createRequire } from "module";
var __webpack_exports__ = {};

;// CONCATENATED MODULE: external "node:fs"
const external_node_fs_namespaceObject = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:fs");
;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+core@0.2.0_vitest@5.0.1_@types+node@26.6.1_vite@8.3.0_@types+node@26.6.1__/node_modules/@maple-kit/core/dist/gate/decide.js
//#region src/gate/decide.ts
const BLOCKING_STATUSES = [
	"open",
	"needs_reverify",
	"orphaned"
];
const LISTED = 10;
function decideGate(comments, options = {}) {
	if (options.hasReview === false) return neutral("no-review", "No visual review on this pull request", "Maple is not reviewing this pull request, so this check has nothing to hold it on.");
	if (comments === void 0) return neutral("unreadable", NOT_CHECKED, `Maple could not read the comments${NO_ANSWER}`);
	if (options.statusTracked === false) return neutral("status-untracked", NOT_CHECKED, `This store cannot record whether a comment was resolved${NO_ANSWER}`);
	const blockOn = options.blockOn ?? BLOCKING_STATUSES;
	const blocking = comments.filter((comment) => blockOn.includes(comment.status));
	const counts = {
		open: blocking.length,
		total: comments.length
	};
	if (comments.length === 0) return {
		...counts,
		conclusion: "clear",
		...cleared("no-comments")
	};
	if (blocking.length === 0) return {
		...counts,
		conclusion: "clear",
		...cleared("all-resolved")
	};
	return {
		...counts,
		conclusion: "blocked",
		reason: "comments-open",
		title: `${String(blocking.length)} of ${String(comments.length)} ${plural(comments.length)} still open`,
		summary: listing(comments, blocking)
	};
}
function cleared(reason) {
	return {
		reason,
		title: reason === "no-comments" ? "No visual review comments" : "Every comment is resolved",
		summary: reason === "no-comments" ? "Nobody has left a visual review comment on this pull request." : "Every visual review comment on this pull request has been resolved."
	};
}
const NOT_CHECKED = "Visual review was not checked";
const NO_ANSWER = ", so this check has nothing to say about them.";
function neutral(reason, title, summary) {
	return {
		conclusion: "neutral",
		reason,
		open: 0,
		total: 0,
		title,
		summary
	};
}
function listing(comments, blocking) {
	const lines = blocking.slice(0, LISTED).map((comment) => `${String(comments.indexOf(comment) + 1)}. ${entry(comment)}`);
	const rest = blocking.length - lines.length;
	if (rest > 0) lines.push(`…and ${String(rest)} more.`);
	return [
		"These comments are still open:",
		"",
		...lines
	].join("\n");
}
function entry(comment) {
	const anchor = comment.anchor.component ?? comment.anchor.source ?? comment.anchor.selector;
	return `${anchor === void 0 ? "" : `\`${anchor}\` — `}${oneLine(comment.body)}${note(comment.status)}`;
}
function note(status) {
	if (status === "orphaned") return " _(unpinned)_";
	return status === "needs_reverify" ? " _(needs re-checking after a new commit)_" : "";
}
function oneLine(body) {
	return body.replaceAll(/\s+/g, " ").trim();
}
function plural(count) {
	return count === 1 ? "comment" : "comments";
}
//#endregion


;// CONCATENATED MODULE: ./src/gate.ts
/**
 * The parts of the gate that belong to the action rather than to the decision.
 *
 * `decideGate` in `@maple-kit/core/gate` decides and `githubGate` publishes.
 * Neither is restated here: a second copy of a decision is a second answer to
 * the same question, and the two drift without anything looking wrong.
 */
/** A merge-queue run passes immediately; the review happened on the pull request. */
function isMergeGroup(eventName) {
    return eventName === "merge_group";
}
/** True when the mode writes to the pull request and so needs a write token. */
function needsWriteAccess(mode) {
    return mode === "sync";
}
/**
 * The verdict as the action's outputs.
 *
 * `reason` is here because that is what it is for: a workflow can branch on
 * `no-review` or `unreadable`, and cannot branch on a summary sentence.
 */
function outputsFor(verdict) {
    return {
        conclusion: verdict.conclusion,
        reason: verdict.reason,
        "open-count": String(verdict.open),
    };
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
    return { mode, branch, token };
}

;// CONCATENATED MODULE: ./src/index.ts
/**
 * The action's entrypoint.
 *
 * It reads the inputs, asks `@maple-kit/core` for the verdict and writes it to
 * the outputs. Reading the comments and publishing the check run are wired in
 * the slices after this one; the decision they feed is already this one.
 */




/**
 * What a surface Maple is not reviewing concludes: neutral, and saying so.
 *
 * A merge-queue entry has nobody to comment on it, and until the store is
 * wired every run is in the same position for a duller reason.
 */
const NO_REVIEW = decideGate(undefined, { hasReview: false });
/** Writes an action output, the only supported way since the set-output removal. */
function setOutput(name, value) {
    const file = process.env["GITHUB_OUTPUT"];
    if (file === undefined)
        return;
    (0,external_node_fs_namespaceObject.appendFileSync)(file, `${name}=${value}\n`, "utf8");
}
/** Writes every output a verdict produces. */
function report(verdict) {
    for (const [name, value] of Object.entries(outputsFor(verdict)))
        setOutput(name, value);
}
/** Reads inputs, decides, and reports. Never throws; sets the exit code instead. */
function main() {
    try {
        // Before the inputs, not after: a merge-queue run has no head ref to read,
        // so validating one would fail the very run that has to pass immediately.
        if (isMergeGroup(process.env["GITHUB_EVENT_NAME"] ?? "")) {
            report(NO_REVIEW);
            return;
        }
        readInputs(process.env);
        report(NO_REVIEW);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        process.stderr.write(`::error::${message}\n`);
        process.exitCode = 1;
    }
}
main();


//# sourceMappingURL=index.js.map