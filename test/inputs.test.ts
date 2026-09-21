import { describe, expect, it } from "vitest";

import { InvalidInputError, readInput, readInputs } from "../src/inputs.js";

const BASE = { INPUT_MODE: "gate", INPUT_TOKEN: "t", GITHUB_HEAD_REF: "feature/x" };

describe("readInput", () => {
  it("maps a name to its INPUT_ variable", () => {
    expect(readInput({ INPUT_MODE: "sync" }, "mode")).toBe("sync");
  });

  it("replaces spaces with underscores", () => {
    expect(readInput({ INPUT_HEAD_REF: "feature/x" }, "head ref")).toBe("feature/x");
  });

  it("trims surrounding whitespace", () => {
    expect(readInput({ INPUT_MODE: "  sync  " }, "mode")).toBe("sync");
  });

  it("returns an empty string when unset", () => {
    expect(readInput({}, "mode")).toBe("");
  });
});

describe("readInputs", () => {
  it("accepts a valid environment", () => {
    expect(readInputs(BASE)).toEqual({ mode: "gate", branch: "feature/x", token: "t" });
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

  it("reads the App the token acts as", () => {
    expect(readInputs({ ...BASE, "INPUT_APP-ID": "15368" }).appId).toBe("15368");
  });

  it("leaves the App absent when nothing set one", () => {
    expect(readInputs(BASE).appId).toBeUndefined();
  });

  it("leaves the branch absent when there is no head ref to fall back to", () => {
    expect(readInputs({ INPUT_MODE: "gate", INPUT_TOKEN: "t" }).branch).toBeUndefined();
  });
});
