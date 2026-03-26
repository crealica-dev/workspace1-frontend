import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const root = new URL("../src", import.meta.url);
const allowedPrefixes = [
	"lib/design/",
	"lib/components/ui/",
	"routes/sidebar-07/",
];
const allowedFiles = new Set(["routes/layout.css"]);
const rules = [
	{
		name: "arbitrary radius utilities",
		regex: /rounded-\[[^\]]+\]/g,
	},
	{
		name: "arbitrary shadow utilities",
		regex: /shadow-\[[^\]]+\]/g,
	},
	{
		name: "raw gradient background utilities",
		regex: /bg-\[(?:linear-gradient|radial-gradient)/g,
	},
	{
		name: "raw conversation style injection props",
		regex: /\b(?:conversationFrameClass|scrollRegionClass|composerShellClass|promptInputClass)\b/g,
	},
	{
		name: "duplicated status helper",
		regex: /\bfunction getStatusMeta\(/g,
	},
];

const violations = [];

walk(root.pathname);

if (violations.length > 0) {
	console.error("Design check failed:\n");
	for (const violation of violations) {
		console.error(
			`${violation.file}:${violation.line} ${violation.rule}\n  ${violation.preview}`,
		);
	}
	process.exit(1);
}

console.log("Design check passed.");

function walk(directory) {
	for (const entry of readdirSync(directory)) {
		const fullPath = join(directory, entry);
		const stats = statSync(fullPath);
		if (stats.isDirectory()) {
			walk(fullPath);
			continue;
		}

		if (![".svelte", ".ts", ".js", ".css"].includes(extname(fullPath))) continue;
		checkFile(fullPath);
	}
}

function checkFile(filePath) {
	const relPath = relative(root.pathname, filePath).replaceAll("\\", "/");
	if (
		allowedFiles.has(relPath) ||
		allowedPrefixes.some((prefix) => relPath.startsWith(prefix))
	) {
		return;
	}

	const contents = readFileSync(filePath, "utf8");

	for (const rule of rules) {
		for (const match of contents.matchAll(rule.regex)) {
			const startIndex = match.index ?? 0;
			const before = contents.slice(0, startIndex);
			const line = before.split("\n").length;
			const preview = contents
				.slice(startIndex, startIndex + 120)
				.split("\n")[0]
				.trim();

			violations.push({
				file: `src/${relPath}`,
				line,
				rule: rule.name,
				preview,
			});
		}
	}
}
