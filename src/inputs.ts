/**
 * Reading the action's inputs.
 *
 * GitHub passes inputs as INPUT_<NAME> environment variables with the name
 * uppercased and spaces replaced. Reading them directly keeps the bundle small
 * and the behaviour easy to test.
 */

/** Which of the things the action was asked to do. */
export type Mode = "gate" | "sync" | "lint";

/** Every input, already validated. */
export interface Inputs {
  readonly mode: Mode;
  readonly token: string;
  /**
   * The App the token acts as. Only the App that created a check run may
   * modify it, so without this the gate abandons its own run.
   */
  readonly appId?: string;
  /**
   * Absent on a run with no head ref to fall back to, such as a merge-queue
   * entry. Required to read comments, which is where it is asked for.
   */
  readonly branch?: string;
  /**
   * True when somebody has to say they looked. It must match what the SDK
   * route was configured with: the two publish the same check name, so a
   * disagreement means a push clears a gate a reviewer is being held by.
   */
  readonly requireApproval: boolean;
  /** Present only in `lint` mode, where it is required. */
  readonly lint?: LintInputs;
}

/** The inputs only `lint` reads. */
export interface LintInputs {
  readonly previewUrl: string;
  readonly tokenFiles: readonly string[];
  readonly viewports?: readonly Viewport[];
  readonly bypassHeaders?: Readonly<Record<string, string>>;
  readonly sarifPath: string;
}

/** One viewport the preview is rendered at. */
export interface Viewport {
  readonly width: number;
  readonly height: number;
}

/** Where SARIF goes when the workflow does not say. */
export const DEFAULT_SARIF_PATH = "maple-design-lint.sarif";

/** Raised when an input is missing or not one of its allowed values. */
export class InvalidInputError extends Error {
  override readonly name = "InvalidInputError";

  constructor(
    readonly input: string,
    reason: string,
  ) {
    super(`Input "${input}" ${reason}.`);
  }
}

/** Reads one input from the environment, trimmed. */
export function readInput(env: NodeJS.ProcessEnv, name: string): string {
  return (env[`INPUT_${name.toUpperCase().replace(/ /g, "_")}`] ?? "").trim();
}

/**
 * Validates every input at once. `headRef` is the branch to fall back to when
 * neither the input nor `GITHUB_HEAD_REF` names one.
 *
 * @throws {InvalidInputError} on the first input that is missing or invalid.
 */
export function readInputs(env: NodeJS.ProcessEnv, headRef = ""): Inputs {
  const mode = readInput(env, "mode");
  if (mode !== "sync" && mode !== "gate" && mode !== "lint") {
    throw new InvalidInputError("mode", `must be "sync", "gate" or "lint", received "${mode}"`);
  }

  const token = readInput(env, "token");
  if (token === "") throw new InvalidInputError("token", "is required");

  const branch = readInput(env, "branch") || (env["GITHUB_HEAD_REF"] ?? "") || headRef;
  const appId = readInput(env, "app-id");

  return {
    mode,
    token,
    requireApproval: readFlag(env, "require-approval"),
    ...(mode === "lint" ? { lint: readLintInputs(env) } : {}),
    ...(branch === "" ? {} : { branch }),
    ...(appId === "" ? {} : { appId }),
  };
}

/**
 * A boolean input. Only "true" is true: an unset input arrives as the empty
 * string, and treating anything non-empty as true would make "false" true.
 */
function readFlag(env: NodeJS.ProcessEnv, name: string): boolean {
  return readInput(env, name).toLowerCase() === "true";
}

/** Entries separated by newlines or commas, blanks dropped. */
function readList(env: NodeJS.ProcessEnv, name: string): string[] {
  return readInput(env, name)
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter((entry) => entry !== "");
}

function readLintInputs(env: NodeJS.ProcessEnv): LintInputs {
  const previewUrl = readInput(env, "preview-url");
  if (previewUrl === "") throw new InvalidInputError("preview-url", "is required in lint mode");
  if (!URL.canParse(previewUrl)) throw new InvalidInputError("preview-url", "is not a URL");

  const tokenFiles = readList(env, "token-files");
  if (tokenFiles.length === 0) {
    throw new InvalidInputError("token-files", "is required in lint mode");
  }

  const viewports = readList(env, "viewports").map(parseViewport);
  const bypassHeaders = parseHeaders(readInput(env, "bypass-header"));

  return {
    previewUrl,
    tokenFiles,
    sarifPath: readInput(env, "sarif-path") || DEFAULT_SARIF_PATH,
    ...(viewports.length === 0 ? {} : { viewports }),
    ...(bypassHeaders === undefined ? {} : { bypassHeaders }),
  };
}

/** "1280x800" is a viewport; anything else is a mistake worth naming. */
function parseViewport(entry: string): Viewport {
  const match = /^(\d+)x(\d+)$/i.exec(entry);
  if (match === null) {
    throw new InvalidInputError(
      "viewports",
      `has "${entry}", expected WIDTHxHEIGHT such as 1280x800`,
    );
  }
  return { width: Number(match[1]), height: Number(match[2]) };
}

/** "Name: value" lines, for a preview behind a protection-bypass header. */
function parseHeaders(raw: string): Record<string, string> | undefined {
  const headers: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    if (line.trim() === "") continue;
    const colon = line.indexOf(":");
    const name = line.slice(0, Math.max(colon, 0)).trim();
    if (name === "") throw new InvalidInputError("bypass-header", 'must be lines of "Name: value"');
    headers[name] = line.slice(colon + 1).trim();
  }
  return Object.keys(headers).length === 0 ? undefined : headers;
}
