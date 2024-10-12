import * as core from "@actions/core";
import { REGISTRIES } from "./constants";
import * as fs from "node:fs";
import * as path from "node:path";

async function run() {
	const _token = core.getInput("token", {
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

	core.info(`extensionPath is a ${isFile ? "file" : "directory"}`);

	const publish = core.getBooleanInput("publish");
	const preRelease = core.getBooleanInput("preRelease");

	core.info("Hello, World!");
	core.info(
		JSON.stringify({
			registry,
			extensionPath,
			debug,
			publish,
			preRelease,
			dryRun,
		}),
	);
}

run().catch((err) => {
	console.error(err);
	core.setFailed(err);
});
