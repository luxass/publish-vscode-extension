/// <reference types="../actions-kit.d.ts" />
import * as core from "@actions/core";
import * as fs from "node:fs";
import { publishVSIX as publishVSCE, createVSIX } from "@vscode/vsce";
import { publish as publishOVSX } from "ovsx";
import { getValidatedInput } from "actions-kit";
import { z } from "zod";
import { detect as detectPM } from "package-manager-detector";
import { getManifest } from "./utils";
import { join } from "node:path";

const PM_SCHEMA = z.union([
    z.literal("npm"),
    z.literal("pnpm"),
    z.literal("yarn"),
    z.literal("").transform((val) => (val === "" ? null : val)).refine((val) => val === null, {
        message: "invalid value",
    }),
]);


type A = z.infer<typeof PM_SCHEMA>;

async function run() {
	const token = core.getInput(ACTION_INPUTS.token, {
		required: true,
	});

	const registryResult = getValidatedInput(
		ACTION_INPUTS.registry,
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

	const debug = core.getBooleanInput(ACTION_INPUTS.debug);
	const dryRun = core.getBooleanInput(ACTION_INPUTS["dry-run"]);

	if (debug) {
		core.warning("running with debug mode enabled");
	}

	if (dryRun) {
		core.warning("running with dry-run mode enabled");
	}

	const baseContentUrl = core.getInput(ACTION_INPUTS["base-content-url"], {
		trimWhitespace: true,
	});

	const baseImagesUrl = core.getInput(ACTION_INPUTS["base-images-url"], {
		trimWhitespace: true,
	});

	const failSilently = core.getBooleanInput(ACTION_INPUTS["fail-silently"]);

	const extensionPath = core.getInput(ACTION_INPUTS["extension-path"], {
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

	const rawTargets = core.getInput(ACTION_INPUTS.targets);

	const targets = rawTargets
		.split(",")
		.map((target) => target.trim())
		.filter(Boolean);

	const preRelease = core.getBooleanInput(ACTION_INPUTS["pre-release"]);
	const pmResult = getValidatedInput("manager", PM_SCHEMA);

	if (!pmResult.success) {
		core.setFailed("manager is not a valid value, must be one of: npm, pnpm, yarn");
		return;
	}

	let manager = pmResult.data;

	if (manager == null) {
		// detecting pm based on repository
		core.info("package manager has not been provided, detecting based on repository");

		const detectedPM = await detectPM({
			cwd: process.cwd(),
		});

		if (detectedPM == null) {
			core.setFailed("could not detect package manager");
			return;
		}

		const detectedValidationResult = PM_SCHEMA.safeParse(detectedPM.name);
		if (!detectedValidationResult.success) {
			core.setFailed(
				`detected package manager is not supported, found ${detectedPM.name} but expected one of: npm, pnpm, yarn`,
			);
			return;
		}

		core.info(`detected package manager: ${detectedPM.name}`);
		// @ts-ignore	TODO: fix this later
		manager = detectedPM.name;
	}

	let extensionFile: string;
	if (!isFile) {
		const manifest = await getManifest(extensionPath);
		const extensionName = `${manifest.name}-${manifest.version}.vsix`;
		core.info(`packaging extension: ${extensionName}`);
		core.info(`manifest: ${JSON.stringify(manifest, null, 2)}`);
		if (manager === "pnpm") {
			core.warning(
				"pnpm is not supported natively in `@vscode/vsce`, learn more here: https://github.com/luxass/publish-vscode-extension#pnpm-support",
			);
			await createVSIX({
				baseImagesUrl: baseImagesUrl ?? undefined,
				baseContentUrl: baseContentUrl ?? undefined,
				preRelease,
				version: manifest.version,
				target: targets.join(" "),
				useYarn: false,
				// pnpm is not supported natively in `@vscode/vsce`,
				// so we need to set dependencies to false to avoid scanning node_modules
				dependencies: false,
				packagePath: join(extensionPath, extensionName),
				cwd: extensionPath,

				// TODO: remove later
				allowUnusedFilesPattern: true,
			});
		} else if (manager === "yarn" || manager === "npm") {
			await createVSIX({
				baseImagesUrl: baseImagesUrl ?? undefined,
				baseContentUrl: baseContentUrl ?? undefined,
				preRelease,
				version: manifest.version,
				target: targets.join(" "),
				useYarn: manager === "yarn",
				packagePath: join(extensionPath, extensionName),
				cwd: extensionPath,

				// TODO: remove later
				allowUnusedFilesPattern: true,
			});
		} else {
			core.setFailed("package manager is not supported, must be one of: npm, pnpm, yarn");
			return;
		}

		extensionFile = join(extensionPath, extensionName);
		core.info(`created vsix at: ${extensionFile}`);
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

	core.setOutput("success", true);
	core.setOutput("vsix", extensionFile);
}

run().catch((err) => {
	console.error(err);
	core.setOutput("success", false);
	core.setFailed(err);
});
