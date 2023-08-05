import { existsSync } from "node:fs";
import { getBooleanInput, getInput, setFailed, setOutput } from "@actions/core";

const REGISTRIES = {
  VSCE: "https://marketplace.visualstudio.com",
  OVSX: "https://open-vsx.org"
} as const;

type Registry = keyof typeof REGISTRIES;

async function getExtensionFile(extensionFile: string) {

}

async function run() {
  const token = getInput("token", {
    required: true
  });
  const registry = getInput("registry");
  let extensionPath = getInput("extensionPath");
  const listFiles = getBooleanInput("debugVSIXFile");
  const noPublish = getBooleanInput("noPublish");
  const preRelease = getBooleanInput("preRelease");

  if (!Object.keys(REGISTRIES).includes(registry.toUpperCase())) {
    setFailed(`Invalid registry, must be one of: ${Object.keys(REGISTRIES).join(", ")}`);
  }

  const registryUrl = REGISTRIES[registry.toUpperCase() as Registry];
  setOutput("registryUrl", registryUrl);
  setOutput("registry", registry);

  if (!extensionPath) {
    if (!existsSync(extensionPath)) {
      setFailed(`File not found: ${extensionPath}`);
    }
    extensionPath = await getExtensionFile(extensionPath);
    setOutput("extensionFile", extensionPath);
  }
}

run().catch((err) => {
  console.error(err);
  setFailed(err);
  process.exit(1);
});
