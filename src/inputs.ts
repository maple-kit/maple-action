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
  const appId = readInput(env, "app-id");

  return {
    mode,
    token,
    requireApproval: readFlag(env, "require-approval"),
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
