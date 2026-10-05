import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { InvalidInputError, readInputs } from "../src/inputs.js";
import { main } from "../src/run.js";

import type { CiLintOptions, CiLintResult } from "../src/lint.js";

const directory = mkdtempSync(join(tmpdir(), "maple-action-lint-"));

/** A lint run's environment on a pull request, with its payload and output on disk. */
function env(overrides: NodeJS.ProcessEnv = {}, onPullRequest = true): NodeJS.ProcessEnv {
  const unique = String(Math.random()).slice(2);
  const eventPath = join(directory, `event-${unique}.json`);
  const outputPath = join(directory, `output-${unique}.txt`);
  writeFileSync(
    eventPath,
    JSON.stringify(
      onPullRequest
        ? { pull_request: { number: 1, head: { sha: "head_sha", repo: { full_name: "o/r" } } } }
        : {},
    ),
  );
  writeFileSync(outputPath, "");
  return {
    GITHUB_REPOSITORY: "o/r",
    GITHUB_EVENT_NAME: "pull_request",
    GITHUB_API_URL: "https://api.github.com",
    GITHUB_EVENT_PATH: eventPath,
    GITHUB_OUTPUT: outputPath,
    INPUT_MODE: "lint",
    INPUT_TOKEN: "minted",
    "INPUT_PREVIEW-URL": "https://preview.example.com",
    "INPUT_TOKEN-FILES": "tokens/a.json\ntokens/b.json",
    "INPUT_SARIF-PATH": "out.sarif",
    ...overrides,
  };
}

function outputs(environment: NodeJS.ProcessEnv): Record<string, string> {
  return Object.fromEntries(
    readFileSync(environment["GITHUB_OUTPUT"] ?? "", "utf8")
      .split("\n")
      .filter((line) => line !== "")
      .map((line) => line.split("=") as [string, string]),
  );
}

/** A fake runCiLint that records its options and answers with `result`. */
// The action only counts findings, so their contents do not matter here.
const finding = {} as CiLintResult["findings"][number];

function fake(result: CiLintResult) {
  const calls: CiLintOptions[] = [];
  const load = () =>
    Promise.resolve((options: CiLintOptions) => {
      calls.push(options);
      return Promise.resolve(result);
    });
  return { calls, load };
}

describe("lint inputs", () => {
  it("parses lists, viewports and bypass headers", () => {
    const { lint } = readInputs(
      env({
        INPUT_VIEWPORTS: "1280x800, 375x667",
        "INPUT_BYPASS-HEADER": "x-bypass: s3cret:with-colon",
      }),
    );
    expect(lint).toEqual({
      previewUrl: "https://preview.example.com",
      tokenFiles: ["tokens/a.json", "tokens/b.json"],
      viewports: [
        { width: 1280, height: 800 },
        { width: 375, height: 667 },
      ],
      bypassHeaders: { "x-bypass": "s3cret:with-colon" },
      sarifPath: "out.sarif",
    });
  });

  it.each([
    ["preview-url", { "INPUT_PREVIEW-URL": "" }],
    ["preview-url", { "INPUT_PREVIEW-URL": "not a url" }],
    ["token-files", { "INPUT_TOKEN-FILES": "" }],
    ["viewports", { INPUT_VIEWPORTS: "wide" }],
    ["bypass-header", { "INPUT_BYPASS-HEADER": "novalue" }],
  ])("rejects a bad %s", (input, overrides) => {
    expect(() => readInputs(env(overrides))).toThrow(InvalidInputError);
    expect(() => readInputs(env(overrides))).toThrow(input);
  });

  it("reads no lint inputs in other modes", () => {
    expect(readInputs(env({ INPUT_MODE: "gate" })).lint).toBeUndefined();
  });
});

describe("mode: lint", () => {
  it("maps the inputs onto runCiLint and publishes as the minted token", async () => {
    const { calls, load } = fake({ conclusion: "success", findings: [], checkRunId: 7 });
    const environment = env({ INPUT_VIEWPORTS: "1280x800" });

    await main(environment, load);

    expect(calls).toEqual([
      {
        url: "https://preview.example.com",
        tokenFiles: ["tokens/a.json", "tokens/b.json"],
        viewports: [{ width: 1280, height: 800 }],
        sarifPath: "out.sarif",
        publish: { token: "minted", owner: "o", repo: "r", headSha: "head_sha" },
      },
    ]);
    expect(outputs(environment)).toEqual({
      conclusion: "success",
      "finding-count": "0",
      "check-run-id": "7",
    });
  });

  it("sets the sarif output and does not fail on neutral", async () => {
    const { load } = fake({
      conclusion: "neutral",
      findings: [finding, finding],
      sarifPath: "out.sarif",
    });
    const environment = env();

    await expect(main(environment, load)).resolves.toBeUndefined();
    expect(outputs(environment)).toMatchObject({
      conclusion: "neutral",
      "finding-count": "2",
      "sarif-path": "out.sarif",
    });
  });

  it("fails the step on failure, after writing the outputs", async () => {
    const { load } = fake({ conclusion: "failure", findings: [finding], sarifPath: "out.sarif" });
    const environment = env();

    await expect(main(environment, load)).rejects.toThrow(/1 finding/);
    expect(outputs(environment)["conclusion"]).toBe("failure");
  });

  it("publishes as the app-id, so maple/design-lint is owned like the gate's check", async () => {
    const { load, calls } = fake({ conclusion: "success", findings: [] });

    await main(env({ "INPUT_APP-ID": "5018083" }), load);
    expect(calls[0]?.publish).toEqual({
      token: "minted",
      owner: "o",
      repo: "r",
      headSha: "head_sha",
      appId: 5018083,
    });
  });

  it("is a dry run off a pull request: nothing is published", async () => {
    const { calls, load } = fake({ conclusion: "success", findings: [] });

    await main(env({}, false), load);

    expect(calls[0]).not.toHaveProperty("publish");
  });

  it("masks the bypass value before anything can print it", async () => {
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const { load } = fake({ conclusion: "success", findings: [] });

    await main(env({ "INPUT_BYPASS-HEADER": "x-bypass: s3cret" }), load);

    expect(write).toHaveBeenCalledWith("::add-mask::s3cret\n");
    write.mockRestore();
  });
});
