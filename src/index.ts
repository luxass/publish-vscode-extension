import process from "node:process";
import * as core from "@actions/core";

async function run() {
	const _token = core.getInput("token", {
		required: true,
	});
	const registry = core.getInput("registry");
	const extensionPath = core.getInput("extensionPath");
	const debug = core.getBooleanInput("debug");
	const publish = core.getBooleanInput("publish");
	const preRelease = core.getBooleanInput("preRelease");
	const dryRun = core.getBooleanInput("dry-run");

	core.info("Hello, World!");
	core.info(JSON.stringify({
		registry,
		extensionPath,
		debug,
		publish,
		preRelease,
		dryRun
	}))
}

run().catch((err) => {
	console.error(err);
	core.setFailed(err);
	process.exit(1);
});
