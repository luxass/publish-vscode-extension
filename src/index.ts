import process from "node:process";
import { getBooleanInput, getInput, setFailed } from "@actions/core";

// const REGISTRIES = {
//   VSCE: 'https://marketplace.visualstudio.com',
//   OVSX: 'https://open-vsx.org',
// } as const

// type Registry = keyof typeof REGISTRIES

// async function getExtensionFile(_extensionFile: string) {

// }

async function run() {
  const _token = getInput("token", {
    required: true,
  });
  const _registry = getInput("registry");
  const _extensionPath = getInput("extensionPath");
  const _listFiles = getBooleanInput("debugVSIXFile");
  const _publish = getBooleanInput("publish");
  const _preRelease = getBooleanInput("preRelease");

  // if (!Object.keys(REGISTRIES).includes(registry.toUpperCase())) {
  //   setFailed(`Invalid registry, must be one of: ${Object.keys(REGISTRIES).join(', ')}`)
  // }

  // const registryUrl = REGISTRIES[registry.toUpperCase() as Registry]
  // setOutput('registryUrl', registryUrl)
  // setOutput('registry', registry)

  // if (!extensionPath) {
  //   if (!existsSync(extensionPath)) {
  //     setFailed(`File not found: ${extensionPath}`)
  //   }
  //   extensionPath = await getExtensionFile(extensionPath)
  //   setOutput('extensionFile', extensionPath)
  // }

  // if (publish) {
  //   console.log('Publishing extension')
  // }
}

run().catch((err) => {
  console.error(err);
  setFailed(err);
  process.exit(1);
});
