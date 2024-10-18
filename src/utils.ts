import { readFile } from "node:fs/promises";
import { join } from "node:path";
import * as core from "@actions/core";

export async function getExtensionName(packagePath: string): Promise<string> {
	const rawJson = await readFile(join(packagePath, "package.json"), "utf8");
	const json = JSON.parse(rawJson) as { name: string; version: string };
	if (!json.name || !json.version) {
		core.warning("package.json is missing name or version");
		return "extension.vsix";
	}

	return `${json.name}-${json.version}.vsix`;
}
