import process from "node:process";
import * as core from "@actions/core";

async function run() {
	const _token = core.getInput("token", {
		required: true,
	});
	const _registry = core.getInput("registry");
	const _extensionPath = core.getInput("extensionPath");
	const _listFiles = core.getBooleanInput("debugVSIXFile");
	const _publish = core.getBooleanInput("publish");
	const _preRelease = core.getBooleanInput("preRelease");

	core.info("Hello, World!");
}

run().catch((err) => {
	console.error(err);
	core.setFailed(err);
	process.exit(1);
});
