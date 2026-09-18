import { describe, expect, it } from "vitest";

import { InvalidInputError, readBoolean, readInput, readInputs } from "../src/inputs.js";

const BASE = { INPUT_MODE: "gate", INPUT_TOKEN: "t", GITHUB_HEAD_REF: "feature/x" };

describe("readInput", () => {
  it("maps a name to its INPUT_ variable", () => {
    expect(readInput({ INPUT_MODE: "sync" }, "mode")).toBe("sync");
  });

  it("replaces spaces with underscores", () => {
    expect(readInput({ INPUT_FAIL_ON_ORPHANED: "true" }, "fail on orphaned")).toBe("true");
  });

  it("trims surrounding whitespace", () => {
    expect(readInput({ INPUT_MODE: "  sync  " }, "mode")).toBe("sync");
  });

  it("returns an empty string when unset", () => {
    expect(readInput({}, "mode")).toBe("");
  });
});

describe("readBoolean", () => {
  it("reads true and false", () => {
    expect(readBoolean({ INPUT_X: "true" }, "x", false)).toBe(true);
    expect(readBoolean({ INPUT_X: "false" }, "x", true)).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(readBoolean({ INPUT_X: "TRUE" }, "x", false)).toBe(true);
  });

  it("falls back when unset", () => {
    expect(readBoolean({}, "x", true)).toBe(true);
  });

  it("rejects anything else rather than coercing it", () => {
    expect(() => readBoolean({ INPUT_X: "yes" }, "x", false)).toThrow(InvalidInputError);
  });
});

describe("readInputs", () => {
  it("accepts a valid environment", () => {
    expect(readInputs(BASE)).toEqual({
      mode: "gate",
      branch: "feature/x",
      token: "t",
      failOnOrphaned: true,
    });
  });

  it("prefers an explicit branch over the head ref", () => {
    expect(readInputs({ ...BASE, INPUT_BRANCH: "explicit" }).branch).toBe("explicit");
  });

  it("rejects a mode that is neither sync nor gate", () => {
    expect(() => readInputs({ ...BASE, INPUT_MODE: "deploy" })).toThrow(/must be "sync" or "gate"/);
  });

  it("rejects a missing mode", () => {
    expect(() => readInputs({ ...BASE, INPUT_MODE: "" })).toThrow(InvalidInputError);
  });

  it("rejects a missing token", () => {
    expect(() => readInputs({ ...BASE, INPUT_TOKEN: "" })).toThrow(/is required/);
  });

  it("rejects a run with no branch and no head ref", () => {
    expect(() => readInputs({ INPUT_MODE: "gate", INPUT_TOKEN: "t" })).toThrow(/head ref/);
  });
});
