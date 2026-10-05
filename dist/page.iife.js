(function() {
	//#region ../core/src/anchor/selector.ts
	const ID = /^[A-Za-z][\w-]*$/;
	function cssPathTo(element, root = document) {
		if (!contains(root, element)) return void 0;
		const identifier = uniqueId(element, root);
		if (identifier) return identifier;
		const steps = [];
		for (let current = element; current; current = current.parentElement) {
			steps.unshift(step(current));
			const selector = steps.join(" > ");
			if (root.querySelectorAll(selector).length === 1) return selector;
		}
	}
	function uniqueId(element, root) {
		const { id } = element;
		if (!id || !ID.test(id)) return void 0;
		const selector = `#${id}`;
		return root.querySelectorAll(selector).length === 1 ? selector : void 0;
	}
	function step(element) {
		const tag = element.tagName.toLowerCase();
		const parent = element.parentElement;
		if (!parent) return tag;
		const siblings = [...parent.children].filter((child) => child.tagName === element.tagName);
		if (siblings.length === 1) return tag;
		return `${tag}:nth-of-type(${siblings.indexOf(element) + 1})`;
	}
	function contains(root, element) {
		return root === element.ownerDocument || root.contains(element);
	}
	//#endregion
	//#region ../core/src/anchor/text-position.ts
	const BLOCKS = "address, article, aside, blockquote, dd, details, div, dl, dt, fieldset, figcaption, figure, footer, form, h1, h2, h3, h4, h5, h6, header, hr, li, main, nav, ol, p, pre, section, summary, table, td, th, tr, ul";
	const SEPARATOR = " ";
	const WHITESPACE = /[ \t\n\r\f]/;
	const NEEDS_COLLAPSING = /[\t\n\r\f]| {2}/;
	const SKIPPED = /* @__PURE__ */ new Set([
		"SCRIPT",
		"STYLE",
		"NOSCRIPT",
		"TEMPLATE",
		"IFRAME"
	]);
	function indexText(root) {
		const segments = [];
		const builder = {
			text: "",
			breakBefore: false,
			block: void 0
		};
		const start = root instanceof Element ? root : root.parentElement;
		if (start && !isVisible(start)) return {
			text: "",
			segments
		};
		const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, { acceptNode: (node) => {
			if (node.nodeType === Node.TEXT_NODE) return NodeFilter.FILTER_ACCEPT;
			if (isHidden(node)) return NodeFilter.FILTER_REJECT;
			return node.tagName === "BR" ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
		} });
		for (let current = walker.nextNode(); current; current = walker.nextNode()) if (current.nodeType !== Node.TEXT_NODE) builder.breakBefore = true;
		else append(builder, current, segments);
		return {
			text: builder.text,
			segments
		};
	}
	function append(builder, node, segments) {
		const before = builder.text.length;
		const block = node.parentElement?.closest(BLOCKS) ?? null;
		const separate = builder.breakBefore || builder.block !== void 0 && builder.block !== block;
		const tail = builder.text.charAt(before - 1);
		const gap = separate && before > 0 && tail !== SEPARATOR;
		const run = collapse(node.data, gap ? SEPARATOR : tail);
		if (run.text.length === 0) return;
		const start = before + (gap ? 1 : 0);
		builder.text += (gap ? SEPARATOR : "") + run.text;
		segments.push({
			node,
			start,
			end: start + run.text.length,
			...run.kept ? { kept: run.kept } : {}
		});
		builder.block = block;
		builder.breakBefore = false;
	}
	function collapse(data, tail) {
		const open = tail === SEPARATOR || tail === "";
		if (!NEEDS_COLLAPSING.test(data) && !(open && WHITESPACE.test(data.charAt(0)))) return { text: data };
		let text = "";
		let last = tail;
		const kept = [];
		for (let index = 0; index < data.length; index++) {
			const space = WHITESPACE.test(data.charAt(index));
			if (space && (last === SEPARATOR || last === "")) continue;
			last = space ? SEPARATOR : data.charAt(index);
			text += last;
			kept.push(index);
		}
		return {
			text,
			kept
		};
	}
	function spanOf(index, element) {
		const inside = index.segments.filter((segment) => element.contains(segment.node));
		const first = inside[0];
		const last = inside[inside.length - 1];
		return first && last ? {
			start: first.start,
			end: last.end
		} : void 0;
	}
	function isVisible(element) {
		for (let current = element; current; current = current.parentElement) if (isHidden(current)) return false;
		return true;
	}
	function isHidden(element) {
		return SKIPPED.has(element.tagName) || element.hasAttribute("data-maple-overlay") || element.hasAttribute("hidden") || element.getAttribute("aria-hidden") === "true";
	}
	//#endregion
	//#region ../core/src/anchor/describe.ts
	const CONTEXT_LENGTH = 32;
	const MAXIMUM_QUOTE = 300;
	function describeElement(element, options = {}) {
		const root = options.root ?? element.ownerDocument;
		const index = indexText(root);
		const span = spanOf(index, element);
		return {
			...attributesOf(element),
			...span ? { quote: quoteAt(index, span, element, options) } : {},
			...withSelector(element, root)
		};
	}
	function attributesOf(element) {
		const key = closestAttribute(element, "data-maple-key");
		const source = closestAttribute(element, "data-maple-src");
		const component = closestAttribute(element, "data-maple-name");
		return {
			...key === void 0 ? {} : { key },
			...source === void 0 ? {} : { source },
			...component === void 0 ? {} : { component }
		};
	}
	function withSelector(element, root) {
		const selector = cssPathTo(element, root);
		return selector === void 0 ? {} : { selector };
	}
	function closestAttribute(element, name) {
		return element.closest(`[${name}]`)?.getAttribute(name) ?? void 0;
	}
	const CHROME = "nav, header, aside, [data-maple-private]";
	const LANDMARK = "main, [role=main]";
	const COMPONENT = "[data-maple-src], [data-maple-name]";
	function quoteAt(index, span, element, options) {
		const context = options.contextLength ?? CONTEXT_LENGTH;
		const limit = options.maximumQuote ?? MAXIMUM_QUOTE;
		const { start } = span;
		const stop = Math.min(span.end, start + limit);
		const bounds = boundsOf(index, element, span);
		const hidden = chromeOutside(element);
		const prefix = textBetween(index, bounds.start, start, hidden).slice(-context);
		const suffix = textBetween(index, stop, bounds.end, hidden).slice(0, context);
		return {
			exact: index.text.slice(start, stop),
			...prefix ? { prefix } : {},
			...suffix ? { suffix } : {},
			offset: start
		};
	}
	function boundsOf(index, element, span) {
		const container = element.closest(LANDMARK) ?? element.parentElement?.closest(COMPONENT);
		const within = container ? spanOf(index, container) : void 0;
		const whole = {
			start: 0,
			end: index.text.length
		};
		if (!within || within.start > span.start || within.end < span.end) return whole;
		return within;
	}
	function chromeOutside(element) {
		return (node) => {
			const chrome = node.parentElement?.closest(CHROME);
			return chrome !== null && chrome !== void 0 && !chrome.contains(element);
		};
	}
	function textBetween(index, from, to, skipped) {
		let text = "";
		let position = from;
		for (const segment of index.segments) {
			if (segment.end <= from || segment.start >= to || !skipped(segment.node)) continue;
			text += index.text.slice(position, Math.max(position, segment.start));
			position = Math.max(position, Math.min(segment.end, to));
		}
		return (text + index.text.slice(position, to)).replace(/ {2,}/g, " ");
	}
	const MOCK_STATES = [
		"empty",
		"error",
		"forbidden",
		"loading",
		"one",
		"many",
		"long",
		"sparse",
		"mixed"
	];
	var InvalidRecipeError = class extends Error {
		issues;
		name = "InvalidRecipeError";
		constructor(issues) {
			super(["Invalid mock recipe:", ...issues].join("\n  "));
			this.issues = issues;
		}
	};
	const KEY = /^[a-z]+:\S/;
	const STATES = new Set(MOCK_STATES);
	function parseRecipe(input) {
		if (!isRecord(input)) throw new InvalidRecipeError(["a recipe is an object"]);
		const issues = [...versionIssues(input["version"])];
		const calls = parseCalls(input["calls"], issues);
		const flags = parseFlags(input["flags"], issues);
		const as = parseIdentity(input["as"], issues);
		const { request, route } = input;
		if (request !== void 0 && typeof request !== "string") issues.push("request: must be a string when present");
		if (route !== void 0 && !(typeof route === "string" && route.startsWith("/"))) issues.push("route: must be a path pattern starting with \"/\" when present");
		if (issues.length > 0) throw new InvalidRecipeError(issues);
		return {
			version: 2,
			calls,
			...flags === void 0 ? {} : { flags },
			...as === void 0 ? {} : { as },
			...typeof route === "string" ? { route } : {},
			...typeof request === "string" ? { request } : {}
		};
	}
	function versionIssues(version) {
		if (version === 1 || version === 2) return [];
		if (typeof version === "number" && version > 2) return [`version: ${version} is newer than this build reads (2)`];
		return [`version: must be 1 or 2`];
	}
	function parseFlags(value, issues) {
		if (value === void 0) return void 0;
		if (!isRecord(value)) {
			issues.push("flags: must be an object of flag keys when present");
			return;
		}
		const flags = {};
		for (const [key, flag] of Object.entries(value)) if (key.trim() === "") issues.push("flags: a flag key must not be blank");
		else if (isFlagValue(flag)) flags[key] = structuredClone(flag);
		else issues.push(`flags.${key}: must be a JSON value`);
		return flags;
	}
	function isFlagValue(value) {
		if (value === null || typeof value === "boolean" || typeof value === "string") return true;
		if (typeof value === "number") return Number.isFinite(value);
		if (Array.isArray(value)) return value.every(isFlagValue);
		return isRecord(value) && Object.values(value).every(isFlagValue);
	}
	function parseIdentity(value, issues) {
		if (value === void 0) return void 0;
		if (!isRecord(value)) {
			issues.push("as: must be an object when present");
			return;
		}
		const { role, permissions } = value;
		if (role === void 0 && permissions === void 0) issues.push("as: must name a role, permissions, or both");
		const validRole = typeof role === "string" && role.trim() !== "";
		if (role !== void 0 && !validRole) issues.push("as.role: must be a non-blank string");
		const granted = parsePermissions(permissions, issues);
		return {
			...validRole ? { role } : {},
			...granted === void 0 ? {} : { permissions: granted }
		};
	}
	function parsePermissions(value, issues) {
		if (value === void 0) return void 0;
		if (!isRecord(value)) {
			issues.push("as.permissions: must map each permission to true or false");
			return;
		}
		const permissions = {};
		for (const [key, granted] of Object.entries(value)) if (key.trim() === "") issues.push("as.permissions: a permission must not be blank");
		else if (typeof granted === "boolean") permissions[key] = granted;
		else issues.push(`as.permissions.${key}: must be true or false`);
		return permissions;
	}
	function parseCalls(value, issues) {
		if (!Array.isArray(value)) {
			issues.push("calls: must be an array");
			return [];
		}
		const seen = /* @__PURE__ */ new Set();
		const calls = [];
		value.forEach((entry, index) => {
			const call = parseCall(entry, `calls.${index}`, issues);
			if (call === void 0) return;
			if (seen.has(call.key)) issues.push(`calls.${index}.key: "${call.key}" appears twice`);
			seen.add(call.key);
			calls.push(call);
		});
		return calls;
	}
	function parseCall(entry, path, issues) {
		if (!isRecord(entry)) {
			issues.push(`${path}: must be an object`);
			return;
		}
		const { key, state } = entry;
		const validKey = typeof key === "string" && KEY.test(key);
		const validState = typeof state === "string" && STATES.has(state);
		if (!validKey) issues.push(`${path}.key: must look like "codec:name"`);
		if (!validState) issues.push(`${path}.state: must be one of ${MOCK_STATES.join(", ")}`);
		return validKey && validState ? {
			key,
			state
		} : void 0;
	}
	function isRecord(value) {
		return typeof value === "object" && value !== null && !Array.isArray(value);
	}
	//#endregion
	//#region ../core/src/mock/active.ts
	const MOCK_HANDLE_KEY = Symbol.for("@maple-kit/mock.installed");
	function activeRecipe() {
		const handle = globalThis[MOCK_HANDLE_KEY];
		if (typeof handle !== "object" || handle === null) return void 0;
		const current = handle.current;
		if (typeof current !== "function") return void 0;
		try {
			const recipe = current.call(handle);
			return recipe === void 0 ? void 0 : parseRecipe(recipe);
		} catch {
			return;
		}
	}
	//#endregion
	//#region ../core/src/overlay/context.ts
	const REGION_SELECTOR = "[role=\"dialog\"], [role=\"complementary\"], [role=\"navigation\"], dialog[open], details[open], [aria-expanded=\"true\"], [data-state=\"open\"]";
	const MINIMUM_REGION_WIDTH = 24;
	function captureContext(options = {}) {
		const breakpoint = firstMatching(options.breakpoints);
		const layout = options.layout?.();
		const mock = activeRecipe();
		return {
			url: location.href,
			viewport: viewport(),
			scheme: matches("(prefers-color-scheme: dark)") ? "dark" : "light",
			...breakpoint === void 0 ? {} : { breakpoint },
			locale: navigator.language,
			timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			reducedMotion: matches("(prefers-reduced-motion: reduce)"),
			regions: regions(),
			...layout === void 0 ? {} : { layout },
			...mock === void 0 ? {} : { mock },
			capturedAt: (/* @__PURE__ */ new Date()).toISOString()
		};
	}
	function viewport() {
		const visual = window.visualViewport;
		return {
			width: window.innerWidth,
			height: window.innerHeight,
			contentWidth: document.documentElement.clientWidth,
			dpr: window.devicePixelRatio,
			...visual ? { scale: visual.scale } : {}
		};
	}
	function firstMatching(breakpoints) {
		return breakpoints?.find(([, query]) => matches(query))?.[0];
	}
	function matches(query) {
		return window.matchMedia(query).matches;
	}
	function regions() {
		const found = [];
		for (const element of document.querySelectorAll(REGION_SELECTOR)) {
			const width = element.getBoundingClientRect().width;
			if (width < MINIMUM_REGION_WIDTH) continue;
			const label = accessibleName(element);
			found.push({
				role: element.getAttribute("role") ?? element.tagName.toLowerCase(),
				...label === void 0 ? {} : { label },
				width: Math.round(width)
			});
		}
		return found;
	}
	function accessibleName(element) {
		const label = element.getAttribute("aria-label")?.trim();
		if (label) return label;
		const id = element.getAttribute("aria-labelledby");
		return (id ? document.getElementById(id)?.textContent?.trim() : void 0) || void 0;
	}
	//#endregion
	//#region src/rendered/collect.ts
	const INTERACTIVE_TAGS = [
		"a",
		"button",
		"input",
		"select",
		"summary",
		"textarea"
	];
	const INTERACTIVE_ROLES = [
		"button",
		"checkbox",
		"link",
		"menuitem",
		"switch",
		"tab"
	];
	const TEXT_CAP = 80;
	function isInteractive(element) {
		const tag = element.tagName.toLowerCase();
		if (INTERACTIVE_TAGS.includes(tag)) return true;
		const role = element.getAttribute("role");
		if (role !== null && INTERACTIVE_ROLES.includes(role)) return true;
		const tabIndex = element.getAttribute("tabindex");
		return tabIndex !== null && Number.parseInt(tabIndex, 10) >= 0;
	}
	function isOpaque(color) {
		if (color === "transparent") return false;
		const alpha = /rgba?\([^)]*[,/]\s*([\d.]+)\s*\)/.exec(color);
		return alpha === null || Number.parseFloat(alpha[1]) > 0;
	}
	function backdropOf(element) {
		let node = element;
		while (node !== null) {
			const background = getComputedStyle(node).backgroundColor;
			if (isOpaque(background)) return background;
			node = node.parentElement;
		}
		return "rgb(255, 255, 255)";
	}
	function keyframeProperties(names) {
		const wanted = names.split(",").map((name) => name.trim());
		if (wanted.every((name) => name === "none" || name === "")) return [];
		const found = /* @__PURE__ */ new Set();
		for (const sheet of [...document.styleSheets]) {
			let rules;
			try {
				rules = sheet.cssRules;
			} catch {
				continue;
			}
			collectKeyframes(rules, wanted, found);
		}
		return [...found];
	}
	function collectKeyframes(rules, wanted, found) {
		for (const rule of [...rules]) {
			if (!(rule instanceof CSSKeyframesRule) || !wanted.includes(rule.name)) continue;
			for (const frame of [...rule.cssRules]) {
				if (!(frame instanceof CSSKeyframeRule)) continue;
				for (const property of [...frame.style]) found.add(property);
			}
		}
	}
	function paintsOwnText(element) {
		return [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? "").trim() !== "");
	}
	function recordOf(element) {
		const style = getComputedStyle(element);
		const box = element.getBoundingClientRect();
		return {
			anchor: describeElement(element),
			tag: element.tagName.toLowerCase(),
			text: (element.textContent ?? "").trim().slice(0, TEXT_CAP),
			paintsText: paintsOwnText(element),
			interactive: isInteractive(element),
			color: style.color,
			backgroundColor: style.backgroundColor,
			backdrop: backdropOf(element),
			fontSize: Number.parseFloat(style.fontSize),
			fontWeight: Number.parseFloat(style.fontWeight),
			width: box.width,
			height: box.height,
			transitionProperty: style.transitionProperty,
			transitionDuration: style.transitionDuration,
			animationName: style.animationName,
			animationDuration: style.animationDuration,
			animationProperties: keyframeProperties(style.animationName)
		};
	}
	function readPage() {
		const elements = [...document.querySelectorAll("[data-maple-src]")];
		return {
			context: captureContext(),
			records: elements.map(recordOf)
		};
	}
	//#endregion
	//#region src/rendered/page.ts
	window.__mapleLintRead = readPage;
	//#endregion
})();
