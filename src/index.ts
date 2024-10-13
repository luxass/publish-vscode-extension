import * as core from "@actions/core";
import { REGISTRIES, type Registry } from "./constants";
import * as fs from "node:fs";
import { createVsix } from "./vsix";
import { publishVSIX as publishVSCE } from "@vscode/vsce";
import { publish as publishOVSX } from "ovsx"

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

	if (!URL.canParse(registry) && !Object.keys(REGISTRIES).includes(registry)) {
		core.setFailed(`invalid registry used: ${registry}`);
		return;
	}


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

		extensionFile = result.outfile
	} else {
		extensionFile = extensionPath;
		core.info("extension is already packaged, skipping.")
	}


	const preRelease = core.getBooleanInput("pre-release");

	if (dryRun) {
		core.info("dry-run enabled, skipping publish");
		return;
	}

	if (registry === "vs-marketplace") {
		const result = await publishVSCE(extensionFile, {
			pat: token,
			preRelease,
		});

		core.info(`published ${extensionFile} to marketplace: ${JSON.stringify(result, null, 2)}`);
	} else {
		const result = await publishOVSX({
			pat: token,
			preRelease,
		})

		core.info(`published ${extensionFile} to marketplace: ${JSON.stringify(result, null, 2)}`);
	}
}

run().catch((err) => {
	console.error(err);
	core.setFailed(err);
});
