export const id = 933;
export const ids = [933];
export const modules = {

/***/ 933:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  ArgsError: () => (/* reexport */ ArgsError),
  GITHUB_APP_PERMISSIONS: () => (/* reexport */ GITHUB_APP_PERMISSIONS),
  GLOBAL_FLAGS: () => (/* reexport */ GLOBAL_FLAGS),
  HELP: () => (/* reexport */ HELP),
  connectorKindRows: () => (/* reexport */ connectorKindRows),
  describeFlags: () => (/* reexport */ describeFlags),
  isSet: () => (/* reexport */ isSet),
  parseArgs: () => (/* reexport */ parseArgs$1),
  renderConnectorKinds: () => (/* reexport */ renderConnectorKinds),
  run: () => (/* reexport */ run_run)
});

// EXTERNAL MODULE: external "node:util"
var external_node_util_ = __webpack_require__(975);
;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+cli@0.17.1_msw@2.15.0_@types+node@26.6.1_typescript@6.0.3__react-dom@19.3.0__a3e435a0947c3732b3498b96a3d85c2b/node_modules/@maple-kit/cli/dist/args.js

//#region src/args.ts
const GLOBAL_FLAGS = {
	json: "boolean",
	help: "boolean",
	version: "boolean"
};
var ArgsError = class extends Error {
	name = "ArgsError";
};
function parseArgs$1(argv, spec, { strict = true } = {}) {
	const options = Object.fromEntries(Object.entries(spec).map(([name, type]) => [name, { type }]));
	let parsed;
	try {
		parsed = (0,external_node_util_.parseArgs)({
			args: [...argv],
			options,
			strict,
			allowPositionals: true
		});
	} catch (error) {
		throw new ArgsError(firstSentence(error));
	}
	const flags = {};
	for (const [name, value] of Object.entries(parsed.values)) if (typeof value === "string" || typeof value === "boolean") flags[name] = value;
	const [command, ...rest] = parsed.positionals;
	return {
		...command === void 0 ? {} : { command },
		positionals: rest,
		flags
	};
}
function firstSentence(error) {
	const message = error instanceof Error ? error.message : String(error);
	const [sentence = message] = message.split(/\.(?:\s|$)/);
	return `${sentence}.`;
}
function describeFlags(spec) {
	return Object.entries(spec).map(([name, type]) => type === "string" ? `--${name} <value>` : `--${name}`).join(", ");
}
function isSet(flags, name) {
	return flags[name] === true;
}
//#endregion


// EXTERNAL MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/connectors/capabilities.js
var capabilities = __webpack_require__(638);
;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+cli@0.17.1_msw@2.15.0_@types+node@26.6.1_typescript@6.0.3__react-dom@19.3.0__a3e435a0947c3732b3498b96a3d85c2b/node_modules/@maple-kit/cli/dist/commands/connectors.js

//#region src/commands/connectors.ts
function connectorKindRows() {
	return Object.keys(capabilities/* CONNECTOR_METHODS */.nP).map((kind) => {
		const required = capabilities/* REQUIRED_METHODS */.PN[kind];
		return {
			kind,
			required,
			optional: capabilities/* CONNECTOR_METHODS */.nP[kind].filter((method) => !required.includes(method))
		};
	});
}
function renderRow(row) {
	const indent = " ".repeat(16);
	const required = listed(row.required);
	return `  ${row.kind.padEnd(14)}required: ${required}\n${indent}optional: ${listed(row.optional)}`;
}
function listed(methods) {
	return methods.length > 0 ? methods.join(", ") : "none";
}
function renderConnectorKinds(rows) {
	return ["Connector kinds", ...rows.map(renderRow)].join("\n");
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+cli@0.17.1_msw@2.15.0_@types+node@26.6.1_typescript@6.0.3__react-dom@19.3.0__a3e435a0947c3732b3498b96a3d85c2b/node_modules/@maple-kit/cli/dist/commands/setup-app.js

//#region src/commands/setup-app.ts
const GITHUB_APP_PERMISSIONS = {
	comment: { pull_requests: "write" },
	gate: { checks: "write" }
};
const SETUP_APP_FLAGS = {
	owner: "string",
	name: "string",
	personal: "boolean",
	gate: "boolean"
};
const SETUP_APP_USAGE = `Usage
  maple setup app --owner=<org-or-user> [--personal] [--gate] [--name=<name>] [--json]

  --owner     The organisation (or, with --personal, the account) the App belongs to.
  --personal  Register it under a personal account rather than an organisation.
  --gate      The gate App (Checks) instead of the comment App (Pull requests).
  --name      The App's name. It must be unique on all of GitHub.`;
const HOMEPAGE = "https://github.com/maple-kit/maple";
const LOGO = "https://raw.githubusercontent.com/maple-kit/maple/main/docs/assets/app-logo.png";
const BADGE = "#fdf8e8";
const DESCRIPTIONS = {
	comment: "Maple visual review comments, posted to a pull request as the reviewer.",
	gate: "Publishes Maple's maple/visual-review check run."
};
function defaultName(kind, owner) {
	return kind === "comment" ? `Maple — ${owner}` : `Maple gate — ${owner}`;
}
function appRegistrationUrl(registration) {
	const { kind, owner, personal } = registration;
	const base = personal ? "https://github.com/settings/apps/new" : `https://github.com/organizations/${encodeURIComponent(owner)}/settings/apps/new`;
	const query = new URLSearchParams({
		name: registration.name ?? defaultName(kind, owner),
		description: DESCRIPTIONS[kind],
		url: HOMEPAGE,
		public: "false",
		webhook_active: "false",
		request_oauth_on_install: "false"
	});
	query.append("callback_urls[]", `https://github.com/${owner}`);
	for (const [permission, access] of Object.entries(GITHUB_APP_PERMISSIONS[kind])) query.append(permission, access);
	return `${base}?${query.toString()}`;
}
const LOGO_STEP = `Under Display information, upload the Maple logo (${LOGO}) and set Badge background colour to ${BADGE}.`;
function manualSteps(kind) {
	if (kind === "gate") return [
		"Leave Enable Device Flow off. This App acts as itself and never signs a reviewer in.",
		"Create the App, then Generate a private key. Its contents are MAPLE_GATE_PRIVATE_KEY, a secret.",
		LOGO_STEP,
		"Install App → Only select repositories → the same repositories the comment App is on.",
		"The App ID on the settings page is MAPLE_GATE_APP_ID; the number at the end of the installation's settings URL is MAPLE_GATE_INSTALLATION_ID.",
		"None of this is needed to gate in CI: `maple setup ci` publishes the check on the workflow's own token."
	];
	return [
		"Under Identifying and authorizing users, turn Enable Device Flow on.",
		"Turn Expire user authorization tokens off.",
		"Create the App. Do not generate a private key: nothing in the comment path uses one.",
		LOGO_STEP,
		"Install App → Only select repositories → the ones that should be reviewable.",
		"Copy the Client ID (it starts with Iv; it is not the App ID) into MAPLE_GITHUB_CLIENT_ID.",
		"Check it with `maple setup verify --client-id=<Iv…>`."
	];
}
function readRegistration(flags) {
	const owner = stringFlag(flags, "owner");
	if (owner === void 0 || !/^[A-Za-z0-9-]+$/.test(owner)) return void 0;
	const name = stringFlag(flags, "name");
	return {
		kind: isSet(flags, "gate") ? "gate" : "comment",
		owner,
		personal: isSet(flags, "personal"),
		...name === void 0 ? {} : { name }
	};
}
function setupApp(flags, json) {
	const registration = readRegistration(flags);
	if (registration === void 0) return {
		output: SETUP_APP_USAGE,
		exitCode: 1
	};
	const url = appRegistrationUrl(registration);
	const permissions = GITHUB_APP_PERMISSIONS[registration.kind];
	const steps = manualSteps(registration.kind);
	if (json) return {
		output: JSON.stringify({
			url,
			permissions,
			steps
		}, null, 2),
		exitCode: 0
	};
	const granted = Object.entries(permissions).map(([permission, access]) => `${permission}: ${access}`).join(", ");
	const numbered = steps.map((step, index) => `  ${String(index + 1)}. ${step}`);
	return {
		output: [
			`Register the ${registration.kind} App here:`,
			"",
			url,
			"",
			`Permissions: ${granted} (GitHub adds metadata: read).`,
			"",
			"Then, by hand, since no URL parameter sets these:",
			...numbered
		].join("\n"),
		exitCode: 0
	};
}
function stringFlag(flags, name) {
	const value = flags[name];
	return typeof value === "string" && value.trim() !== "" ? value.trim() : void 0;
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+cli@0.17.1_msw@2.15.0_@types+node@26.6.1_typescript@6.0.3__react-dom@19.3.0__a3e435a0947c3732b3498b96a3d85c2b/node_modules/@maple-kit/cli/dist/help.js
//#region src/help.ts
const HELP = `maple — visual review comments on deployed previews

Usage
  maple <command> [options]

Commands
  review            Put the overlay on your running app through a proxy, with nothing wired in
  connectors        Show the connector kinds and the methods each one may implement
  mock schema       Write an OpenAPI document of a tRPC router's response types
  mock plan         Print the recipe a preview's route plans for a sentence
  setup app         Print the prefilled GitHub App registration URL and the steps after it
  setup verify      Check that a comment App's Device Flow is on
  setup ci          Print or write the gate workflow, and the ruleset that requires it
  solo              Keep a preview's comments on this machine: start the bridge, print the link

Options
  --json            Print machine-readable output where a command supports it
  --help            Show this help
  --version         Show the version

Every command that prints a table also supports --json, so the CLI can be driven
by an agent as easily as by a person.`;
//#endregion


// EXTERNAL MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/mock/recipe.js
var mock_recipe = __webpack_require__(32);
;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/mock/reading.js

//#region src/mock/reading.ts
const PLAN_FLOOR = .4;
const PLAN_TIE = .15;
const NOTHING = {
	suggestions: [],
	unnamed: false
};
function readPlan(plan) {
	if (plan === null) return NOTHING;
	const layers = layersOf(plan);
	const states = statesOf(plan);
	if (states.length > 0) {
		const calls = plan.calls.filter((call) => call.concerned).map((call) => call.key);
		return {
			suggestions: states.map((state) => ({
				state,
				calls,
				...layers
			})),
			unnamed: false
		};
	}
	if (layers.flags !== void 0 || layers.as !== void 0) return {
		suggestions: [{
			calls: [],
			...layers
		}],
		unnamed: false
	};
	const unnamed = plan.state === "none" && plan.confidence >= .4;
	return unnamed ? {
		suggestions: [],
		unnamed
	} : NOTHING;
}
function statesOf(plan) {
	if (plan.confidence < .4 || plan.state === "none") return [];
	if (!plan.calls.some((call) => call.concerned)) return [];
	const runnerUp = mock_recipe/* MOCK_STATES */.CX.filter((state) => state !== plan.state).reduce((best, state) => best === void 0 || plan.distribution[state] > plan.distribution[best] ? state : best, void 0);
	return runnerUp !== void 0 && plan.distribution[plan.state] - plan.distribution[runnerUp] <= .15 ? [plan.state, runnerUp] : [plan.state];
}
function layersOf(plan) {
	const named = (plan.flags ?? []).filter((flag) => flag.concerned);
	const flags = Object.fromEntries(named.map((flag) => [flag.key, flag.value]));
	const role = plan.role !== void 0 && plan.role.p >= .5 ? plan.role.role : void 0;
	return {
		...named.length === 0 ? {} : { flags },
		...role === void 0 ? {} : { as: { role } }
	};
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+cli@0.17.1_msw@2.15.0_@types+node@26.6.1_typescript@6.0.3__react-dom@19.3.0__a3e435a0947c3732b3498b96a3d85c2b/node_modules/@maple-kit/cli/dist/commands/mock-plan.js

//#region src/commands/mock-plan.ts
const MOCK_PLAN_FLAGS = {
	url: "string",
	route: "string",
	calls: "string"
};
const MOCK_PLAN_USAGE = `Usage
  maple mock plan "<sentence>" --url=<route> --route=<pattern> --calls=<key>,<key>

  --url      Where Maple's route is mounted on a preview, such as
             https://preview.example.com/api/maple.
  --route    The page's route pattern the recipe applies on, such as /projects/:id.
  --calls    The calls the page makes, comma-separated, as the box names them:
             "trpc:project.list,rest:GET /api/session".`;
async function mockPlan(args, fetcher = globalThis.fetch) {
	const asked = read(args);
	if (asked === void 0) return failed(MOCK_PLAN_USAGE);
	let response;
	try {
		response = await fetcher(new URL("mock/plan", `${asked.url.href.replace(/\/?$/, "/")}`), {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				request: asked.sentence,
				route: asked.route,
				calls: asked.calls.map((key) => ({
					key,
					summary: ""
				}))
			})
		});
	} catch (error) {
		return failed(`Could not reach ${asked.url.href}: ${String(error)}`);
	}
	if (!response.ok) return failed(refusal(response.status, asked.url));
	const { plan } = await response.json();
	return recipeFrom(plan, asked);
}
function recipeFrom(plan, asked) {
	const reading = readPlan(plan);
	if (reading.unnamed) return failed(`"${asked.sentence}" doesn't name a state this page's data can be in.`);
	const [chosen] = reading.suggestions;
	if (chosen === void 0) return failed(`Not sure enough to mock anything; the best reading was ${plan === null ? "nothing" : `${plan.state} at ${plan.confidence.toFixed(2)}`}.`);
	const { as, flags, state } = chosen;
	const recipe = (0,mock_recipe/* parseRecipe */.j0)({
		version: mock_recipe/* RECIPE_VERSION */.M9,
		calls: state === void 0 ? [] : chosen.calls.map((key) => ({
			key,
			state
		})),
		...flags === void 0 ? {} : { flags },
		...as === void 0 ? {} : { as },
		route: asked.route,
		request: asked.sentence
	});
	return {
		output: JSON.stringify(recipe, null, 2),
		exitCode: 0
	};
}
function read(args) {
	const [, sentence] = args.positionals;
	const url = parsed(flag(args.flags, "url"));
	const route = flag(args.flags, "route");
	const named = (flag(args.flags, "calls") ?? "").split(",").map((key) => key.trim()).filter((key) => key !== "");
	if (sentence === void 0 || sentence.trim() === "" || url === void 0) return void 0;
	if (route === void 0 || !route.startsWith("/") || named.length === 0) return void 0;
	return {
		sentence: sentence.trim(),
		url,
		route,
		calls: named
	};
}
function refusal(status, url) {
	if (status === 404) return `${url.href} plans nothing: /mock/plan answers only on a preview whose classifier plans.`;
	if (status === 401) return `${url.href} plans only for a signed-in reviewer.`;
	return `${url.href} could not plan: ${String(status)}.`;
}
function failed(output) {
	return {
		output,
		exitCode: 1
	};
}
function parsed(value) {
	if (value === void 0) return void 0;
	try {
		return new URL(value);
	} catch {
		return;
	}
}
function flag(flags, name) {
	const value = flags[name];
	return typeof value === "string" && value !== "" ? value : void 0;
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/mock/shape.js
//#region src/mock/shape.ts
const SHAPE_SOURCES = [
	"supplied",
	"router",
	"validator",
	"introspection",
	"sample"
];
const MOCK_EXTENSION = "x-maple-mock";
const SOURCES = new Set(SHAPE_SOURCES);
const METHODS = [
	"get",
	"post",
	"put",
	"patch",
	"delete"
];
function isShape(value) {
	if (!isRecord(value)) return false;
	const { schema, source, superjson } = value;
	if (!(typeof schema === "boolean" || isRecord(schema))) return false;
	if (typeof source !== "string" || !SOURCES.has(source)) return false;
	return superjson === void 0 || typeof superjson === "boolean";
}
function readSchemaDocument(document, overrides = {}) {
	const stamped = isRecord(document) ? document[MOCK_EXTENSION] : void 0;
	const mark = isRecord(stamped) ? stamped : {};
	const source = typeof mark["source"] === "string" && SOURCES.has(mark["source"]);
	return {
		document,
		codec: mark["codec"] === "trpc" ? "trpc" : "rest",
		...source ? { source: mark["source"] } : {},
		...mark["superjson"] === true ? { superjson: true } : {},
		...overrides
	};
}
function createShapeIndex(documents) {
	const exact = /* @__PURE__ */ new Map();
	const templates = [];
	for (const source of documents) for (const [key, shape] of shapesOf(source)) {
		if (exact.has(key)) continue;
		exact.set(key, shape);
		const rest = /^rest:([A-Z]+) (.*)$/.exec(key);
		if (rest?.[2]?.includes("{")) templates.push({
			method: rest[1],
			segments: rest[2].split("/"),
			shape
		});
	}
	return {
		size: exact.size,
		find(key) {
			const found = exact.get(key);
			if (found !== void 0) return found;
			const rest = /^rest:([A-Z]+) (.*)$/.exec(key);
			if (rest === null) return void 0;
			const segments = rest[2].split("/");
			return templates.find((template) => template.method === rest[1] && matches(template.segments, segments))?.shape;
		}
	};
}
function shapesOf(source) {
	const doc = isRecord(source.document) ? source.document : {};
	const paths = isRecord(doc["paths"]) ? doc["paths"] : {};
	const components = doc["components"];
	const found = [];
	for (const [path, item] of Object.entries(paths)) {
		if (!isRecord(item)) continue;
		for (const method of METHODS) {
			const schema = responseSchema(item[method], source.codec);
			if (schema === void 0) continue;
			const key = keyOf(source, path, method);
			const root = components === void 0 ? schema : withComponents(schema, components);
			found.push([key, shapeFor(root, source)]);
		}
	}
	return found;
}
function shapeFor(schema, source) {
	return {
		schema,
		source: source.source ?? "supplied",
		...source.superjson === true ? { superjson: true } : {}
	};
}
function keyOf(source, path, method) {
	if (source.codec === "trpc") return `trpc:${path.replace(/^\//, "")}`;
	const full = `${source.prefix ?? ""}${path}`.replace(/\/{2,}/g, "/");
	return `rest:${method.toUpperCase()} ${full.length > 1 ? full.replace(/\/$/, "") : full}`;
}
function responseSchema(operation, codec) {
	if (!isRecord(operation) || !isRecord(operation["responses"])) return void 0;
	const status = Object.keys(operation["responses"]).filter((code) => /^2(\d\d|XX)$/i.test(code)).sort((a, b) => a.localeCompare(b))[0];
	const response = status === void 0 ? void 0 : operation["responses"][status];
	const content = isRecord(response) && isRecord(response["content"]) ? response["content"] : {};
	const type = Object.keys(content).find((name) => /json/i.test(name));
	const media = type === void 0 ? void 0 : content[type];
	const schema = isRecord(media) ? media["schema"] : void 0;
	if (!isRecord(schema)) return void 0;
	return codec === "trpc" ? trpcData(schema) : schema;
}
function trpcData(schema) {
	const result = isRecord(schema["properties"]) ? schema["properties"]["result"] : void 0;
	const data = isRecord(result) && isRecord(result["properties"]) ? result["properties"]["data"] : void 0;
	return isRecord(data) ? data : schema;
}
function withComponents(schema, components) {
	return typeof schema === "boolean" ? schema : {
		...schema,
		components
	};
}
function matches(template, segments) {
	if (template.length !== segments.length) return false;
	return template.every((part, index) => /^\{[^}]+\}$/.test(part) || part === segments[index]);
}
function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
//#endregion


// EXTERNAL MODULE: external "node:fs/promises"
var promises_ = __webpack_require__(455);
// EXTERNAL MODULE: external "node:path"
var external_node_path_ = __webpack_require__(760);
;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+cli@0.17.1_msw@2.15.0_@types+node@26.6.1_typescript@6.0.3__react-dom@19.3.0__a3e435a0947c3732b3498b96a3d85c2b/node_modules/@maple-kit/cli/dist/commands/mock-schema.js



//#region src/commands/mock-schema.ts
const GENERATOR = "@trpc/openapi";
const GENERATOR_VERSION = "11.19.0-alpha";
const MOCK_SCHEMA_FLAGS = {
	export: "string",
	out: "string",
	superjson: "boolean"
};
const MOCK_SCHEMA_USAGE = `Usage
  maple mock schema <router.ts> [--export=AppRouter] [--out=file.json] [--superjson]

  --export      The router type's exported name. Defaults to AppRouter.
  --out         Where to write the document. Printed when absent.
  --superjson   The router's transformer is superjson, so a sampled date is a Date.`;
async function mockSchema(args, generate) {
	const [subcommand, entry] = args.positionals;
	if (subcommand !== "schema" || entry === void 0) return {
		output: MOCK_SCHEMA_USAGE,
		exitCode: 1
	};
	const run = generate ?? await loadGenerator();
	if (run === void 0) return {
		output: `maple mock schema needs ${GENERATOR}, an optional peer:\n  pnpm add -D ${GENERATOR}@${GENERATOR_VERSION}`,
		exitCode: 1
	};
	const exportName = mock_schema_flag(args.flags, "export") ?? "AppRouter";
	let document;
	try {
		document = await run((0,external_node_path_.resolve)(entry), {
			exportName,
			title: exportName,
			version: "0"
		});
	} catch (error) {
		return {
			output: `Could not read ${exportName} from ${entry}: ${String(error)}`,
			exitCode: 1
		};
	}
	const stamped = stamp(document, args.flags["superjson"] === true);
	const text = `${JSON.stringify(stamped, null, 2)}\n`;
	const out = mock_schema_flag(args.flags, "out");
	if (out === void 0) return {
		output: text.trimEnd(),
		exitCode: 0
	};
	try {
		await (0,promises_.mkdir)((0,external_node_path_.dirname)(out), { recursive: true });
		await (0,promises_.writeFile)(out, text);
	} catch (error) {
		return {
			output: `Could not write ${out}: ${String(error)}`,
			exitCode: 1
		};
	}
	return {
		output: `Wrote ${String(procedures(stamped))} procedures to ${out}`,
		exitCode: 0
	};
}
function stamp(document, superjson) {
	const base = typeof document === "object" && document !== null ? document : {};
	const mark = {
		codec: "trpc",
		source: "router",
		...superjson ? { superjson: true } : {}
	};
	return {
		...base,
		[MOCK_EXTENSION]: mark
	};
}
function procedures(document) {
	const paths = document["paths"];
	return typeof paths === "object" && paths !== null ? Object.keys(paths).length : 0;
}
function mock_schema_flag(flags, name) {
	const value = flags[name];
	return typeof value === "string" && value !== "" ? value : void 0;
}
async function loadGenerator() {
	try {
		return (await __webpack_require__(529)(GENERATOR)).generateOpenAPIDocument;
	} catch {
		return;
	}
}
//#endregion


// EXTERNAL MODULE: external "node:fs"
var external_node_fs_ = __webpack_require__(24);
;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+cli@0.17.1_msw@2.15.0_@types+node@26.6.1_typescript@6.0.3__react-dom@19.3.0__a3e435a0947c3732b3498b96a3d85c2b/node_modules/@maple-kit/cli/dist/review/package-manager.js


//#region src/review/package-manager.ts
const LOCKFILES = [
	["pnpm-lock.yaml", "pnpm"],
	["yarn.lock", "yarn"],
	["bun.lock", "bun"],
	["bun.lockb", "bun"],
	["package-lock.json", "npm"],
	["npm-shrinkwrap.json", "npm"]
];
function fromField(cwd) {
	try {
		const manifest = JSON.parse((0,external_node_fs_.readFileSync)((0,external_node_path_.join)(cwd, "package.json"), "utf8"));
		const name = typeof manifest.packageManager === "string" ? manifest.packageManager : "";
		return LOCKFILES.map(([, manager]) => manager).find((manager) => name.startsWith(`${manager}@`));
	} catch {
		return;
	}
}
function detectPackageManager(cwd) {
	const { root } = (0,external_node_path_.parse)(cwd);
	for (let dir = cwd;; dir = (0,external_node_path_.dirname)(dir)) {
		const found = LOCKFILES.find(([file]) => (0,external_node_fs_.existsSync)((0,external_node_path_.join)(dir, file)));
		if (found !== void 0) return found[1];
		if (dir === root) break;
	}
	return fromField(cwd) ?? "npm";
}
function scriptCommand(manager, script) {
	return {
		command: manager,
		args: ["run", script]
	};
}
//#endregion


// EXTERNAL MODULE: external "node:child_process"
var external_node_child_process_ = __webpack_require__(421);
;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+cli@0.17.1_msw@2.15.0_@types+node@26.6.1_typescript@6.0.3__react-dom@19.3.0__a3e435a0947c3732b3498b96a3d85c2b/node_modules/@maple-kit/cli/dist/review/dev-server.js





//#region src/review/dev-server.ts
const ADDRESS = /https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0):\d+/i;
function findAddress(output) {
	const match = ADDRESS.exec((0,external_node_util_.stripVTControlCharacters)(output));
	if (match === null) return void 0;
	return new URL(match[0].replace("0.0.0.0", "localhost"));
}
function hasScript(cwd, script) {
	try {
		return typeof JSON.parse((0,external_node_fs_.readFileSync)((0,external_node_path_.join)(cwd, "package.json"), "utf8")).scripts?.[script] === "string";
	} catch {
		return false;
	}
}
function startDevServer(options) {
	const script = options.script ?? "dev";
	if (!hasScript(options.cwd, script)) return Promise.reject(/* @__PURE__ */ new Error(`${(0,external_node_path_.join)(options.cwd, "package.json")} has no "${script}" script. Start the app yourself and pass --port or --url, or name the script with --script.`));
	const { command, args } = scriptCommand(detectPackageManager(options.cwd), script);
	const child = (0,external_node_child_process_.spawn)(command, args, {
		cwd: options.cwd,
		detached: true,
		env: {
			...process.env,
			BROWSER: "none",
			FORCE_COLOR: "0"
		},
		stdio: [
			"ignore",
			"pipe",
			"pipe"
		]
	});
	const stop = () => {
		try {
			if (child.pid !== void 0) process.kill(-child.pid, "SIGTERM");
		} catch {}
	};
	return new Promise((resolve, reject) => {
		let seen = "";
		let settled = false;
		const finish = (settle) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			settle();
		};
		const timer = setTimeout(() => {
			stop();
			finish(() => reject(/* @__PURE__ */ new Error(`\`${command} ${args.join(" ")}\` printed no local address. Pass --port.`)));
		}, options.timeoutMs ?? 9e4);
		const onData = (chunk) => {
			const text = chunk.toString("utf8");
			(options.onOutput ?? ((output) => process.stderr.write(output)))(text);
			seen = (seen + text).slice(-4096);
			const url = findAddress(seen);
			if (url !== void 0) finish(() => resolve({
				url,
				stop
			}));
		};
		child.stdout.on("data", onData);
		child.stderr.on("data", onData);
		child.on("error", (error) => finish(() => reject(error)));
		child.on("exit", (code) => finish(() => reject(/* @__PURE__ */ new Error(`\`${command} ${args.join(" ")}\` exited with ${String(code)}.`))));
	});
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+cli@0.17.1_msw@2.15.0_@types+node@26.6.1_typescript@6.0.3__react-dom@19.3.0__a3e435a0947c3732b3498b96a3d85c2b/node_modules/@maple-kit/cli/dist/review/csp.js
//#region src/review/csp.ts
const NONCE = /^'nonce-([^']+)'$/i;
const SCRIPT_CHAIN = [
	"script-src-elem",
	"script-src",
	"default-src"
];
const CONNECT_CHAIN = ["connect-src", "default-src"];
const IMAGE_CHAIN = ["img-src", "default-src"];
function parse(policy) {
	const directives = /* @__PURE__ */ new Map();
	for (const part of policy.split(";")) {
		const [name, ...tokens] = part.trim().split(/\s+/);
		if (name !== void 0 && name !== "" && !directives.has(name.toLowerCase())) directives.set(name.toLowerCase(), tokens);
	}
	return directives;
}
function serialise(directives) {
	return [...directives].map(([name, tokens]) => [name, ...tokens].join(" ")).join("; ");
}
function governing(directives, chain) {
	for (const name of chain) {
		const tokens = directives.get(name);
		if (tokens !== void 0) return tokens;
	}
}
function withToken(tokens, add) {
	return [...tokens.filter((token) => token.toLowerCase() !== "'none'"), add];
}
function has(tokens, ...wanted) {
	return tokens.some((token) => wanted.includes(token.toLowerCase()));
}
function existingNonce(tokens) {
	return tokens.map((token) => NONCE.exec(token)?.[1]).find((nonce) => nonce !== void 0);
}
function scriptChange(tokens, fresh) {
	if (existingNonce(tokens) !== void 0) return void 0;
	if (has(tokens, "'strict-dynamic'")) {
		const nonce = fresh();
		return {
			tokens: withToken(tokens, `'nonce-${nonce}'`),
			nonce
		};
	}
	if (has(tokens, "'self'", "*", "http:")) return void 0;
	return { tokens: withToken(tokens, "'self'") };
}
function relaxPolicy(policy, fresh) {
	const directives = parse(policy);
	const changed = [];
	let nonce;
	const script = governing(directives, SCRIPT_CHAIN);
	if (script !== void 0) {
		nonce = existingNonce(script);
		const change = scriptChange(script, fresh);
		if (change !== void 0) {
			directives.set("script-src-elem", change.tokens);
			changed.push("script-src-elem");
			nonce = change.nonce ?? nonce;
		}
	}
	const connect = governing(directives, CONNECT_CHAIN);
	if (connect !== void 0 && !has(connect, "'self'", "*", "http:")) {
		directives.set("connect-src", withToken(connect, "'self'"));
		changed.push("connect-src");
	}
	const images = governing(directives, IMAGE_CHAIN);
	if (images !== void 0 && !has(images, "blob:")) {
		directives.set("img-src", withToken(images, "blob:"));
		changed.push("img-src");
	}
	return {
		policy: changed.length === 0 ? policy : serialise(directives),
		changed,
		...nonce === void 0 ? {} : { nonce }
	};
}
function relaxHeader(header, fresh) {
	const results = header.split(",").map((policy) => relaxPolicy(policy.trim(), fresh));
	const nonce = results.find((result) => result.nonce !== void 0)?.nonce;
	return {
		header: results.map((result) => result.policy).join(", "),
		changed: [...new Set(results.flatMap((result) => result.changed))],
		...nonce === void 0 ? {} : { nonce }
	};
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+cli@0.17.1_msw@2.15.0_@types+node@26.6.1_typescript@6.0.3__react-dom@19.3.0__a3e435a0947c3732b3498b96a3d85c2b/node_modules/@maple-kit/cli/dist/review/inject.js

//#region src/review/inject.ts
const ESCAPES = {
	"&": "&amp;",
	"\"": "&quot;",
	"<": "&lt;",
	">": "&gt;"
};
function escapeAttribute(value) {
	return value.replaceAll(/[&"<>]/g, (char) => ESCAPES[char] ?? char);
}
function overlayTag(tag) {
	return `<script ${[
		["src", tag.src],
		["data-branch", tag.branch],
		["data-base-path", tag.basePath],
		["data-root", tag.root],
		["data-app-dir", tag.appDir],
		...tag.nonce === void 0 ? [] : [["nonce", tag.nonce]]
	].map(([name, value]) => `${name}="${escapeAttribute(value)}"`).join(" ")}><\/script>`;
}
function injectOverlay(html, tag) {
	if (html.includes(`src="${tag.src}"`)) return {
		html,
		added: false
	};
	const element = overlayTag(tag);
	const at = html.toLowerCase().lastIndexOf("</body>");
	return {
		html: at === -1 ? `${html}${element}` : `${html.slice(0, at)}${element}${html.slice(at)}`,
		added: true
	};
}
const META_POLICY = /<meta\b[^>]*\bhttp-equiv\s*=\s*["']?content-security-policy["']?[^>]*>/gi;
const CONTENT = /\bcontent\s*=\s*(["'])(.*?)\1/i;
function relaxMeta(html, fresh) {
	let nonce;
	const changed = /* @__PURE__ */ new Set();
	return {
		html: html.replaceAll(META_POLICY, (meta) => meta.replace(CONTENT, (whole, quote, policy) => {
			const result = relaxHeader(policy, fresh);
			nonce ??= result.nonce;
			for (const directive of result.changed) changed.add(directive);
			return `content=${quote}${result.header}${quote}`;
		})),
		changed: [...changed],
		...nonce === void 0 ? {} : { nonce }
	};
}
//#endregion


// EXTERNAL MODULE: external "node:http"
var external_node_http_ = __webpack_require__(67);
// EXTERNAL MODULE: external "node:crypto"
var external_node_crypto_ = __webpack_require__(598);
// EXTERNAL MODULE: external "node:https"
var external_node_https_ = __webpack_require__(708);
// EXTERNAL MODULE: external "node:net"
var external_node_net_ = __webpack_require__(30);
// EXTERNAL MODULE: external "node:tls"
var external_node_tls_ = __webpack_require__(692);
;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+cli@0.17.1_msw@2.15.0_@types+node@26.6.1_typescript@6.0.3__react-dom@19.3.0__a3e435a0947c3732b3498b96a3d85c2b/node_modules/@maple-kit/cli/dist/review/proxy.js







//#region src/review/proxy.ts
const OVERLAY_PATH = "/__maple/overlay.js";
const ROUTE_PATH = "/__maple/api";
const HOP_BY_HOP = [
	"connection",
	"keep-alive",
	"transfer-encoding",
	"upgrade"
];
function freshNonce() {
	return (0,external_node_crypto_.randomBytes)(16).toString("base64");
}
function isDocument(headers) {
	return headers["sec-fetch-dest"] === "document" || (headers.accept ?? "").includes("text/html");
}
function requestHeaders(request, target, proxyOrigin) {
	const headers = {
		...request.headers,
		host: target.host
	};
	headers["accept-encoding"] = "identity";
	for (const name of ["origin", "referer"]) {
		const value = headers[name];
		if (typeof value === "string") headers[name] = value.replace(proxyOrigin, target.origin);
	}
	if (isDocument(request.headers)) {
		delete headers["if-none-match"];
		delete headers["if-modified-since"];
	}
	return headers;
}
function responseHeaders(upstream, target, proxyOrigin) {
	const headers = { ...upstream.headers };
	if (typeof headers.location === "string" && headers.location.startsWith(target.origin)) headers.location = headers.location.replace(target.origin, proxyOrigin);
	return headers;
}
function isHtml(upstream, method) {
	const { headers, statusCode = 200 } = upstream;
	const encoding = headers["content-encoding"];
	return method !== "HEAD" && statusCode !== 204 && statusCode !== 304 && /^text\/html/i.test(headers["content-type"] ?? "") && (encoding === void 0 || encoding === "identity");
}
function readAll(stream) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		stream.on("data", (chunk) => chunks.push(chunk));
		stream.on("end", () => resolve(Buffer.concat(chunks)));
		stream.on("error", reject);
	});
}
async function serveHtml(upstream, response, headers, options) {
	const policy = headers["content-security-policy"];
	const fromHeader = typeof policy === "string" ? relaxHeader(policy, freshNonce) : void 0;
	if (fromHeader !== void 0) headers["content-security-policy"] = fromHeader.header;
	const fromMeta = relaxMeta((await readAll(upstream)).toString("utf8"), () => fromHeader?.nonce ?? freshNonce());
	const nonce = fromHeader?.nonce ?? fromMeta.nonce;
	const { html } = injectOverlay(fromMeta.html, {
		...options.tag,
		src: OVERLAY_PATH,
		...nonce === void 0 ? {} : { nonce }
	});
	const body = Buffer.from(html, "utf8");
	for (const name of [
		...HOP_BY_HOP,
		"etag",
		"last-modified"
	]) delete headers[name];
	headers["content-length"] = body.byteLength;
	headers["cache-control"] = "no-store";
	response.writeHead(upstream.statusCode ?? 200, headers);
	response.end(body);
	const changed = [...fromHeader?.changed ?? [], ...fromMeta.changed];
	if (changed.length > 0) options.onRelaxed?.([...new Set(changed)]);
}
function forward(request$2, response, options) {
	const { target } = options;
	const proxyOrigin = `http://${request$2.headers.host ?? "localhost"}`;
	const outgoing = (target.protocol === "https:" ? external_node_https_.request : external_node_http_.request)({
		host: target.hostname,
		port: target.port,
		path: request$2.url,
		method: request$2.method,
		headers: requestHeaders(request$2, target, proxyOrigin)
	}, (upstream) => {
		const headers = responseHeaders(upstream, target, proxyOrigin);
		if (isHtml(upstream, request$2.method)) {
			serveHtml(upstream, response, headers, options).catch(() => response.destroy());
			return;
		}
		response.writeHead(upstream.statusCode ?? 502, headers);
		upstream.pipe(response);
	});
	outgoing.on("error", (error) => {
		if (response.headersSent) return response.destroy();
		response.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
		response.end(`Maple review could not reach ${target.origin}: ${error.message}\n`);
	});
	request$2.pipe(outgoing);
}
function serveOverlay(response, overlay) {
	response.writeHead(200, {
		"content-type": "text/javascript; charset=utf-8",
		"cache-control": "no-store"
	});
	response.end(overlay);
}
function tunnel(request, client, head, target) {
	const port = Number(target.port || (target.protocol === "https:" ? 443 : 80));
	const upstream = target.protocol === "https:" ? (0,external_node_tls_.connect)({
		host: target.hostname,
		port,
		servername: target.hostname
	}) : (0,external_node_net_.connect)({
		host: target.hostname,
		port
	});
	const proxyOrigin = `http://${request.headers.host ?? "localhost"}`;
	const lines = [`${request.method ?? "GET"} ${request.url ?? "/"} HTTP/1.1`];
	for (let index = 0; index < request.rawHeaders.length; index += 2) {
		const name = request.rawHeaders[index] ?? "";
		const value = request.rawHeaders[index + 1] ?? "";
		const lower = name.toLowerCase();
		if (lower === "host") lines.push(`${name}: ${target.host}`);
		else if (lower === "origin") lines.push(`${name}: ${value.replace(proxyOrigin, target.origin)}`);
		else lines.push(`${name}: ${value}`);
	}
	const start = () => {
		upstream.write(`${lines.join("\r\n")}\r\n\r\n`);
		if (head.length > 0) upstream.write(head);
		client.pipe(upstream).pipe(client);
	};
	upstream.once(target.protocol === "https:" ? "secureConnect" : "connect", start);
	upstream.on("error", () => client.destroy());
	client.on("error", () => upstream.destroy());
	client.on("close", () => upstream.destroy());
}
function createProxyListener(options) {
	return (request, response) => {
		const path = (request.url ?? "/").split("?")[0] ?? "/";
		if (path === "/__maple/overlay.js") return serveOverlay(response, options.overlay);
		if (path.startsWith("/__maple/api")) return options.route(request, response, () => forward(request, response, options));
		forward(request, response, options);
	};
}
function createUpgradeListener(options) {
	return (request, socket, head) => tunnel(request, socket, head, options.target);
}
//#endregion


// EXTERNAL MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/store.js + 148 modules
var store = __webpack_require__(99);
// EXTERNAL MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/connectors/github.js + 1 modules
var github = __webpack_require__(546);
;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/local/local-place.js



//#region src/local/local-place.ts
const run = (0,external_node_util_.promisify)(external_node_child_process_.execFile);
const FALLBACK_KEY = "default";
const LOCAL_FOLDER = ".maple";
function slugify(input) {
	const slug = trimSeparators(input.toLowerCase().replaceAll(/[^a-z0-9._]+/g, "-"));
	return slug === "" ? FALLBACK_KEY : slug;
}
function trimSeparators(text) {
	let start = 0;
	let end = text.length;
	while (start < end && "-.".includes(text[start])) start += 1;
	while (end > start && "-.".includes(text[end - 1])) end -= 1;
	return text.slice(start, end);
}
function normalizeUrl(url) {
	const scheme = url.indexOf("://");
	return slugify((scheme === -1 ? url : url.slice(scheme + 3)).split(/[/?#]/)[0] ?? "");
}
async function git(cwd, args) {
	const env = {
		...process.env,
		GIT_DIR: void 0,
		GIT_WORK_TREE: void 0,
		GIT_INDEX_FILE: void 0
	};
	try {
		const { stdout } = await run("git", [...args], {
			cwd,
			env
		});
		return stdout.trim() === "" ? void 0 : stdout.trim();
	} catch {
		return;
	}
}
async function mainCheckout(cwd) {
	const common = await git(cwd, [
		"rev-parse",
		"--path-format=absolute",
		"--git-common-dir"
	]);
	if (common === void 0) return void 0;
	return (0,external_node_path_.basename)(common) === ".git" ? (0,external_node_path_.dirname)(common) : common;
}
function urlKey(url) {
	return url === void 0 ? FALLBACK_KEY : normalizeUrl(url);
}
async function resolveLocalPlace(options = {}) {
	const cwd = (0,external_node_path_.resolve)(options.cwd ?? process.cwd());
	const branch = await git(cwd, [
		"symbolic-ref",
		"--short",
		"-q",
		"HEAD"
	]);
	const root = options.root === void 0 ? await mainCheckout(cwd) ?? cwd : (0,external_node_path_.resolve)(options.root);
	const key = branch === void 0 ? urlKey(options.url) : slugify(branch);
	return {
		root,
		key,
		dir: (0,external_node_path_.join)(root, LOCAL_FOLDER, key),
		source: branch === void 0 ? "url" : "branch",
		...branch === void 0 ? {} : { branch }
	};
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/local/local-files.js



//#region src/local/local-files.ts
async function writeAtomic(path, data) {
	await (0,promises_.mkdir)((0,external_node_path_.dirname)(path), { recursive: true });
	const temporary = `${path}.${process.pid}.${(0,external_node_crypto_.randomUUID)().slice(0, 8)}.tmp`;
	try {
		await (0,promises_.writeFile)(temporary, data);
		await (0,promises_.rename)(temporary, path);
	} catch (error) {
		await (0,promises_.unlink)(temporary).catch(() => void 0);
		throw error;
	}
}
async function readIfPresent(path) {
	try {
		return await (0,promises_.readFile)(path, "utf8");
	} catch (error) {
		if (error.code === "ENOENT") return void 0;
		throw error;
	}
}
const tails = /* @__PURE__ */ new Map();
function withLock(path, task) {
	const run = (tails.get(path) ?? Promise.resolve()).then(task, task);
	const tail = run.catch(() => void 0);
	tails.set(path, tail);
	tail.then(() => {
		if (tails.get(path) === tail) tails.delete(path);
	});
	return run;
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/local/file-store.js




//#region src/local/file-store.ts
const EMPTY = {
	version: 1,
	comments: [],
	approvals: []
};
function newId(prefix) {
	return `${prefix}_${(0,external_node_crypto_.randomUUID)().replaceAll("-", "").slice(0, 12)}`;
}
function encodeCursor(offset) {
	return Buffer.from(String(offset), "utf8").toString("base64url");
}
function decodeCursor(cursor) {
	const offset = Number(Buffer.from(cursor, "base64url").toString("utf8"));
	if (!Number.isInteger(offset) || offset < 0) throw new RangeError(`Invalid cursor: ${cursor}`);
	return offset;
}
function parseLedger(text, path) {
	if (text === void 0) return EMPTY;
	try {
		const parsed = JSON.parse(text);
		if (Array.isArray(parsed.comments)) return {
			version: 1,
			comments: parsed.comments,
			approvals: parsed.approvals ?? []
		};
	} catch {}
	throw new Error(`${path} is not a Maple comments file. Fix or delete it; Maple will not overwrite it.`);
}
function fileStore(options = {}) {
	async function file() {
		return (0,external_node_path_.join)((await resolveLocalPlace(options)).dir, "comments.json");
	}
	async function read() {
		const path = await file();
		return parseLedger(await readIfPresent(path), path);
	}
	async function change(edit) {
		const path = await file();
		return withLock(path, async () => {
			const { ledger, result } = edit(parseLedger(await readIfPresent(path), path));
			await writeAtomic(path, `${JSON.stringify(ledger, null, 2)}\n`);
			return result;
		});
	}
	async function list(query) {
		if (query.limit !== void 0 && query.limit <= 0) throw new RangeError(`limit must be positive, received ${query.limit}`);
		const matching = (await read()).comments.filter((comment) => comment.branch === query.branch && (query.statuses === void 0 || query.statuses.includes(comment.status)));
		const offset = query.cursor === void 0 ? 0 : decodeCursor(query.cursor);
		const page = matching.slice(offset, offset + (query.limit ?? matching.length));
		const next = offset + page.length;
		return {
			comments: page,
			...next < matching.length ? { cursor: encodeCursor(next) } : {}
		};
	}
	function appendMany(incoming) {
		return change((ledger) => {
			const stored = incoming.map((comment) => ({
				...comment,
				id: newId("loc"),
				status: comment.status ?? "open"
			}));
			return {
				ledger: {
					...ledger,
					comments: [...ledger.comments, ...stored]
				},
				result: stored
			};
		});
	}
	async function append(comment) {
		return (await appendMany([comment]))[0];
	}
	function setStatus(id, status, resolution) {
		return change((ledger) => {
			const existing = ledger.comments.find((comment) => comment.id === id);
			if (!existing) throw new Error(`No comment with id ${id}`);
			const updated = {
				...existing,
				status,
				...resolution ? { resolution } : {}
			};
			const comments = ledger.comments.map((comment) => comment.id === id ? updated : comment);
			return {
				ledger: {
					...ledger,
					comments
				},
				result: updated
			};
		});
	}
	async function approvals(branch) {
		return (await read()).approvals.filter((approval) => approval.branch === branch).toSorted((a, b) => b.at.localeCompare(a.at));
	}
	function approve(approval) {
		return change((ledger) => {
			const stored = {
				...approval,
				id: newId("app")
			};
			return {
				ledger: {
					...ledger,
					approvals: [...ledger.approvals, stored]
				},
				result: stored
			};
		});
	}
	function unapprove(id) {
		return change((ledger) => {
			if (!ledger.approvals.some((approval) => approval.id === id)) throw new Error(`No approval with id ${id}`);
			const approvals = ledger.approvals.filter((approval) => approval.id !== id);
			return {
				ledger: {
					...ledger,
					approvals
				},
				result: void 0
			};
		});
	}
	return {
		name: options.name ?? "file",
		list,
		append,
		appendMany,
		setStatus,
		approvals,
		approve,
		unapprove
	};
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/local/file-media.js





//#region src/local/file-media.ts
const EXTENSIONS = {
	"image/png": "png",
	"image/jpeg": "jpg",
	"image/gif": "gif",
	"image/webp": "webp",
	"image/avif": "avif",
	"image/svg+xml": "svg"
};
const TYPES = Object.fromEntries(Object.entries(EXTENSIONS).map(([type, extension]) => [extension, type]));
const SAFE_KEY = /^[A-Za-z0-9_-]+$/;
function assertKey(key) {
	if (!SAFE_KEY.test(key)) throw new RangeError(`No blob is held under ${key}.`);
}
function fileMedia(options = {}) {
	const name = options.name ?? "file";
	async function mediaDir() {
		return (0,external_node_path_.join)((await resolveLocalPlace(options)).dir, "media");
	}
	async function find(key) {
		assertKey(key);
		const dir = await mediaDir();
		const found = (await (0,promises_.readdir)(dir).catch(() => [])).find((entry) => (0,external_node_path_.parse)(entry).name === key);
		return found === void 0 ? void 0 : (0,external_node_path_.join)(dir, found);
	}
	async function putBlob(blob) {
		const key = `shot-${(0,external_node_crypto_.randomUUID)().replaceAll("-", "").slice(0, 12)}`;
		const extension = EXTENSIONS[blob.contentType] ?? "bin";
		await writeAtomic((0,external_node_path_.join)(await mediaDir(), `${key}.${extension}`), blob.data);
		return {
			connector: name,
			key,
			contentType: blob.contentType
		};
	}
	async function getUrl(ref) {
		const path = await find(ref.key);
		if (path === void 0) throw new RangeError(`No blob is held under ${ref.key}.`);
		return `data:${TYPES[(0,external_node_path_.parse)(path).ext.slice(1)] ?? ref.contentType};base64,${(await (0,promises_.readFile)(path)).toString("base64")}`;
	}
	async function remove(ref) {
		const path = await find(ref.key);
		if (path !== void 0) await (0,promises_.unlink)(path);
	}
	return {
		name,
		putBlob,
		getUrl,
		remove
	};
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+cli@0.17.1_msw@2.15.0_@types+node@26.6.1_typescript@6.0.3__react-dom@19.3.0__a3e435a0947c3732b3498b96a3d85c2b/node_modules/@maple-kit/cli/dist/review/store.js



//#region src/review/store.ts
const FORGE_VARIABLES = ["MAPLE_GITHUB_OWNER", "MAPLE_GITHUB_REPO"];
function required(env, name) {
	const value = env[name];
	if (value) return value;
	throw new Error(`${name} is not set, and MAPLE_STORE=github needs it.`);
}
async function reviewStore(env, cwd, url) {
	const kind = env["MAPLE_STORE"] ?? (FORGE_VARIABLES.some((name) => env[name]) ? "github" : "file");
	if (kind !== "file" && kind !== "github") throw new Error(`Unknown MAPLE_STORE ${kind}; "github" and "file" exist.`);
	const place = await resolveLocalPlace({
		cwd,
		url
	});
	const branch = place.branch ?? place.key;
	if (kind === "file") return {
		kind,
		store: (0,store/* createCommentStore */.V)(fileStore({
			cwd,
			url
		})),
		media: fileMedia({
			cwd,
			url
		}),
		branch,
		where: place.dir
	};
	const api = env["MAPLE_GITHUB_API"];
	const owner = required(env, "MAPLE_GITHUB_OWNER");
	const repo = required(env, "MAPLE_GITHUB_REPO");
	return {
		kind,
		store: (0,store/* createCommentStore */.V)((0,github/* githubStore */.$)({
			owner,
			repo,
			token: required(env, "GITHUB_TOKEN"),
			...api === void 0 ? {} : { baseUrl: api }
		})),
		branch,
		where: `${owner}/${repo} on GitHub`
	};
}
//#endregion


// EXTERNAL MODULE: external "node:module"
var external_node_module_ = __webpack_require__(995);
// EXTERNAL MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/errors.js
var errors = __webpack_require__(510);
// EXTERNAL MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/gate/decide.js
var decide = __webpack_require__(477);
;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/gate/publish.js

//#region src/gate/publish.ts
const PAGE = 100;
async function publishGate(context, branch, reviewUrl) {
	try {
		await publishVerdict(context, branch, reviewUrl);
	} catch (error) {
		context.logger?.error("Maple could not publish the merge gate; the comment's status was saved.", error instanceof Error ? error : new Error(String(error)));
	}
}
async function publishVerdict(context, branch, reviewUrl) {
	const sha = await headOf(context, branch);
	if (sha === void 0) return void 0;
	const approvals = await approvalsOn(context, branch);
	const verdict = (0,decide/* decideGate */.q)(await commentsOn(context.store, branch), {
		statusTracked: context.store.capabilities.setStatus,
		commit: sha,
		...context.requireApproval === void 0 ? {} : { requireApproval: context.requireApproval },
		...approvals === void 0 ? {} : { approvals }
	});
	await context.gate.publish({
		branch,
		sha,
		verdict,
		...reviewUrl === void 0 ? {} : { reviewUrl }
	});
	return {
		sha,
		verdict
	};
}
async function approvalsOn(context, branch) {
	return await context.store.approvals(branch);
}
async function headOf(context, branch) {
	if (!context.store.capabilities.head) {
		context.logger?.warn(`Store "${context.store.name}" cannot name a head commit, so no gate was published.`);
		return;
	}
	const sha = await context.store.head(branch);
	if (sha === void 0) context.logger?.warn(`No head commit for "${branch}", so no gate was published.`);
	return sha;
}
async function commentsOn(store, branch) {
	const comments = [];
	let cursor;
	do {
		const page = await store.list({
			branch,
			limit: PAGE,
			...cursor === void 0 ? {} : { cursor }
		});
		comments.push(...page.comments);
		cursor = page.cursor;
	} while (cursor !== void 0 && comments.length < 1e4);
	return comments;
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/lib/fnv1a.js
//#region src/lib/fnv1a.ts
const OFFSET_BASIS = 2166136261;
const PRIME = 16777619;
function fnv1a32(value) {
	const bytes = new TextEncoder().encode(value);
	let hash = OFFSET_BASIS;
	for (const byte of bytes) {
		hash ^= byte;
		hash = Math.imul(hash, PRIME);
	}
	return hash >>> 0;
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/route/approvals.js
//#region src/route/approvals.ts
function keepsApprovals(store) {
	return store.capabilities.approvals && store.capabilities.approve;
}
async function handleApprovals(context, request, id, url) {
	const { store } = context;
	if (!keepsApprovals(store)) return json({ error: "This store keeps no approvals" }, 501);
	if (id !== void 0) {
		if (request.method !== "DELETE") return json({ error: "Method not allowed" }, 405);
		return await withdraw(context, store, id, url);
	}
	if (request.method === "GET") return await listApprovals(store, url);
	if (request.method === "POST") return await approve(context, store, request);
	return json({ error: "Method not allowed" }, 405);
}
async function listApprovals(store, url) {
	const branch = url.searchParams.get("branch");
	if (!branch) return json({ error: "A branch is required" }, 400);
	return json({ approvals: await store.approvals(branch) ?? [] }, 200);
}
async function approve(context, store, request) {
	const { user } = context;
	if (!user) return json({ error: "Sign in before you can approve this preview" }, 401);
	const body = await readJson(request);
	const branch = body?.branch;
	if (typeof branch !== "string" || branch === "") return json({ error: "A branch is required" }, 400);
	const commit = await store.head(branch);
	if (commit === void 0) return json({ error: "Nothing here can name the commit this preview is serving" }, 409);
	const note = typeof body?.note === "string" && body.note !== "" ? body.note : void 0;
	const approval = {
		branch,
		commit,
		author: context.authorFor(user),
		at: (/* @__PURE__ */ new Date()).toISOString(),
		...note === void 0 ? {} : { note }
	};
	const recorded = await store.approve(approval);
	if (!recorded) return json({ error: "This store keeps no approvals" }, 501);
	return json(recorded, 201);
}
async function withdraw(context, store, id, url) {
	const { user } = context;
	if (!user) return json({ error: "Sign in before you can withdraw an approval" }, 401);
	if (!store.capabilities.unapprove) return json({ error: "This store cannot withdraw an approval" }, 501);
	const branch = url.searchParams.get("branch");
	if (!branch) return json({ error: "A branch is required" }, 400);
	const found = (await store.approvals(branch) ?? []).find((one) => one.id === id && one.author.id === user.id);
	if (!found) return json({ error: "No approval of yours with that id" }, 404);
	await store.unapprove(id);
	return json({ branch: found.branch }, 200);
}
async function readJson(request) {
	try {
		return await request.json();
	} catch {
		return;
	}
}
function json(body, status) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"content-type": "application/json",
			"cache-control": "no-store"
		}
	});
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/connectors/classifier.js
//#region src/connectors/classifier.ts
const DEFAULT_PILLARS = [
	{
		id: "specific",
		instruction: "Does the comment name what is wrong, rather than only that something is?",
		levels: [
			{
				label: "Names nothing",
				description: "Says something is wrong without naming what: “this looks off”, “broken”."
			},
			{
				label: "Names the thing",
				description: "Names the element or the copy, but not what is wrong with it."
			},
			{
				label: "Names the fault",
				description: "Names the element and the fault in it, precisely enough to look at."
			}
		]
	},
	{
		id: "actionable",
		instruction: "Would a reader know what to change after reading this?",
		levels: [
			{
				label: "Reports only",
				description: "Describes a problem and leaves entirely open what to do about it."
			},
			{
				label: "Implies a direction",
				description: "Hints at the change without saying what the result should be."
			},
			{
				label: "Says the change",
				description: "States the change to make, or the state the reader should end up at."
			}
		]
	},
	{
		id: "concise",
		instruction: "Is the comment as short as its point allows?",
		levels: [
			{
				label: "Rambling",
				description: "Long enough that the reader has to find the point inside it."
			},
			{
				label: "Padded",
				description: "Makes its point, with preamble or repetition around it."
			},
			{
				label: "Tight",
				description: "One or two sentences carrying the whole point and nothing else."
			}
		]
	},
	{
		id: "standalone",
		instruction: "Does the comment read correctly without the page in front of you?",
		levels: [
			{
				label: "Needs the screen",
				description: "Leans on “this”, “that” or “here” with no noun; unreadable away from the page."
			},
			{
				label: "Partly anchored",
				description: "Names some of what it is about and points at the rest."
			},
			{
				label: "Stands alone",
				description: "Reads correctly in a pull request, with no screenshot beside it."
			}
		]
	},
	{
		id: "located",
		instruction: "Do the words say where on the page this is?",
		levels: [
			{
				label: "Unplaced",
				description: "Nothing in the words says where on the page this is."
			},
			{
				label: "Roughly placed",
				description: "Names a page or a region, but not the element inside it."
			},
			{
				label: "Placed",
				description: "Names where it is precisely enough to find without hunting."
			}
		]
	}
];
const COMMENT_KINDS = (/* unused pure expression or super */ null && ([
	"bug",
	"request",
	"copy",
	"question",
	"praise",
	"other"
]));
const FALLBACK_KIND = "other";
const COMMENT_KIND_DESCRIPTIONS = {
	bug: "Reports something behaving or rendering wrongly: broken, misaligned, erroring, not doing what it should.",
	copy: "About the words on the screen — wording, tone, spelling, punctuation, a label — rather than behaviour.",
	other: "None of the other kinds fit, or there is not yet enough written to tell which does.",
	praise: "Approves of what is there and asks for no change.",
	question: "Asks for information or a decision, rather than reporting a fault or requesting a change.",
	request: "Asks for a change or an addition to what is there, without reporting that anything is broken."
};
var UnknownPillarError = class extends Error {
	connector;
	pillar;
	known;
	name = "UnknownPillarError";
	constructor(connector, pillar, known) {
		const scores = known.length === 0 ? "nothing" : known.join(", ");
		super(`Classifier "${connector}" has no pillar "${pillar}". It scores: ${scores}.`);
		this.connector = connector;
		this.pillar = pillar;
		this.known = known;
	}
};
function selectPillars(connector, requested) {
	if (requested === void 0) return connector.pillars;
	return requested.map((id) => {
		const pillar = connector.pillars.find((candidate) => candidate.id === id);
		if (pillar === void 0) throw new UnknownPillarError(connector.name, id, connector.pillars.map(idOf));
		return pillar;
	});
}
function idOf(pillar) {
	return pillar.id;
}
const SPREAD = 1.5;
function scoreAtPosition(pillar, position, spread = SPREAD) {
	const count = pillar.levels.length;
	if (count === 0) throw new RangeError(`Pillar "${pillar.id}" has no levels to score against.`);
	const at = clamp01(position) * (count - 1);
	const distribution = normalise(pillar.levels.map((_, index) => bell(index - at, spread)));
	const level = argmax(distribution);
	return {
		pillar: pillar.id,
		level,
		distribution,
		confidence: distribution[level] ?? 0
	};
}
function kindFromWeights(weights) {
	const evidence = COMMENT_KINDS.map((kind) => Math.max(0, weights[kind] ?? 0));
	const shares = normalise(evidence.map((weight) => BASE_SHARE + weight));
	const distribution = {};
	COMMENT_KINDS.forEach((kind, index) => {
		distribution[kind] = shares[index] ?? 0;
	});
	const kind = (evidence.some((weight) => weight > 0) ? COMMENT_KINDS[argmax(evidence)] : "other") ?? "other";
	return {
		kind,
		distribution,
		confidence: distribution[kind]
	};
}
const BASE_SHARE = .5;
function bell(distance, spread) {
	return Math.exp(-((distance / spread) ** 2));
}
function normalise(weights) {
	const total = weights.reduce((sum, weight) => sum + weight, 0);
	return weights.map((weight) => weight / total);
}
function argmax(values) {
	return values.reduce((best, value, index) => value > (values[best] ?? 0) ? index : best, 0);
}
function clamp01(value) {
	return Math.min(1, Math.max(0, value));
}
//#endregion


// EXTERNAL MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/lib/stable-stringify.js
var stable_stringify = __webpack_require__(434);
;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/route/budget.js

//#region src/route/budget.ts
function createCache(size) {
	const entries = /* @__PURE__ */ new Map();
	return {
		get(key) {
			const found = entries.get(fnv1a32(key));
			return found?.key === key ? found.answer : void 0;
		},
		set(key, answer) {
			entries.set(fnv1a32(key), {
				key,
				answer
			});
			evictOldest(entries, size);
		}
	};
}
function createLimiter(rate) {
	const windows = /* @__PURE__ */ new Map();
	return { take(session) {
		const now = Date.now();
		const open = windows.get(session);
		if (!open || open.until <= now) {
			windows.set(session, {
				count: 1,
				until: now + rate.windowMs
			});
			evictOldest(windows, rate.limit * 64);
			return true;
		}
		open.count += 1;
		return open.count <= rate.limit;
	} };
}
function evictOldest(map, size) {
	while (map.size > size) {
		const oldest = map.keys().next();
		if (oldest.done === true) return;
		map.delete(oldest.value);
	}
}
function budget_json(body, status) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"content-type": "application/json",
			"cache-control": "no-store"
		}
	});
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/route/assist.js



//#region src/route/assist.ts
const MAX_BODY = 4e3;
const DEFAULT_CACHE = 200;
const DEFAULT_RATE = {
	limit: 40,
	windowMs: 6e4
};
function createAssist(options) {
	const { classifier } = options;
	const pillars = classifier.score ? selectPillars(classifier, options.pillars) : [];
	const cache = createCache(options.cacheSize ?? DEFAULT_CACHE);
	const limiter = createLimiter(options.rate ?? DEFAULT_RATE);
	return {
		pillars,
		async respond(request, session, logger) {
			if (request.method !== "POST") return budget_json({ error: "Method not allowed" }, 405);
			const body = await bodyOf(request);
			if (body === void 0) return budget_json({ error: "A body is required" }, 400);
			if (body.length > MAX_BODY) return budget_json({ error: "That is too long to judge" }, 413);
			if (body.trim() === "") return budget_json({
				scores: [],
				kind: null
			}, 200);
			const key = (0,stable_stringify/* stableStringify */.J)({
				body,
				pillars: pillars.map(assist_idOf)
			});
			const hit = cache.get(key);
			if (hit) return budget_json(hit, 200);
			if (!limiter.take(session)) return budget_json({ error: "Too many judgements" }, 429);
			try {
				const answer = await judge(classifier, body, pillars, request.signal);
				cache.set(key, answer);
				return budget_json(answer, 200);
			} catch (error) {
				logger?.warn("A comment could not be judged.", { error: String(error) });
				return budget_json({ error: "The comment could not be judged" }, 502);
			}
		}
	};
}
async function judge(classifier, body, pillars, signal) {
	const ask = {
		body,
		signal
	};
	const [scores, kind] = await Promise.all([classifier.score?.({
		...ask,
		pillars: pillars.map(assist_idOf)
	}) ?? [], classifier.classify?.(ask) ?? null]);
	return {
		scores,
		kind
	};
}
async function bodyOf(request) {
	try {
		const posted = await request.json();
		return typeof posted?.body === "string" ? posted.body : void 0;
	} catch {
		return;
	}
}
function assist_idOf(pillar) {
	return pillar.id;
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/auth/cookie.js
//#region src/auth/cookie.ts
const SESSION_COOKIE = "maple_gh";
const PENDING_COOKIE = "maple_gh_pending";
const WEEK_SECONDS = 604800;
const DEFAULT_PATH = "/api/maple";
const IV_BYTES = 12;
function readCookie(headers, name) {
	const header = headers["cookie"];
	if (!header) return void 0;
	for (const pair of header.split(";")) {
		const at = pair.indexOf("=");
		if (at === -1) continue;
		if (pair.slice(0, at).trim() === name) return decodeURIComponent(pair.slice(at + 1).trim());
	}
}
async function readGitHubSession(request, options = {}) {
	const raw = readCookie(request.headers, options.name ?? "maple_gh");
	if (raw === void 0) return null;
	return cookie_parse(await unseal(raw, options.key)) ?? null;
}
function sessionText(session) {
	return JSON.stringify(session);
}
async function seal(plain, key) {
	if (key === void 0) return `p.${toBase64Url(utf8(plain))}`;
	const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
	const sealed = await crypto.subtle.encrypt({
		name: "AES-GCM",
		iv
	}, await importKey(key), utf8(plain));
	return `e.${toBase64Url(iv)}.${toBase64Url(new Uint8Array(sealed))}`;
}
async function unseal(value, key) {
	try {
		return await decode(value, key);
	} catch {
		return;
	}
}
async function decode(value, key) {
	const [kind, ...rest] = value.split(".");
	if (kind === "p") return cookie_text(fromBase64Url(rest[0] ?? ""));
	if (kind !== "e" || key === void 0 || rest.length !== 2) return void 0;
	const opened = await crypto.subtle.decrypt({
		name: "AES-GCM",
		iv: fromBase64Url(rest[0])
	}, await importKey(key), fromBase64Url(rest[1]));
	return cookie_text(new Uint8Array(opened));
}
function cookie_parse(plain) {
	if (plain === void 0) return void 0;
	const read = safeJson(plain);
	if (typeof read !== "object" || read === null) return void 0;
	const session = read;
	if (typeof session.token !== "string" || session.token.length === 0) return void 0;
	const login = typeof session.login === "string" ? { login: session.login } : {};
	return {
		token: session.token,
		...login
	};
}
function safeJson(plain) {
	try {
		return JSON.parse(plain);
	} catch {
		return;
	}
}
function setCookie(name, value, options, maxAgeSeconds) {
	const age = maxAgeSeconds ?? options.maxAgeSeconds ?? WEEK_SECONDS;
	return [
		`${name}=${encodeURIComponent(value)}`,
		`Path=${options.path ?? DEFAULT_PATH}`,
		`Max-Age=${String(age)}`,
		"HttpOnly",
		"SameSite=Lax",
		...options.insecure === true ? [] : ["Secure"]
	].join("; ");
}
function clearCookie(name, options) {
	return setCookie(name, "", options, 0);
}
async function importKey(key) {
	const raw = fromBase64Url(key.replaceAll("+", "-").replaceAll("/", "_"));
	return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}
function utf8(value) {
	const encoded = new TextEncoder().encode(value);
	const copy = new Uint8Array(new ArrayBuffer(encoded.length));
	copy.set(encoded);
	return copy;
}
function cookie_text(bytes) {
	return new TextDecoder().decode(bytes);
}
function toBase64Url(bytes) {
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return unpadded(btoa(binary).replaceAll("+", "-").replaceAll("/", "_"));
}
function unpadded(value) {
	return value.split("=")[0] ?? "";
}
function fromBase64Url(value) {
	const padded = unpadded(value).replaceAll("-", "+").replaceAll("_", "/");
	const binary = atob(padded + "=".repeat((4 - padded.length % 4) % 4));
	const bytes = new Uint8Array(new ArrayBuffer(binary.length));
	for (let at = 0; at < binary.length; at += 1) bytes[at] = binary.charCodeAt(at);
	return bytes;
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/auth/device-flow.js
//#region src/auth/device-flow.ts
var DeviceFlowError = class extends Error {
	reason;
	name = "DeviceFlowError";
	constructor(reason, message) {
		super(message);
		this.reason = reason;
	}
};
const DEFAULT_BASE = "https://github.com";
const GRANT = "urn:ietf:params:oauth:grant-type:device_code";
const SECOND = 1e3;
function createDeviceFlow(options) {
	const base = options.baseUrl ?? DEFAULT_BASE;
	const call = options.fetch ?? globalThis.fetch;
	const wait = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
	async function post(path, body) {
		const response = await call(`${base}${path}`, {
			method: "POST",
			headers: {
				accept: "application/json",
				"content-type": "application/json"
			},
			body: JSON.stringify(body)
		});
		if (!response.ok) throw new DeviceFlowError("unknown", `GitHub ${String(response.status)} on ${path}.`);
		return await response.json();
	}
	return {
		async start() {
			const body = await post("/login/device/code", {
				client_id: options.clientId,
				...options.scope === void 0 ? {} : { scope: options.scope }
			});
			return {
				userCode: body.user_code,
				verificationUri: body.verification_uri,
				expiresAt: Date.now() + body.expires_in * SECOND,
				interval: body.interval,
				deviceCode: body.device_code
			};
		},
		exchange,
		async poll(code, signal) {
			let interval = code.interval;
			for (;;) {
				signal?.throwIfAborted();
				if (Date.now() >= code.expiresAt) throw new DeviceFlowError("expired", "The code expired before it was entered.");
				await wait(interval * SECOND);
				const result = await exchange({
					...code,
					interval
				});
				if (result.status === "linked") return result.token;
				interval = result.interval;
			}
		}
	};
	async function exchange(code) {
		const body = await post("/login/oauth/access_token", {
			client_id: options.clientId,
			device_code: code.deviceCode,
			grant_type: GRANT
		});
		const token = tokenIn(body);
		if (token) return {
			status: "linked",
			token
		};
		return {
			status: "pending",
			interval: nextInterval(body, code.interval)
		};
	}
}
function tokenIn(body) {
	if (!body.access_token) {
		reject(body);
		return;
	}
	return {
		accessToken: body.access_token,
		scope: body.scope ?? "",
		...body.expires_in === void 0 ? {} : { expiresAt: Date.now() + body.expires_in * SECOND },
		...body.refresh_token === void 0 ? {} : { refreshToken: body.refresh_token }
	};
}
function reject(body) {
	const error = body.error ?? "unknown";
	if (error === "authorization_pending" || error === "slow_down") return;
	const message = body.error_description ?? error;
	if (error === "expired_token") throw new DeviceFlowError("expired", message);
	if (error === "access_denied") throw new DeviceFlowError("denied", message);
	if (error === "device_flow_disabled") throw new DeviceFlowError("unsupported", message);
	throw new DeviceFlowError("unknown", message);
}
function nextInterval(body, current) {
	if (body.error !== "slow_down") return current;
	return body.interval ?? current + 5;
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/route/auth.js


//#region src/route/auth.ts
const DEFAULT_API = "https://api.github.com";
const auth_SECOND = 1e3;
const LINK_FAILURE = {
	denied: 403,
	expired: 410,
	unsupported: 501,
	unknown: 502
};
async function startLink(options) {
	const code = await flowFor(options).start();
	const pending = await seal(JSON.stringify(code), options.key);
	const lifetime = Math.max(1, Math.ceil((code.expiresAt - Date.now()) / auth_SECOND));
	return auth_json({
		userCode: code.userCode,
		verificationUri: code.verificationUri,
		expiresAt: code.expiresAt,
		interval: code.interval
	}, 200, setCookie(PENDING_COOKIE, pending, options, lifetime));
}
async function finishLink(options, headers) {
	const code = await pendingCode(options, headers);
	if (!code) return auth_json({
		error: "No sign-in is in progress",
		reason: "expired"
	}, 410);
	const result = await flowFor(options).exchange(code);
	if (result.status === "pending") return auth_json(result, 200);
	const session = await sessionFor(options, result.token.accessToken);
	const stored = await seal(sessionText(session), options.key);
	return auth_json({
		status: "linked",
		...stateOf(session)
	}, 200, [setCookie(SESSION_COOKIE, stored, options), clearCookie(PENDING_COOKIE, options)]);
}
function endLink(options) {
	return auth_json({ status: "signed-out" }, 200, [clearCookie(SESSION_COOKIE, options), clearCookie(PENDING_COOKIE, options)]);
}
async function githubState(options, headers) {
	const raw = readCookie(headers, options.name ?? "maple_gh");
	const session = raw === void 0 ? void 0 : cookie_parse(await unseal(raw, options.key));
	return session ? stateOf(session) : { linked: false };
}
function linkFailure(error) {
	if (!(error instanceof DeviceFlowError)) return void 0;
	const status = LINK_FAILURE[error.reason];
	return auth_json({
		error: error.message,
		reason: error.reason
	}, status, [clearCookie(PENDING_COOKIE, {})]);
}
function flowFor(options) {
	return createDeviceFlow({
		clientId: options.clientId,
		...options.baseUrl === void 0 ? {} : { baseUrl: options.baseUrl },
		...options.fetch === void 0 ? {} : { fetch: options.fetch }
	});
}
async function pendingCode(options, headers) {
	const raw = readCookie(headers, PENDING_COOKIE);
	if (raw === void 0) return void 0;
	const plain = await unseal(raw, options.key);
	const read = plain === void 0 ? void 0 : auth_safeJson(plain);
	if (typeof read !== "object" || read === null) return void 0;
	const code = read;
	return typeof code.deviceCode === "string" ? code : void 0;
}
async function sessionFor(options, token) {
	const call = options.fetch ?? globalThis.fetch;
	try {
		const response = await call(`${options.apiBaseUrl ?? DEFAULT_API}/user`, { headers: {
			accept: "application/vnd.github+json",
			authorization: `Bearer ${token}`
		} });
		if (!response.ok) return { token };
		const body = await response.json();
		return typeof body.login === "string" ? {
			token,
			login: body.login
		} : { token };
	} catch {
		return { token };
	}
}
function stateOf(session) {
	return {
		linked: true,
		...session.login === void 0 ? {} : { login: session.login }
	};
}
function auth_safeJson(plain) {
	try {
		return JSON.parse(plain);
	} catch {
		return;
	}
}
function auth_json(body, status, cookies) {
	const headers = new Headers({
		"content-type": "application/json",
		"cache-control": "no-store"
	});
	for (const cookie of typeof cookies === "string" ? [cookies] : cookies ?? []) headers.append("set-cookie", cookie);
	return new Response(JSON.stringify(body), {
		status,
		headers
	});
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/route/gate.js
//#region src/route/gate.ts
async function gateFor(chosen, request) {
	if (chosen === void 0) return null;
	return typeof chosen === "function" ? await chosen(request) : chosen;
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/mock/pointer.js
//#region src/mock/pointer.ts
const REF_HOPS = 8;
function resolved(root, node) {
	let current = node;
	let name;
	for (let hop = 0; hop < REF_HOPS; hop += 1) {
		if (!pointer_isNode(current)) return {};
		const ref = current["$ref"];
		if (typeof ref !== "string") return {
			here: current,
			...name === void 0 ? {} : { name }
		};
		name = pointer_decode(ref.split("/").at(-1) ?? "");
		current = pointer(root, ref);
	}
	return {};
}
function pointer(root, ref) {
	if (!ref.startsWith("#/")) return void 0;
	let at = root;
	for (const segment of ref.slice(2).split("/")) {
		if (!pointer_isNode(at)) return void 0;
		at = at[pointer_decode(segment)];
	}
	return at;
}
function pointer_decode(segment) {
	return segment.replaceAll("~1", "/").replaceAll("~0", "~");
}
function pointer_isNode(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/mock/identity.js

//#region src/mock/identity.ts
function isServerIdentity(source) {
	return "read" in source && typeof source.read === "function";
}
function identityRules(source, shape) {
	const requires = source.requires ?? {};
	const needs = Object.values(requires);
	const role = source.role && field(source.role, shape, roleWords, needs.flatMap((need) => need.roles ?? []));
	const permissions = source.permissions && field(source.permissions, shape, permissionWords, needs.flatMap((need) => need.permission === void 0 ? [] : [need.permission]));
	return {
		call: source.call,
		...role ? { role } : {},
		...permissions ? { permissions } : {},
		requires
	};
}
function serverIdentityRules(source, current) {
	const requires = source.requires ?? {};
	const needs = Object.values(requires);
	const roles = [...source.roles, ...needs.flatMap((need) => need.roles ?? [])];
	const named = needs.flatMap((need) => need.permission === void 0 ? [] : [need.permission]);
	return {
		role: { values: [...new Set(roles)] },
		...source.permissions === void 0 ? {} : { permissions: { values: [.../* @__PURE__ */ new Set([...source.permissions, ...named])] } },
		requires,
		server: { current }
	};
}
function field(declared, shape, words, named) {
	const found = declared.values ?? (shape === void 0 ? [] : words(shape.schema, at(shape.schema, declared.path)));
	return {
		path: declared.path,
		values: [.../* @__PURE__ */ new Set([...found, ...named])]
	};
}
function at(root, path) {
	let node = root;
	for (const segment of path.split(".")) {
		const properties = objectOf(root, node)?.["properties"];
		node = pointer_isNode(properties) ? properties[segment] : void 0;
	}
	return node;
}
function objectOf(root, node) {
	const here = resolved(root, node).here;
	if (here === void 0 || pointer_isNode(here["properties"])) return here;
	return [
		here["anyOf"],
		here["oneOf"],
		here["allOf"]
	].flatMap((list) => Array.isArray(list) ? list : []).map((branch) => resolved(root, branch).here).find((b) => pointer_isNode(b?.["properties"]));
}
function roleWords(root, node) {
	const here = resolved(root, node).here;
	return strings(here?.["enum"] ?? (typeof here?.["const"] === "string" ? [here["const"]] : []));
}
function permissionWords(root, node) {
	const here = resolved(root, node).here;
	if (here?.["items"] !== void 0) return roleWords(root, here["items"]);
	const properties = objectOf(root, node)?.["properties"];
	return pointer_isNode(properties) ? Object.keys(properties) : [];
}
function strings(value) {
	return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}
function isIdentityRules(value) {
	if (!isNode(value) || !isNode(value["requires"])) return false;
	const rendered = isNode(value["server"]) && isCurrent(value["server"]["current"]);
	const called = typeof value["call"] === "string";
	if (!called && !rendered) return false;
	return [value["role"], value["permissions"]].every((one) => one === void 0 || isNode(one) && (typeof one["path"] === "string" || !called && one["path"] === void 0) && isWords(one["values"]));
}
function isCurrent(value) {
	if (value === null) return true;
	if (!isNode(value)) return false;
	const { permissions, role, roles } = value;
	return (role === void 0 || typeof role === "string") && (roles === void 0 || isWords(roles)) && (permissions === void 0 || isWords(permissions));
}
function isWords(value) {
	return Array.isArray(value) && value.every((item) => typeof item === "string");
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/route/mock.js


//#region src/route/mock.ts
const MOCK_SCHEMA_KEYS = 100;
function createMockSchemas(options) {
	let built;
	const index = () => {
		built ??= documents(options.schemas).then(createShapeIndex);
		return built;
	};
	const source = options.identity;
	return {
		preview: options.preview,
		index,
		async identity(request) {
			if (source === void 0) return void 0;
			if (isServerIdentity(source)) {
				const current = request === void 0 ? null : await source.read(request);
				return serverIdentityRules(source, current);
			}
			return identityRules(source, (await index()).find(source.call));
		}
	};
}
async function shapesFor(schemas, keys) {
	const index = await schemas.index();
	const found = {};
	for (const key of keys) {
		const shape = index.find(key);
		if (shape !== void 0) found[key] = shape;
	}
	return found;
}
async function documents(source) {
	if (source === void 0) return [];
	return typeof source === "function" ? source() : source;
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/connectors/plan.js

//#region src/connectors/plan.ts
const MOCK_PLAN_STATES = [...mock_recipe/* MOCK_STATES */.CX, "none"];
const MOCK_PLAN_STATE_DESCRIPTIONS = {
	empty: "The data exists but has nothing in it: no items, no results, a first visit.",
	error: "Loading the data fails: the server errors, is down, or answers with a failure.",
	forbidden: "The reviewer may not see the data: no permission, no access, a 403.",
	loading: "The data has not arrived yet: a spinner, a skeleton, a slow answer.",
	one: "Exactly one item: a single result, a lone entry.",
	many: "A great many items: a long list, pagination, hundreds of rows.",
	long: "Every text as long as it can be: long names and titles that wrap, truncate or overflow their space, and the widest numbers.",
	sparse: "Items with every optional field missing: no avatar, no description, nulls, half-filled records. The list still has its items.",
	mixed: "A mix of every kind of item side by side: every status, type and variant, some fields set and some missing, short and long text.",
	none: "The request names no state the data can be in, or not yet: a style, copy or layout change."
};
const PRIOR = 1.4;
function stateFromWeights(weights) {
	const found = MOCK_STATES.some((state) => (weights[state] ?? 0) > 0);
	const share = PRIOR / MOCK_PLAN_STATES.length;
	const evidence = MOCK_PLAN_STATES.map((state) => state === "none" && !found ? 1 : Math.max(0, weights[state] ?? 0));
	const total = evidence.reduce((sum, weight) => sum + share + weight, 0);
	const distribution = {};
	MOCK_PLAN_STATES.forEach((state, index) => {
		distribution[state] = (share + (evidence[index] ?? 0)) / total;
	});
	const state = MOCK_PLAN_STATES[plan_argmax(evidence)] ?? "none";
	return {
		state,
		distribution,
		confidence: distribution[state]
	};
}
function plannedCall(key, p) {
	const clamped = Math.min(1, Math.max(0, p));
	return {
		key,
		concerned: clamped >= .5,
		p: clamped
	};
}
function plannedFlag(key, value, p) {
	const clamped = Math.min(1, Math.max(0, p));
	return {
		key,
		value,
		concerned: clamped >= .5,
		p: clamped
	};
}
function flagValues(flag) {
	return flag.type === "boolean" ? [true, false] : flag.variants ?? [];
}
function plan_argmax(values) {
	return values.reduce((best, value, index) => value > (values[best] ?? 0) ? index : best, 0);
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/route/plan-layers.js

//#region src/route/plan-layers.ts
const MAX_FLAGS = 100;
const MAX_VARIANTS = 20;
const MAX_WORD = 100;
const plan_layers_TYPES = /* @__PURE__ */ new Set([
	"boolean",
	"number",
	"object",
	"string"
]);
function readPlanFlags(value) {
	if (value === void 0) return { flags: [] };
	const error = `flags: a list of at most ${String(MAX_FLAGS)} { key, type, variants? }`;
	if (!Array.isArray(value) || value.length > MAX_FLAGS) return { error };
	const flags = value.map(readFlag);
	if (flags.some((flag) => flag === void 0)) return { error };
	return { flags: flags.filter((flag) => flagValues(flag).length > 0) };
}
function readFlag(value) {
	if (!plan_layers_isRecord(value)) return void 0;
	const { key, type, variants } = value;
	if (typeof key !== "string" || key === "" || key.length > MAX_WORD) return void 0;
	if (typeof type !== "string" || !plan_layers_TYPES.has(type)) return void 0;
	const flag = {
		key,
		type
	};
	if (variants === void 0) return flag;
	if (!Array.isArray(variants) || variants.length > MAX_VARIANTS) return void 0;
	return variants.every(isWord) ? {
		...flag,
		variants
	} : void 0;
}
function isWord(value) {
	if (typeof value === "string") return value.length <= MAX_WORD;
	return typeof value === "boolean" || typeof value === "number" && Number.isFinite(value);
}
function planRoles(rules) {
	return rules?.role?.values ?? [];
}
function confined(plan, request) {
	const { flags: planned, role, ...rest } = plan;
	const listed = new Map((request.flags ?? []).map((flag) => [flag.key, flagValues(flag)]));
	const flags = (planned ?? []).filter((one) => (listed.get(one.key) ?? []).some((value) => value === one.value));
	const named = role !== void 0 && (request.roles ?? []).includes(role.role);
	return {
		...rest,
		...request.flags === void 0 ? {} : { flags },
		...named ? { role } : {}
	};
}
function plan_layers_isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/route/summary.js

//#region src/route/summary.ts
const DEPTH = 2;
const FIELDS = 12;
const MAX_SAID = 400;
function summarise(page, schema) {
	const said = schema === void 0 ? "" : describe(schema, schema, 0);
	if (covers(page, said)) return page;
	if (covers(said, page)) return said;
	return `${page} — ${said}`;
}
function covers(outer, inner) {
	const words = new Set(outer.match(/\w+/g));
	return (inner.match(/\w+/g) ?? []).every((word) => words.has(word));
}
function describe(root, node, depth) {
	const { here, name } = resolved(root, node);
	if (here === void 0 || depth > DEPTH) return "";
	const parts = [here["title"] ?? name, here["description"]].filter((part) => typeof part === "string" && part !== "");
	const items = here["items"];
	if (items !== void 0 && typeof items !== "boolean") parts.push(`list of [${describe(root, items, depth + 1)}]`);
	const properties = here["properties"];
	if (pointer_isNode(properties)) {
		const fields = Object.entries(properties).slice(0, FIELDS).map(([key, value]) => summary_field(root, key, value, depth));
		if (fields.length > 0) parts.push(fields.join(", "));
	}
	return parts.join(": ").slice(0, MAX_SAID);
}
function summary_field(root, key, schema, depth) {
	const items = resolved(root, schema).here?.["items"];
	if (items === void 0 || typeof items === "boolean") return key;
	const inner = describe(root, items, depth + 1);
	return inner === "" ? key : `${key} [${inner}]`;
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/route/plan.js





//#region src/route/plan.ts
const MAX_REQUEST = 500;
const MAX_KEY = 300;
const MAX_SUMMARY = 500;
const KEY = /^[a-z]+:\S/;
const MAX_INFLATED = 524288;
const plan_DEFAULT_CACHE = 200;
const plan_DEFAULT_RATE = {
	limit: 40,
	windowMs: 6e4
};
function createMockPlanner(options, schemas) {
	const { classifier } = options;
	if (typeof classifier.plan !== "function") return void 0;
	const plan = classifier.plan.bind(classifier);
	const cache = createCache(options.cacheSize ?? plan_DEFAULT_CACHE);
	const limiter = createLimiter(options.rate ?? plan_DEFAULT_RATE);
	return { async respond(request, session, logger) {
		if (request.method !== "POST") return budget_json({ error: "Method not allowed" }, 405);
		if (unreadable(request)) return budget_json({ error: "Send the body plain or gzipped" }, 415);
		const { asked, error } = plan_read(await plan_readJson(request));
		if (asked === void 0) return budget_json({ error }, 400);
		if (asked.request.trim() === "") return budget_json({ plan: null }, 200);
		const planned = await layered(asked, schemas);
		const key = (0,stable_stringify/* stableStringify */.J)(planned);
		const hit = cache.get(key);
		if (hit) return budget_json(hit, 200);
		if (!limiter.take(session)) return budget_json({ error: "Too many plans" }, 429);
		try {
			const answer = { plan: confined(await plan({
				...planned,
				signal: request.signal
			}), planned) };
			cache.set(key, answer);
			return budget_json(answer, 200);
		} catch (error) {
			logger?.warn("A mock request could not be planned.", { error: String(error) });
			return budget_json({ error: "The request could not be planned" }, 502);
		}
	} };
}
function plan_read(posted) {
	if (!plan_isRecord(posted)) return { error: "A body is required" };
	const { request, route, calls } = posted;
	const flags = readPlanFlags(posted["flags"]);
	if (flags.flags === void 0) return { error: flags.error ?? "flags" };
	if (typeof request !== "string" || request.length > MAX_REQUEST) return { error: `request: a string of at most ${MAX_REQUEST} characters` };
	if (typeof route !== "string" || !route.startsWith("/") || route.length > MAX_KEY) return { error: "route: a path pattern starting with \"/\"" };
	if (!Array.isArray(calls) || calls.length > 100) return { error: `calls: a list of at most 100` };
	const read = calls.map(readCall);
	if (read.some((call) => call === void 0)) return { error: "calls: each a { key, summary } with a codec-prefixed key" };
	return { asked: {
		request,
		route,
		calls: read,
		flags: flags.flags
	} };
}
function readCall(call) {
	if (!plan_isRecord(call)) return void 0;
	const { key, summary = "" } = call;
	if (typeof key !== "string" || key.length > MAX_KEY || !KEY.test(key)) return void 0;
	if (typeof summary !== "string" || summary.length > MAX_SUMMARY) return void 0;
	return {
		key,
		summary
	};
}
async function layered(asked, schemas) {
	const { flags, ...rest } = asked;
	const roles = planRoles(await schemas.identity());
	return {
		...rest,
		calls: await described(asked.calls, () => schemas.index()),
		...flags.length === 0 ? {} : { flags },
		...roles.length === 0 ? {} : { roles }
	};
}
async function described(calls, shapes) {
	const index = calls.length === 0 ? void 0 : await shapes();
	return calls.map((call) => {
		return {
			key: call.key,
			summary: summarise(call.summary, index?.find(call.key)?.schema)
		};
	});
}
async function plan_readJson(request) {
	try {
		if (!gzipped(request)) return await request.json();
		if (request.body === null) return void 0;
		const inflated = request.body.pipeThrough(new DecompressionStream("gzip"));
		return JSON.parse(await plan_text(inflated, MAX_INFLATED));
	} catch {
		return;
	}
}
function gzipped(request) {
	return request.headers.get("content-encoding")?.trim().toLowerCase() === "gzip";
}
function unreadable(request) {
	const encoding = request.headers.get("content-encoding")?.trim().toLowerCase();
	return encoding !== void 0 && encoding !== "" && encoding !== "identity" && encoding !== "gzip";
}
async function plan_text(stream, limit) {
	const decoder = new TextDecoder("utf-8", { fatal: true });
	const reader = stream.getReader();
	let out = "";
	let size = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) return out + decoder.decode();
		size += value.byteLength;
		if (size > limit) {
			await reader.cancel();
			throw new RangeError("The body is too large.");
		}
		out += decoder.decode(value, { stream: true });
	}
}
function plan_isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/route/push-access.js
//#region src/route/push-access.ts
var PushAccessError = class extends Error {
	name = "PushAccessError";
};
const push_access_DEFAULT_BASE = "https://api.github.com";
const MINUTE = 6e4;
const MAX_HELD = 500;
function createPushAccess(options) {
	const clock = options.now ?? Date.now;
	const ttl = options.cacheMs ?? MINUTE;
	const held = /* @__PURE__ */ new Map();
	return async (token) => {
		const key = await digest(token);
		const cached = held.get(key);
		if (cached && clock() < cached.until) return cached.answer;
		const answer = await ask(options, token);
		held.delete(key);
		held.set(key, {
			answer,
			until: clock() + ttl
		});
		if (held.size > MAX_HELD) held.delete(held.keys().next().value);
		return answer;
	};
}
async function ask(options, token) {
	const call = options.fetch ?? globalThis.fetch;
	const path = `/repos/${encodeURIComponent(options.owner)}/${encodeURIComponent(options.repo)}`;
	const response = await call(`${options.baseUrl ?? push_access_DEFAULT_BASE}${path}`, { headers: {
		accept: "application/vnd.github+json",
		authorization: `Bearer ${token}`,
		"x-github-api-version": "2022-11-28"
	} });
	if (response.status === 401) return "bad-token";
	if (response.headers.get("x-ratelimit-remaining") === "0") throw new PushAccessError(`GitHub rate-limited ${path}`);
	if (response.status === 403 || response.status === 404) return "denied";
	if (!response.ok) throw new PushAccessError(`GitHub ${String(response.status)} on ${path}`);
	return (await response.json().catch(() => void 0))?.permissions?.push === true ? "push" : "denied";
}
async function digest(token) {
	const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
	return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/route/refresh.js



//#region src/route/refresh.ts
function createRefreshAccess(options) {
	return createPushAccess({
		owner: options.owner,
		repo: options.repo,
		...options.baseUrl === void 0 ? {} : { baseUrl: options.baseUrl },
		...options.fetch === void 0 ? {} : { fetch: options.fetch },
		...options.now === void 0 ? {} : { now: options.now },
		...options.cacheMs === void 0 ? {} : { cacheMs: options.cacheMs }
	});
}
async function handleRefresh(context, request) {
	if (request.method !== "POST") return budget_json({ error: "Method not allowed" }, 405);
	const token = bearer(request.headers.get("authorization"));
	if (token === void 0) return budget_json({ error: "A GitHub token is required" }, 401);
	const branch = await branchIn(request);
	if (branch === void 0) return budget_json({ error: "A branch is required" }, 400);
	const answer = await context.access(token);
	if (answer === "bad-token") return budget_json({ error: "GitHub did not accept this token" }, 401);
	if (answer === "denied") return budget_json({ error: "This token cannot push to the repository" }, 403);
	const gate = await context.gate();
	if (!gate) return budget_json({ error: "This deployment publishes no gate" }, 404);
	const store = await storeFor(context, token);
	if (!store) return budget_json({ error: "There is no store to read the verdict from" }, 401);
	return await publish(context, {
		store,
		gate
	}, branch, new URL(request.url).origin);
}
async function publish(context, chosen, branch, reviewUrl) {
	const gateContext = {
		...chosen,
		...context.logger === void 0 ? {} : { logger: context.logger },
		...context.requireApproval === void 0 ? {} : { requireApproval: context.requireApproval }
	};
	const published = await publishVerdict(gateContext, branch, reviewUrl);
	if (!published) return budget_json({ error: `No head commit for "${branch}"` }, 409);
	const { verdict } = published;
	return budget_json({
		branch,
		sha: published.sha,
		verdict: {
			conclusion: verdict.conclusion,
			reason: verdict.reason,
			open: verdict.open,
			total: verdict.total
		}
	}, 200);
}
async function storeFor(context, token) {
	const build = context.options.store;
	return build === void 0 ? await context.fallbackStore() : await build(token);
}
function bearer(header) {
	return (header === null ? null : /^Bearer\s+(\S+)$/i.exec(header.trim()))?.[1];
}
async function branchIn(request) {
	const branch = (await request.json().catch(() => void 0))?.branch;
	return typeof branch === "string" && branch.length > 0 ? branch : void 0;
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/route/handler.js










//#region src/route/handler.ts
const DEFAULT_BASE_PATH = "/api/maple";
const STATUSES = /* @__PURE__ */ new Set([
	"open",
	"resolved",
	"needs_reverify",
	"orphaned"
]);
const COMMIT = /^[0-9a-f]{7,40}$/;
const COLOR_SLOTS = 10;
function createMapleHandler(options) {
	const base = options.basePath ?? "/api/maple";
	const mock = options.mock === void 0 ? void 0 : createMockSchemas(options.mock);
	const plan = options.mock?.plan;
	const mount = {
		options,
		assist: options.assist === void 0 ? void 0 : createAssist(options.assist),
		mock,
		planner: mock && plan ? createMockPlanner(plan, mock) : void 0,
		refresh: options.gateRefresh === void 0 ? void 0 : createRefreshAccess(options.gateRefresh)
	};
	return async function handle(request) {
		const url = new URL(request.url);
		const route = url.pathname.startsWith(base) ? url.pathname.slice(base.length) : void 0;
		if (route === void 0) return handler_json({ error: "Not found" }, 404);
		try {
			return await dispatch(mount, request, route, url);
		} catch (error) {
			return failure(options.logger, error);
		}
	};
}
const FIXED = /* @__PURE__ */ new Map([
	["/assist", (mount, request) => handler_judge(mount, request)],
	["/mock/schema", (mount, request, url) => handler_mockSchema(mount, request, url)],
	["/mock/plan", (mount, request) => handler_mockPlan(mount, request)],
	["/mock/identity", (mount, request) => mockIdentity(mount, request)],
	["/auth/github", (mount, request) => handler_link(mount.options, request)],
	["/gate/refresh", (mount, request) => refresh(mount, request)]
]);
async function dispatch(mount, request, route, url) {
	const { options } = mount;
	const fixed = FIXED.get(route);
	if (fixed) return fixed(mount, request, url);
	if (route === "/media" || route.startsWith("/media/")) return media(options, request, route, url);
	if (route === "/approvals" || route.startsWith("/approvals/")) return approvals(options, request, route, url);
	const one = /^\/comments\/([^/]+)$/.exec(route);
	if (route !== "/comments" && route !== "/me" && !one) return handler_json({ error: "Not found" }, 404);
	if (!methodAllowed(route, one !== null, request.method)) return handler_json({ error: "Method not allowed" }, 405);
	if (route === "/me") return whoAmI(mount, request);
	if (options.store === void 0) return handler_json({ error: "Not found" }, 404);
	const store = await handler_storeFor(options, request);
	if (!store) return handler_json({ error: "This reviewer has no store to write to" }, 401);
	if (one) return setStatus(options, store, request, one[1]);
	return request.method === "GET" ? listComments(store, url) : appendComment(options, store, request);
}
async function refresh(mount, request) {
	const { options, refresh: access } = mount;
	if (options.gateRefresh === void 0 || access === void 0) return handler_json({ error: "Not found" }, 404);
	return handleRefresh({
		access,
		options: options.gateRefresh,
		gate: () => gateFor(options.gate, identityRequest(request)),
		fallbackStore: () => handler_storeFor(options, request),
		...options.logger === void 0 ? {} : { logger: options.logger },
		...options.requireApproval === void 0 ? {} : { requireApproval: options.requireApproval }
	}, request);
}
async function approvals(options, request, route, url) {
	if (options.store === void 0) return handler_json({ error: "Not found" }, 404);
	const store = await handler_storeFor(options, request);
	if (!store) return handler_json({ error: "This reviewer has no store to write to" }, 401);
	const id = route === "/approvals" ? void 0 : decodeURIComponent(route.slice(11));
	const user = await options.identity?.resolveUser(identityRequest(request)) ?? null;
	const answer = await handleApprovals({
		store,
		user,
		authorFor
	}, request, id, url);
	const branch = request.method === "GET" ? void 0 : await branchOf(answer);
	if (branch !== void 0) await reportGate(options, store, request, branch);
	return answer;
}
async function branchOf(answer) {
	if (answer.status !== 200 && answer.status !== 201) return void 0;
	const body = await answer.clone().json();
	return typeof body.branch === "string" ? body.branch : void 0;
}
async function media(options, request, route, url) {
	const connector = await mediaFor(options, request);
	if (!connector) return handler_json({ error: "This deployment keeps no screenshots" }, 404);
	const key = route === "/media" ? void 0 : decodeURIComponent(route.slice(7));
	if (key === void 0) {
		if (request.method !== "POST") return handler_json({ error: "Method not allowed" }, 405);
		return putBlob(connector, request);
	}
	if (request.method !== "GET") return handler_json({ error: "Method not allowed" }, 405);
	return readBlob(connector, key, url);
}
async function putBlob(connector, request) {
	const contentType = request.headers.get("content-type") ?? "";
	if (!contentType.startsWith("image/")) return handler_json({ error: "An image is required" }, 415);
	const data = new Uint8Array(await request.arrayBuffer());
	if (data.byteLength === 0) return handler_json({ error: "An image is required" }, 400);
	return handler_json(await connector.putBlob({
		data,
		contentType
	}), 201);
}
async function readBlob(connector, key, url) {
	const contentType = url.searchParams.get("type") ?? "application/octet-stream";
	const found = await connector.getUrl({
		connector: connector.name,
		key,
		contentType
	});
	const inline = decoded(found);
	if (inline) return inline;
	return new Response(null, {
		status: 302,
		headers: {
			location: found,
			"cache-control": "no-store"
		}
	});
}
function decoded(found) {
	const match = /^data:([^;,]+);base64,(.*)$/s.exec(found);
	if (!match) return void 0;
	const binary = atob(match[2]);
	const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
	return new Response(bytes, {
		status: 200,
		headers: {
			"content-type": match[1],
			"cache-control": "no-store"
		}
	});
}
async function mediaFor(options, request) {
	const chosen = options.media;
	if (chosen === void 0) return null;
	return typeof chosen === "function" ? chosen(identityRequest(request)) : chosen;
}
async function handler_link(options, request) {
	const auth = options.githubAuth;
	if (!auth) return handler_json({ error: "Not found" }, 404);
	const headers = Object.fromEntries(request.headers);
	try {
		if (request.method === "POST") return await startLink(auth);
		if (request.method === "PATCH") return await finishLink(auth, headers);
		if (request.method === "DELETE") return endLink(auth);
		return handler_json({ error: "Method not allowed" }, 405);
	} catch (error) {
		return linkFailure(error) ?? failure(options.logger, error);
	}
}
function methodAllowed(route, one, method) {
	if (one) return method === "PATCH";
	if (route === "/me") return method === "GET";
	return method === "GET" || method === "POST";
}
async function handler_storeFor(options, request) {
	const { store } = options;
	if (store === void 0) return null;
	return typeof store === "function" ? store(identityRequest(request)) : store;
}
async function listComments(store, url) {
	const branch = url.searchParams.get("branch");
	if (!branch) return handler_json({ error: "A branch is required" }, 400);
	return handler_json(await store.list(queryFrom(url, branch)), 200);
}
function queryFrom(url, branch) {
	const cursor = url.searchParams.get("cursor");
	const limit = url.searchParams.get("limit");
	const statuses = url.searchParams.getAll("status").filter((value) => STATUSES.has(value));
	return {
		branch,
		...cursor === null ? {} : { cursor },
		...limit === null ? {} : { limit: Number(limit) },
		...statuses.length === 0 ? {} : { statuses }
	};
}
async function appendComment(options, store, request) {
	const posted = await handler_readJson(request);
	const batch = Array.isArray(posted) ? posted : void 0;
	const drafts = batch ?? [posted];
	if (drafts.length === 0) return handler_json({ comments: [] }, 201);
	if (!drafts.every(isDraft)) return handler_json({ error: "A branch and a body are required" }, 400);
	const user = await options.identity?.resolveUser(identityRequest(request));
	const author = user ? authorFor(user) : GUEST;
	const comments = drafts.map((draft) => ({
		...withoutResolution(draft),
		author
	}));
	const stored = await store.appendMany(comments);
	const branch = stored[0]?.branch;
	if (branch !== void 0) await reportGate(options, store, request, branch);
	return handler_json(batch ? { comments: stored } : stored[0], 201);
}
const GUEST = {
	id: "guest",
	name: "Guest",
	provenance: "guest"
};
function authorFor(user) {
	return {
		id: user.id,
		name: user.name,
		provenance: "server",
		colorSlot: colorSlotFor(user.id),
		...user.avatarUrl === void 0 ? {} : { avatarUrl: user.avatarUrl }
	};
}
function colorSlotFor(id) {
	return fnv1a32(id) % COLOR_SLOTS;
}
async function setStatus(options, store, request, id) {
	const change = await handler_readJson(request);
	const status = change?.status;
	if (typeof status !== "string" || !STATUSES.has(status)) return handler_json({ error: "An known status is required" }, 400);
	const claimed = change?.resolution;
	if (claimed !== void 0 && !isResolutionClaim(claimed)) return handler_json({ error: "A resolution needs a sha" }, 400);
	const resolution = claimed === void 0 ? void 0 : handler_stamp(claimed);
	const updated = await store.setStatus(id, status, resolution);
	if (!updated) return handler_json({ error: "This store cannot change a status" }, 501);
	await reportGate(options, store, request, updated.branch);
	return handler_json(updated, 200);
}
async function reportGate(options, store, request, branch) {
	const gate = await gateFor(options.gate, identityRequest(request));
	if (!gate) return;
	const context = {
		store,
		gate,
		...options.logger === void 0 ? {} : { logger: options.logger },
		...options.requireApproval === void 0 ? {} : { requireApproval: options.requireApproval }
	};
	await publishGate(context, branch, new URL(request.url).origin);
}
function isResolutionClaim(value) {
	if (typeof value !== "object" || value === null) return false;
	const claim = value;
	return typeof claim.sha === "string" && claim.sha.length > 0 && (claim.note === void 0 || typeof claim.note === "string");
}
function handler_stamp(claim) {
	return {
		sha: claim.sha,
		...claim.note === void 0 ? {} : { note: claim.note },
		at: (/* @__PURE__ */ new Date()).toISOString()
	};
}
async function whoAmI(mount, request) {
	const { assist, options } = mount;
	const user = await options.identity?.resolveUser(identityRequest(request));
	const auth = options.githubAuth;
	const github = auth ? await githubState(auth, Object.fromEntries(request.headers)) : void 0;
	const media = await mediaFor(options, request) !== null;
	return handler_json({
		user: user ?? null,
		media,
		approval: { required: options.requireApproval === true },
		...github === void 0 ? {} : { github },
		...assist === void 0 ? {} : { assist: { pillars: assist.pillars } }
	}, 200);
}
async function handler_judge(mount, request) {
	const { assist, options } = mount;
	if (!assist) return handler_json({ error: "Not found" }, 404);
	const user = await options.identity?.resolveUser(identityRequest(request));
	return assist.respond(request, user?.id ?? "anonymous", options.logger);
}
async function handler_mockSchema(mount, request, url) {
	const { mock, options } = mount;
	if (mock === void 0 || !mock.preview) return handler_json({ error: "Not found" }, 404);
	if (request.method !== "GET") return handler_json({ error: "Method not allowed" }, 405);
	if (options.identity !== void 0) {
		if (await options.identity.resolveUser(identityRequest(request)) === null) return handler_json({ error: "Sign in to read shapes" }, 401);
	}
	const keys = url.searchParams.getAll("key");
	if (keys.length === 0 || keys.length > 100) return handler_json({ error: `Ask for between 1 and 100 keys` }, 400);
	return handler_json({ shapes: await shapesFor(mock, keys) }, 200);
}
async function mockIdentity(mount, request) {
	const { mock, options } = mount;
	if (mock?.preview !== true) return handler_json({ error: "Not found" }, 404);
	if (request.method !== "GET") return handler_json({ error: "Method not allowed" }, 405);
	if (options.identity !== void 0) {
		if (await options.identity.resolveUser(identityRequest(request)) === null) return handler_json({ error: "Sign in to read identity rules" }, 401);
	}
	return handler_json({ identity: await mock.identity(request) ?? null }, 200);
}
async function handler_mockPlan(mount, request) {
	const { mock, options, planner } = mount;
	if (mock === void 0 || !mock.preview || planner === void 0) return handler_json({ error: "Not found" }, 404);
	const user = await options.identity?.resolveUser(identityRequest(request));
	if (options.identity !== void 0 && user === null) return handler_json({ error: "Sign in to plan a mock" }, 401);
	return planner.respond(request, user?.id ?? "anonymous", options.logger);
}
function identityRequest(request) {
	return {
		headers: Object.fromEntries(request.headers),
		url: request.url
	};
}
async function handler_readJson(request) {
	try {
		return await request.json();
	} catch {
		return;
	}
}
function withoutResolution(draft) {
	const copy = { ...draft };
	delete copy.resolution;
	return copy;
}
function isDraft(value) {
	if (typeof value !== "object" || value === null) return false;
	const draft = value;
	return typeof draft.branch === "string" && typeof draft.body === "string" && !!draft.anchor && (draft.label === void 0 || typeof draft.label === "string") && (draft.commit === void 0 || COMMIT.test(draft.commit));
}
function failure(logger, error) {
	logger?.error("The Maple route failed.", error instanceof Error ? error : new Error(String(error)));
	if (error instanceof errors/* MapleStoreError */.z && error.reason === "unavailable") return handler_json({ error: "The store could not be reached" }, 503);
	if (error instanceof errors/* MapleStoreError */.z || error instanceof RangeError) return handler_json({ error: "The request was not valid for this store" }, 400);
	return handler_json({ error: "Something went wrong" }, 500);
}
function handler_json(body, status) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"content-type": "application/json",
			"cache-control": "no-store"
		}
	});
}
//#endregion


// EXTERNAL MODULE: external "node:buffer"
var external_node_buffer_ = __webpack_require__(573);
;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/route/node.js

//#region src/route/node.ts
function toNodeMiddleware(handle, basePath) {
	return (request, response, next) => {
		if (!((request.url ?? "").split("?")[0] ?? "").startsWith(basePath)) {
			next();
			return;
		}
		serve(handle, request, response).catch(() => fail(response));
	};
}
function fail(response) {
	if (!response.headersSent) response.statusCode = 500;
	response.end();
}
async function serve(handle, request, response) {
	const result = await handle(await toWebRequest(request));
	response.statusCode = result.status;
	result.headers.forEach((value, name) => response.setHeader(name, value));
	response.end(external_node_buffer_.Buffer.from(await result.arrayBuffer()));
}
async function toWebRequest(request) {
	const host = header(request, "host") ?? header(request, ":authority") ?? "localhost";
	const url = `${scheme(request)}://${host}${request.url ?? "/"}`;
	const method = request.method ?? "GET";
	const body = method === "GET" || method === "HEAD" ? void 0 : await readBody(request);
	return new Request(url, {
		method,
		headers: toHeaders(request),
		...body === void 0 ? {} : { body }
	});
}
function toHeaders(request) {
	const headers = new Headers();
	for (const [name, value] of Object.entries(request.headers)) {
		if (name.startsWith(":")) continue;
		if (typeof value === "string") headers.set(name, value);
		else if (Array.isArray(value)) for (const one of value) headers.append(name, one);
	}
	return headers;
}
function scheme(request) {
	return header(request, ":scheme") === "https" ? "https" : "http";
}
function header(request, name) {
	const value = request.headers[name];
	return typeof value === "string" ? value : value?.[0];
}
function readBody(request) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		request.on("data", (chunk) => chunks.push(chunk));
		request.on("end", () => resolve(toArrayBuffer(external_node_buffer_.Buffer.concat(chunks))));
		request.on("error", reject);
	});
}
function toArrayBuffer(buffer) {
	const copy = new ArrayBuffer(buffer.byteLength);
	new Uint8Array(copy).set(buffer);
	return copy;
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+cli@0.17.1_msw@2.15.0_@types+node@26.6.1_typescript@6.0.3__react-dom@19.3.0__a3e435a0947c3732b3498b96a3d85c2b/node_modules/@maple-kit/cli/dist/review/session.js










//#region src/review/session.ts
const exec = (0,external_node_util_.promisify)(external_node_child_process_.execFile);
async function shippedOverlay() {
	const manifest = (0,external_node_module_.createRequire)(import.meta.url).resolve("@maple-kit/ui/package.json");
	const file = (0,external_node_path_.join)((0,external_node_path_.dirname)(manifest), "dist", "standalone.iife.js");
	try {
		return await (0,promises_.readFile)(file, "utf8");
	} catch {
		throw new Error(`The overlay bundle is missing at ${file}. Build it: pnpm --filter @maple-kit/ui build.`);
	}
}
async function repositoryPaths(cwd) {
	try {
		const { stdout } = await exec("git", ["rev-parse", "--show-toplevel"], { cwd });
		const root = stdout.trim() || cwd;
		return {
			root,
			appDir: (0,external_node_path_.relative)(root, cwd).split(external_node_path_.sep).join("/")
		};
	} catch {
		return {
			root: cwd,
			appDir: ""
		};
	}
}
function openInBrowser(url) {
	let command = ["xdg-open", url];
	if (process.platform === "darwin") command = ["open", url];
	if (process.platform === "win32") command = [
		"cmd",
		"/c",
		"start",
		"",
		url
	];
	const [program = "open", ...args] = command;
	const child = (0,external_node_child_process_.spawn)(program, args, {
		detached: true,
		stdio: "ignore"
	});
	child.on("error", () => void 0);
	child.unref();
}
function listen(server, port) {
	return new Promise((resolve, reject) => {
		server.once("error", reject);
		server.listen(port, "127.0.0.1", () => {
			const address = server.address();
			resolve(typeof address === "object" && address !== null ? address.port : port);
		});
	});
}
async function startReview(options) {
	const dev = options.target === void 0 ? await startDevServer({
		cwd: options.cwd,
		...options.script === void 0 ? {} : { script: options.script },
		...options.onOutput === void 0 ? {} : { onOutput: options.onOutput }
	}) : void 0;
	const target = options.target ?? dev.url;
	try {
		const store = options.store ?? await reviewStore(options.env, options.cwd, target.href);
		const overlay = options.overlay ?? await shippedOverlay();
		const handler = createMapleHandler({
			store: store.store,
			...store.media === void 0 ? {} : { media: store.media },
			basePath: ROUTE_PATH
		});
		const settings = {
			target,
			overlay,
			route: toNodeMiddleware(handler, ROUTE_PATH),
			tag: {
				branch: store.branch,
				basePath: ROUTE_PATH,
				...await repositoryPaths(options.cwd)
			},
			...options.onRelaxed === void 0 ? {} : { onRelaxed: options.onRelaxed }
		};
		const server = (0,external_node_http_.createServer)(createProxyListener(settings));
		server.on("upgrade", createUpgradeListener(settings));
		const sockets = /* @__PURE__ */ new Set();
		server.on("connection", (socket) => {
			sockets.add(socket);
			socket.on("close", () => sockets.delete(socket));
		});
		const port = await listen(server, options.proxyPort ?? 0);
		const url = `http://localhost:${String(port)}/`;
		if (options.open === true) openInBrowser(url);
		return {
			url,
			target,
			store,
			started: dev !== void 0,
			stop: () => new Promise((resolve) => {
				dev?.stop();
				server.close(() => resolve());
				for (const socket of sockets) socket.destroy();
			})
		};
	} catch (error) {
		dev?.stop();
		throw error;
	}
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+cli@0.17.1_msw@2.15.0_@types+node@26.6.1_typescript@6.0.3__react-dom@19.3.0__a3e435a0947c3732b3498b96a3d85c2b/node_modules/@maple-kit/cli/dist/commands/review.js


//#region src/commands/review.ts
const REVIEW_FLAGS = {
	port: "string",
	url: "string",
	script: "string",
	"proxy-port": "string",
	"no-open": "boolean"
};
const REVIEW_USAGE = `Usage: maple review [--port <n> | --url <address>] [--script <name>] [--proxy-port <n>] [--no-open]

Puts the Maple overlay on your running app through a local proxy, with nothing
added to the app. Without --port or --url it runs the dev script first.

  --port <n>          Attach to the app already running on localhost:<n>
  --url <address>     Attach to the app at this address, such as http://localhost:3000
  --script <name>     The package.json script to run instead of "dev"
  --proxy-port <n>    Serve the proxy on this port instead of a free one
  --no-open           Print the address without opening a browser`;
var ReviewArgsError = class extends Error {};
function port(flags, name) {
	const value = flags[name];
	if (typeof value !== "string") return void 0;
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) throw new ReviewArgsError(`--${name} must be a port number, not "${value}".`);
	return parsed;
}
function attachTarget(flags) {
	const address = flags["url"];
	const number = port(flags, "port");
	if (address !== void 0 && number !== void 0) throw new ReviewArgsError("Give --port or --url, not both.");
	if (number !== void 0) return new URL(`http://localhost:${String(number)}`);
	if (typeof address !== "string") return void 0;
	try {
		const url = new URL(address);
		if (url.protocol === "http:" || url.protocol === "https:") return url;
	} catch {}
	throw new ReviewArgsError(`--url must be an http or https address, not "${address}".`);
}
function review_describe(session) {
	const kind = session.store.kind === "file" ? "the local file store" : "GitHub";
	return [
		"Maple review is running.",
		"",
		`  Open      ${session.url}`,
		`  Your app  ${session.target.origin}${session.started ? " (started from its dev script)" : ""}`,
		`  Comments  ${session.store.where} (${kind})`,
		`  Branch    ${session.store.branch}`,
		"",
		"Stop with Ctrl-C."
	].join("\n");
}
async function review(args, options = {}) {
	let session;
	try {
		const target = attachTarget(args.flags);
		const proxyPort = port(args.flags, "proxy-port");
		const script = args.flags["script"];
		session = await startReview({
			cwd: options.cwd ?? process.cwd(),
			env: options.env ?? process.env,
			open: !isSet(args.flags, "no-open"),
			...target === void 0 ? {} : { target },
			...typeof script === "string" ? { script } : {},
			...proxyPort === void 0 ? {} : { proxyPort },
			...options.overlay === void 0 ? {} : { overlay: options.overlay }
		});
	} catch (error) {
		if (error instanceof ReviewArgsError) return {
			output: `maple review: ${error.message}\n\n${REVIEW_USAGE}`,
			exitCode: 1
		};
		return {
			output: `maple review: ${error instanceof Error ? error.message : String(error)}`,
			exitCode: 1
		};
	}
	return {
		output: isSet(args.flags, "json") ? JSON.stringify({
			url: session.url,
			target: session.target.origin,
			store: session.store.kind,
			where: session.store.where,
			branch: session.store.branch
		}, null, 2) : review_describe(session),
		exitCode: 0,
		running: { stop: () => session.stop() }
	};
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+cli@0.17.1_msw@2.15.0_@types+node@26.6.1_typescript@6.0.3__react-dom@19.3.0__a3e435a0947c3732b3498b96a3d85c2b/node_modules/@maple-kit/cli/dist/commands/setup-ci.js



//#region src/commands/setup-ci.ts
const WORKFLOW_PATH = ".github/workflows/maple.yml";
const CHECK_NAME = "maple/visual-review";
const GITHUB_ACTIONS_APP_ID = 15368;
const SETUP_CI_FLAGS = {
	"require-approval": "boolean",
	write: "boolean"
};
const SETUP_CI_USAGE = `Usage
  maple setup ci [--require-approval] [--write]

  --require-approval  Hold a quiet pull request until somebody approves it in the
                      overlay. Must match RouteOptions.requireApproval.
  --write             Write ${WORKFLOW_PATH} instead of printing it. Never overwrites.`;
const nodeFs = {
	exists: external_node_fs_.existsSync,
	write(path, content) {
		(0,external_node_fs_.mkdirSync)((0,external_node_path_.dirname)(path), { recursive: true });
		(0,external_node_fs_.writeFileSync)(path, content, { flag: "wx" });
	}
};
function gateWorkflow(requireApproval) {
	return `name: Maple

on:
  pull_request:
  merge_group:

permissions:
  contents: read

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      checks: write
      pull-requests: write
    steps:
      - uses: maple-kit/maple-action@v0
        with:
          mode: sync
      - uses: maple-kit/maple-action@v0
        with:
          mode: gate${requireApproval ? `\n          require-approval: "true"` : ""}
`;
}
function rulesetCommand(integrationId = GITHUB_ACTIONS_APP_ID) {
	return `gh api --method POST 'repos/{owner}/{repo}/rulesets' --input - <<'JSON'
${JSON.stringify({
		name: "Maple visual review",
		target: "branch",
		enforcement: "active",
		conditions: { ref_name: {
			include: ["~DEFAULT_BRANCH"],
			exclude: []
		} },
		rules: [{
			type: "required_status_checks",
			parameters: {
				strict_required_status_checks_policy: false,
				required_status_checks: [{
					context: CHECK_NAME,
					integration_id: integrationId
				}]
			}
		}]
	}, null, 2)}
JSON`;
}
const RULESET_NOTE = `Make ${CHECK_NAME} required, from inside the repository (gh fills in {owner}/{repo}):

${rulesetCommand()}

integration_id ${String(GITHUB_ACTIONS_APP_ID)} is GitHub Actions, the App the workflow's token acts as;
pinning it stops anyone with push access forging a green status under the same name.
A check published from the SDK route by a gate App comes from that App instead,
so pin the gate App's own App ID there.`;
function setupCi(flags, options = {}) {
	const workflow = gateWorkflow(isSet(flags, "require-approval"));
	if (!isSet(flags, "write")) return {
		output: `# ${WORKFLOW_PATH}\n${workflow}\n${RULESET_NOTE}`,
		exitCode: 0
	};
	const fs = options.fs ?? nodeFs;
	const path = (0,external_node_path_.join)(options.cwd ?? process.cwd(), WORKFLOW_PATH);
	if (fs.exists(path)) return {
		output: `${path} already exists; not overwriting it.`,
		exitCode: 1
	};
	try {
		fs.write(path, workflow);
	} catch (error) {
		return {
			output: `Could not write ${path}: ${String(error)}`,
			exitCode: 1
		};
	}
	return {
		output: `Wrote ${path}.\n\n${RULESET_NOTE}`,
		exitCode: 0
	};
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+cli@0.17.1_msw@2.15.0_@types+node@26.6.1_typescript@6.0.3__react-dom@19.3.0__a3e435a0947c3732b3498b96a3d85c2b/node_modules/@maple-kit/cli/dist/commands/setup-verify.js
//#region src/commands/setup-verify.ts
const SETUP_VERIFY_FLAGS = { "client-id": "string" };
const SETUP_VERIFY_USAGE = `Usage
  maple setup verify --client-id=<Iv…>

  --client-id  The comment App's Client ID, starting Iv. Not the App ID.`;
const DEVICE_CODE_URL = "https://github.com/login/device/code";
async function setupVerify(flags, fetcher = globalThis.fetch) {
	const value = flags["client-id"];
	const clientId = typeof value === "string" ? value.trim() : "";
	if (clientId === "") return setup_verify_failed(SETUP_VERIFY_USAGE);
	let response;
	try {
		response = await fetcher(DEVICE_CODE_URL, {
			method: "POST",
			headers: { accept: "application/json" },
			body: new URLSearchParams({
				client_id: clientId,
				scope: ""
			})
		});
	} catch (error) {
		return setup_verify_failed(`Could not reach GitHub: ${String(error)}`);
	}
	return verdict(response.status, await answerOf(response), clientId);
}
function verdict(status, answer, clientId) {
	if (answer.device_code) return {
		output: `Device Flow is on for ${clientId}. Reviewers can sign in.`,
		exitCode: 0
	};
	if (answer.error === "device_flow_disabled") return setup_verify_failed(`Device Flow is off for ${clientId}, so every reviewer's sign-in will fail.\nFix: the App's settings → Identifying and authorizing users → Enable Device Flow. No reinstall is needed.`);
	if (status === 404 || answer.error === "incorrect_client_credentials") return setup_verify_failed(`GitHub has no App with the client id ${clientId}. Copy the Client ID (it starts with Iv), not the App ID.`);
	const said = answer.error ? `: ${answer.error}` : "";
	return setup_verify_failed(`GitHub answered ${String(status)}${said}.`);
}
async function answerOf(response) {
	try {
		return await response.json();
	} catch {
		return {};
	}
}
function setup_verify_failed(output) {
	return {
		output,
		exitCode: 1
	};
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/client/solo.js
//#region src/client/solo.ts
const SOLO_HEADER = "x-maple-solo";
const SOLO_PARAM = "maple-solo";
const BRIDGE_PARAM = "maple-bridge";
const STORAGE_PREFIX = "maple:solo:";
const BRIDGE_ADDRESS = /^http:\/\/(?:127\.0\.0\.1|localhost|\[::1\]):\d{1,5}$/;
const TOKEN_SHAPE = /^[\w-]{16,128}$/;
const memory = /* @__PURE__ */ new Map();
function isBridgeAddress(bridge) {
	return BRIDGE_ADDRESS.test(bridge);
}
function isSoloToken(token) {
	return TOKEN_SHAPE.test(token);
}
function soloLink(previewUrl, pairing) {
	const url = new URL(previewUrl);
	url.hash = new URLSearchParams({
		[SOLO_PARAM]: pairing.token,
		[BRIDGE_PARAM]: pairing.bridge
	}).toString();
	return url.href;
}
function valid(token, bridge) {
	if (typeof token !== "string" || typeof bridge !== "string") return void 0;
	return isSoloToken(token) && isBridgeAddress(bridge) ? {
		bridge,
		token
	} : void 0;
}
function parsePairing(hash) {
	const fragment = new URLSearchParams(hash.replace(/^#/, ""));
	return valid(fragment.get(SOLO_PARAM), fragment.get(BRIDGE_PARAM));
}
function withoutPairing(hash) {
	const fragment = new URLSearchParams(hash.replace(/^#/, ""));
	fragment.delete(SOLO_PARAM);
	fragment.delete(BRIDGE_PARAM);
	const rest = fragment.toString();
	return rest === "" ? "" : `#${rest}`;
}
function reach(options) {
	if (options.storage) return options.storage;
	try {
		return globalThis.localStorage;
	} catch {
		options.logger?.warn("Solo mode lasts this page only: this browser blocks site data.");
		return;
	}
}
function pageOf(options) {
	return options.location ?? globalThis.location;
}
function keyFor(options) {
	return STORAGE_PREFIX + (options.origin ?? pageOf(options)?.origin ?? "");
}
function remember(key, pairing, options) {
	const storage = reach(options);
	try {
		if (storage) {
			storage.setItem(key, JSON.stringify(pairing));
			return;
		}
	} catch {
		options.logger?.warn("Solo mode could not be stored; it lasts this page only.");
	}
	memory.set(key, pairing);
}
function recall(key, options) {
	const storage = reach(options);
	if (!storage) return memory.get(key);
	try {
		const raw = storage.getItem(key);
		if (raw === null) return void 0;
		const stored = JSON.parse(raw);
		return valid(stored.token, stored.bridge);
	} catch {
		return memory.get(key);
	}
}
function capturePairing(options = {}) {
	const page = pageOf(options);
	const key = keyFor(options);
	const arrived = page === void 0 ? void 0 : parsePairing(page.hash);
	if (page !== void 0 && arrived !== void 0) {
		remember(key, arrived, options);
		strip(page, options);
		return arrived;
	}
	return recall(key, options);
}
function forgetPairing(options = {}) {
	const key = keyFor(options);
	memory.delete(key);
	try {
		reach(options)?.removeItem(key);
	} catch {
		options.logger?.warn("Solo mode could not be cleared from storage.");
	}
}
function strip(page, options) {
	const history = options.history ?? globalThis.history;
	const address = `${page.pathname}${page.search}${withoutPairing(page.hash)}`;
	try {
		history?.replaceState(history.state, "", address);
	} catch {
		options.logger?.warn("The solo pairing could not be removed from the address bar.");
	}
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+core@0.17.1_vitest@5.0.1_@types+node@26.6.1_msw@2.15.0_@types+node@26.6.1_ty_d97d2ec0096a46dcc0ad5cf9f2e5fc2c/node_modules/@maple-kit/core/dist/local/bridge.js








//#region src/local/bridge.ts
function originOf(address) {
	const url = new URL(address);
	if (url.protocol !== "https:" && url.protocol !== "http:") throw new RangeError(`${address} is not an http or https address.`);
	return url.origin;
}
function sameToken(given, wanted) {
	if (given === void 0) return false;
	const [a, b] = [Buffer.from(given), Buffer.from(wanted)];
	return a.length === b.length && (0,external_node_crypto_.timingSafeEqual)(a, b);
}
function first(value) {
	const one = Array.isArray(value) ? value[0] : value;
	return one === "" ? void 0 : one;
}
function isMediaRead(method, path) {
	return method === "GET" && path.startsWith(`/api/maple/media/`);
}
function claimedOrigin(request, allowReferrer) {
	const origin = first(request.headers["origin"]);
	if (origin !== void 0 || !allowReferrer) return origin;
	const referrer = first(request.headers["referer"]);
	try {
		return referrer === void 0 ? void 0 : new URL(referrer).origin;
	} catch {
		return;
	}
}
function refusalFor(request, rules) {
	const host = first(request.headers["host"]);
	if (host === void 0 || !rules.hosts.has(host)) return {
		status: 403,
		reason: "This is not the bridge's address."
	};
	const url = new URL(request.target, "https://bridge.invalid");
	if (request.method === "OPTIONS") return first(request.headers["origin"]) === rules.origin ? void 0 : {
		status: 403,
		reason: "This origin is not paired."
	};
	const media = isMediaRead(request.method, url.pathname);
	if (!sameToken(first(request.headers["x-maple-solo"]) ?? (media ? url.searchParams.get("maple-solo") ?? void 0 : void 0), rules.token)) return {
		status: 401,
		reason: "A pairing token is required."
	};
	if (claimedOrigin(request, media) !== rules.origin) return {
		status: 403,
		reason: "This origin is not paired."
	};
}
function refuse(response, refusal) {
	response.statusCode = refusal.status;
	response.setHeader("content-type", "application/json");
	response.setHeader("cache-control", "no-store");
	response.end(JSON.stringify({ error: refusal.reason }));
}
function allowOrigin(response, origin, request) {
	response.setHeader("access-control-allow-origin", origin);
	response.setHeader("vary", "Origin");
	if (request.method !== "OPTIONS") return;
	response.setHeader("access-control-allow-methods", "GET, POST, PATCH, DELETE");
	response.setHeader("access-control-allow-headers", `${SOLO_HEADER}, content-type, accept`);
	response.setHeader("access-control-max-age", "600");
	if (request.headers["access-control-request-private-network"] === "true") response.setHeader("access-control-allow-private-network", "true");
}
async function startBridge(options) {
	const origin = originOf(options.origin);
	const token = options.token ?? (0,external_node_crypto_.randomBytes)(32).toString("base64url");
	const place = {
		...options.cwd === void 0 ? {} : { cwd: options.cwd },
		...options.root === void 0 ? {} : { root: options.root },
		...options.url === void 0 ? {} : { url: options.url }
	};
	const route = toNodeMiddleware(createMapleHandler({
		store: (0,store/* createCommentStore */.V)(fileStore(place)),
		media: fileMedia(place),
		...options.logger === void 0 ? {} : { logger: options.logger }
	}), DEFAULT_BASE_PATH);
	const hosts = /* @__PURE__ */ new Set();
	const server = (0,external_node_http_.createServer)((request, response) => {
		const refusal = refusalFor({
			method: request.method ?? "GET",
			target: request.url ?? "/",
			headers: request.headers
		}, {
			origin,
			token,
			hosts
		});
		if (refusal) return refuse(response, refusal);
		allowOrigin(response, origin, request);
		if (request.method === "OPTIONS") {
			response.statusCode = 204;
			return response.end();
		}
		route(request, response, () => refuse(response, {
			status: 403,
			reason: "Not a Maple route."
		}));
	});
	const { port } = await bridge_listen(server, options.port ?? 0);
	hosts.add(`127.0.0.1:${String(port)}`).add(`localhost:${String(port)}`);
	const url = `http://127.0.0.1:${String(port)}`;
	return {
		url,
		token,
		origin,
		link: (previewUrl) => soloLink(previewUrl, {
			bridge: url,
			token
		}),
		close: () => shut(server)
	};
}
function bridge_listen(server, port) {
	return new Promise((resolve, reject) => {
		server.once("error", reject);
		server.listen(port, "127.0.0.1", () => resolve(server.address()));
	});
}
function shut(server) {
	return new Promise((resolve, reject) => {
		server.close((error) => error ? reject(error) : resolve());
		server.closeAllConnections();
	});
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+cli@0.17.1_msw@2.15.0_@types+node@26.6.1_typescript@6.0.3__react-dom@19.3.0__a3e435a0947c3732b3498b96a3d85c2b/node_modules/@maple-kit/cli/dist/commands/solo.js

//#region src/commands/solo.ts
const SOLO_FLAGS = { port: "string" };
const SOLO_USAGE = `Usage
  maple solo <preview-url> [--port <number>]

  Starts a bridge on 127.0.0.1 in front of .maple/<branch>/ and prints the link
  that pairs that preview with it. Open the link in the browser you review in.
  Leave this running while you review; Ctrl-C stops it.

  --port  The port to listen on. A free one by default.`;
function solo_failed(output) {
	return {
		output,
		exitCode: 1
	};
}
function portFrom(flags) {
	const value = flags["port"];
	if (typeof value !== "string") return void 0;
	const port = Number(value);
	return Number.isInteger(port) && port >= 0 && port <= 65535 ? port : NaN;
}
function render(bridge, link, json) {
	if (json) return JSON.stringify({
		link,
		bridge: bridge.url,
		origin: bridge.origin
	}, null, 2);
	return [
		`Solo bridge listening on ${bridge.url}, paired with ${bridge.origin} only.`,
		"Open this link in the browser you review in:",
		"",
		`  ${link}`,
		"",
		"Comments and screenshots go to .maple/ on this machine. Ctrl-C stops the bridge."
	].join("\n");
}
async function solo({ positionals, flags }, options = {}) {
	const address = positionals[0];
	if (address === void 0) return solo_failed(SOLO_USAGE);
	const port = portFrom(flags);
	if (Number.isNaN(port)) return solo_failed(`--port must be a port number.\n\n${SOLO_USAGE}`);
	try {
		const bridge = await (options.start ?? startBridge)({
			origin: address,
			...port === void 0 ? {} : { port },
			...options.cwd === void 0 ? {} : { cwd: options.cwd }
		});
		return {
			output: render(bridge, bridge.link(address), flags["json"] === true),
			exitCode: 0
		};
	} catch (error) {
		return solo_failed(`Could not start the solo bridge: ${error instanceof Error ? error.message : String(error)}`);
	}
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+cli@0.17.1_msw@2.15.0_@types+node@26.6.1_typescript@6.0.3__react-dom@19.3.0__a3e435a0947c3732b3498b96a3d85c2b/node_modules/@maple-kit/cli/dist/run.js










//#region src/run.ts
const COMMANDS = {
	connectors: {
		flags: {},
		run: ({ flags }) => {
			const rows = connectorKindRows();
			return present(isSet(flags, "json"), rows, renderConnectorKinds(rows));
		}
	},
	"mock schema": {
		flags: MOCK_SCHEMA_FLAGS,
		run: (args, options) => mockSchema(args, options.generate)
	},
	"mock plan": {
		flags: MOCK_PLAN_FLAGS,
		run: (args, options) => mockPlan(args, options.fetch)
	},
	review: {
		flags: REVIEW_FLAGS,
		run: (args, options) => review(args, options.cwd === void 0 ? {} : { cwd: options.cwd })
	},
	"setup app": {
		flags: SETUP_APP_FLAGS,
		run: ({ flags }) => setupApp(flags, isSet(flags, "json"))
	},
	"setup verify": {
		flags: SETUP_VERIFY_FLAGS,
		run: ({ flags }, options) => setupVerify(flags, options.fetch)
	},
	solo: {
		flags: SOLO_FLAGS,
		run: (args, options) => solo(args, soloOptions(options))
	},
	"setup ci": {
		flags: SETUP_CI_FLAGS,
		run: ({ flags }, options) => setupCi(flags, pick(options))
	}
};
const GROUP_USAGE = {
	mock: `${MOCK_SCHEMA_USAGE}\n\n${MOCK_PLAN_USAGE}`,
	setup: `${SETUP_APP_USAGE}\n\n${SETUP_VERIFY_USAGE}\n\n${SETUP_CI_USAGE}`
};
const ANY_FLAG = Object.fromEntries([GLOBAL_FLAGS, ...Object.values(COMMANDS).map((command) => command.flags)].flatMap((spec) => Object.entries(spec)));
function present(json, value, text) {
	return {
		output: json ? JSON.stringify(value, null, 2) : text,
		exitCode: 0
	};
}
async function run_run(argv, options) {
	const { command, flags, positionals } = parseArgs$1(argv, ANY_FLAG, { strict: false });
	if (isSet(flags, "version")) return {
		output: options.version,
		exitCode: 0
	};
	if (isSet(flags, "help") || command === void 0) return {
		output: HELP,
		exitCode: 0
	};
	const group = GROUP_USAGE[command];
	const name = group === void 0 ? command : `${command} ${positionals[0] ?? ""}`;
	const found = COMMANDS[name];
	if (found === void 0) {
		if (group !== void 0) return {
			output: group,
			exitCode: 1
		};
		return {
			output: `Unknown command "${command}".\n\n${HELP}`,
			exitCode: 1
		};
	}
	const spec = {
		...found.flags,
		...GLOBAL_FLAGS
	};
	let args;
	try {
		args = parseArgs$1(argv, spec);
	} catch (error) {
		if (!(error instanceof ArgsError)) throw error;
		return {
			output: `maple ${name}: ${error.message}\nIts flags: ${describeFlags(spec)}`,
			exitCode: 1
		};
	}
	return found.run(args, options);
}
function soloOptions({ cwd, start }) {
	return {
		...cwd === void 0 ? {} : { cwd },
		...start === void 0 ? {} : { start }
	};
}
function pick({ cwd, fs }) {
	return {
		...cwd === void 0 ? {} : { cwd },
		...fs === void 0 ? {} : { fs }
	};
}
//#endregion


;// CONCATENATED MODULE: ./node_modules/.pnpm/@maple-kit+cli@0.17.1_msw@2.15.0_@types+node@26.6.1_typescript@6.0.3__react-dom@19.3.0__a3e435a0947c3732b3498b96a3d85c2b/node_modules/@maple-kit/cli/dist/index.js








/***/ })

};

//# sourceMappingURL=933.index.js.map