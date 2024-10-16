import { readProjectManifest } from "@pnpm/cli-utils";
import type { ProjectManifest } from "@pnpm/types";
import { join } from "node:path";
import packlist from "npm-packlist";
import { versionBump } from "./vsce/version-bump";
import type { Manifest } from "./vsce/manifest";
import {
	createDefaultProcessors,
	processFiles,
	writeVsix,
	type IFile,
	type IPackageOptions,
} from "./vsce/package";

export interface CreateVsixOptions {
	dir: string;
	outfile: string;
	dryRun?: boolean;
}

export async function createVsix(
	target: { dir: string; outfile: string; dry?: boolean },
	options: IPackageOptions = {},
) {
	const { manifest, dir } = await getManifest(target.dir);
	const fileNames = await packlist({ path: dir });
	const files = fileNames.map((f) => ({ path: `extension/${f}`, localPath: join(target.dir, f) }));

	const { outfile } = target;
	if (target.dry) {
		return { manifest, outfile, files, dry: true };
	}

	await versionBump(manifest as Manifest, options);

	const processors = createDefaultProcessors(manifest as Manifest, options);
	const processedFiles = await processFiles(processors, files);

	await writeVsix(processedFiles, outfile);

	return { manifest, outfile, files } as {
		manifest: ProjectManifest;
		outfile: string;
		files: IFile[];
		dry?: boolean;
	};
}

/** @see https://github.com/pnpm/pnpm/blob/29a2a698060a86459f579572ac6d13151bf294ba/releasing/plugin-commands-publishing/src/pack.ts#L70 */
const getManifest = async (packageDir: string) => {
	const { manifest: entryManifest, fileName: manifestFileName } = await readProjectManifest(
		packageDir,
		{},
	);

	const dir = entryManifest.publishConfig?.directory
		? join(packageDir, entryManifest.publishConfig.directory)
		: packageDir;
	const manifest =
		packageDir !== dir ? (await readProjectManifest(dir, {})).manifest : entryManifest;

	if (!manifest.name) {
		throw new Error(`Package name is not defined in the ${manifestFileName}.`);
	}

	if (!manifest.version) {
		throw new Error(`Package version is not defined in the ${manifestFileName}.`);
	}

	return { manifest, dir, manifestFileName };
};
