import { readFile } from "node:fs/promises";
import { join } from "node:path";

export interface Manifest {
  name: string
  version: string
}

export async function getManifest(projectDir: string): Promise<Manifest> {
	const manifestPath = join(projectDir, "package.json");
	return JSON.parse(await readFile(manifestPath, "utf-8"))
}
