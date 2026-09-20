/**
 * Reading the action's inputs.
 *
 * GitHub passes inputs as INPUT_<NAME> environment variables with the name
 * uppercased and spaces replaced. Reading them directly keeps the bundle small
 * and the behaviour easy to test.
 */

/** Which of the two things the action was asked to do. */
export type Mode = "gate" | "sync";

/** Every input, already validated. */
export interface Inputs {
  readonly mode: Mode;
  readonly branch: string;
  readonly token: string;
}

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
 * Validates every input at once.
 *
 * @throws {InvalidInputError} on the first input that is missing or invalid.
 */
export function readInputs(env: NodeJS.ProcessEnv): Inputs {
  const mode = readInput(env, "mode");
  if (mode !== "sync" && mode !== "gate") {
    throw new InvalidInputError("mode", `must be "sync" or "gate", received "${mode}"`);
  }

  const token = readInput(env, "token");
  if (token === "") throw new InvalidInputError("token", "is required");

  const branch = readInput(env, "branch") || (env["GITHUB_HEAD_REF"] ?? "");
  if (branch === "") {
    throw new InvalidInputError("branch", "is required when the run has no head ref");
  }

  return { mode, branch, token };
}
