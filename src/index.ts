import * as core from "@actions/core";
import { REGISTRIES } from "./constants";
import * as fs from "node:fs";
import { createVsix } from "./vsix";
import { publishVSIX as publishVSCE } from "@vscode/vsce";
import { publish as publishOVSX } from "ovsx";

async function run() {
	const token = core.getInput("token", {
		required: true,
	});

	const registry = core.getInput("registry", {
		trimWhitespace: true,
	});

	const debug = core.getBooleanInput("debug");
	const dryRun = core.getBooleanInput("dry-run");

	if (debug) {
		core.warning("running with debug mode enabled");
	}

	if (dryRun) {
		core.warning("running with dry-run mode enabled");
	}

	const baseContentUrl = core.getInput("baseContentUrl", {
		trimWhitespace: true,
	});

	const baseImagesUrl = core.getInput("baseImagesUrl", {
		trimWhitespace: true,
	});

	if (!URL.canParse(registry) && !Object.keys(REGISTRIES).includes(registry)) {
		core.setFailed(`invalid registry used: ${registry}`);
		return;
	}

	const failSilently = core.getBooleanInput("fail-silently");

	const extensionPath = core.getInput("extensionPath", {
		trimWhitespace: true,
	});

	core.debug(`extensionPath: ${extensionPath}`);

	if (!fs.existsSync(extensionPath)) {
		core.setFailed("extensionPath is not a valid path");
		return;
	}

	const isFile = fs.lstatSync(extensionPath).isFile();
	const isDirectory = fs.lstatSync(extensionPath).isDirectory();

	if (!isFile && !isDirectory) {
		core.setFailed("extensionPath is not a valid path");
		return;
	}

	let extensionFile: string;
	if (!isFile) {
		const result = await createVsix({ dir: extensionPath, outfile: "extension.vsix", dry: dryRun });

		core.info(`created vsix at: ${JSON.stringify(result, null, 2)}`);

		extensionFile = result.outfile;
	} else {
		extensionFile = extensionPath;
		core.info("extension is already packaged, skipping.");
	}

	const preRelease = core.getBooleanInput("pre-release");
	const rawTargets = core.getInput("targets");

	const targets = rawTargets.split(",").map((target) => target.trim()).filter(Boolean);

	if (dryRun) {
		core.info("dry-run enabled, skipping publish");
		return;
	}


	if (registry === "vs-marketplace") {
		const result = await publishVSCE(extensionFile, {
			pat: token,
			preRelease,
			targets,
			baseContentUrl: baseContentUrl ?? undefined,
			baseImagesUrl: baseImagesUrl ?? undefined,
			skipDuplicate: failSilently
		});

		core.info(`published ${extensionFile} to marketplace: ${JSON.stringify(result, null, 2)}`);
	} else {
		const results = await publishOVSX({
			pat: token,
			preRelease,
			packagePath: [extensionFile],
			targets,
			baseContentUrl: baseContentUrl ?? undefined,
			baseImagesUrl: baseImagesUrl ?? undefined,
			skipDuplicate: failSilently
		});

		for (const result of results) {
			if (result.status === "rejected") {
				throw result.reason;
			}
		}

		core.info(`published ${extensionFile} to marketplace: ${JSON.stringify(results, null, 2)}`);
	}
}

run().catch((err) => {
	console.error(err);
	core.setFailed(err);
});
