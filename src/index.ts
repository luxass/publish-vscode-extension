/// <reference types="../actions-kit.d.ts" />
import * as core from "@actions/core";
import * as fs from "node:fs";
import { createVsix } from "./vsix";
import { publishVSIX as publishVSCE } from "@vscode/vsce";
import { publish as publishOVSX } from "ovsx";
import { getValidatedInput } from "actions-kit";
import { z } from "zod";

async function run() {
	const token = core.getInput("token", {
		required: true,
	});

	// @ts-expect-error ashdh
	console.log("globalThis.inputs: ", globalThis.inputs)

	const registryResult = getValidatedInput(
		"registry",
		z.union([
			z.literal("vs-marketplace"),
			z.literal("open-vsx"),
			// TODO: use URL.canParse to increase perf
			z
				.string()
				.url()
				.transform((val): string & {} => val),
		]),
		{
			trimWhitespace: true,
		},
	);

	if (!registryResult.success) {
		core.setFailed(
			"registry is not a valid value, must be one of: vs-marketplace, open-vsx or a valid URL",
		);
		return;
	}

	const registry = registryResult.data;

	const debug = core.getBooleanInput("debug");
	const dryRun = core.getBooleanInput("dry-run");

	if (debug) {
		core.warning("running with debug mode enabled");
	}

	if (dryRun) {
		core.warning("running with dry-run mode enabled");
	}

	const baseContentUrl = core.getInput("base-content-url", {
		trimWhitespace: true,
	});

	const baseImagesUrl = core.getInput("base-images-url", {
		trimWhitespace: true,
	});

	const failSilently = core.getBooleanInput("fail-silently");

	const extensionPath = core.getInput("extension-path", {
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

	const rawTargets = core.getInput("targets");

	const targets = rawTargets
		.split(",")
		.map((target) => target.trim())
		.filter(Boolean);

	const preRelease = core.getBooleanInput("pre-release");

	let extensionFile: string;
	if (!isFile) {
		const result = await createVsix(
			{ dir: extensionPath, outfile: "extension.vsix", dry: dryRun },
			{
				target: targets.join(" "),
				preRelease,
				baseImagesUrl: baseImagesUrl ?? undefined,
				baseContentUrl: baseContentUrl ?? undefined,
			},
		);

		core.info(`created vsix at: ${JSON.stringify(result, null, 2)}`);

		extensionFile = result.outfile;
	} else {
		extensionFile = extensionPath;
		core.info("extension is already packaged, skipping.");
	}

	if (dryRun) {
		core.info("dry-run enabled, skipping publish");
		return;
	}

	if (registry === "vs-marketplace") {
		const result = await publishVSCE(extensionFile, {
			pat: token,
			preRelease,
			targets: targets.length > 0 ? targets : undefined,
			baseContentUrl: baseContentUrl ?? undefined,
			baseImagesUrl: baseImagesUrl ?? undefined,
			skipDuplicate: failSilently,
		});

		core.info(`published ${extensionFile} to marketplace: ${JSON.stringify(result, null, 2)}`);
	} else {
		const results = await publishOVSX({
			pat: token,
			preRelease,
			packagePath: [extensionFile],
			targets: targets.length > 0 ? targets : undefined,
			baseContentUrl: baseContentUrl ?? undefined,
			baseImagesUrl: baseImagesUrl ?? undefined,
			skipDuplicate: failSilently,
		});

		for (const result of results) {
			core.info(`result is: ${JSON.stringify(result, null, 2)}`);
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
