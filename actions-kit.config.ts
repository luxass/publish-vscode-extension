import { defineConfig } from "actions-kit/config";
import rolldown from "@actions-sdk/rolldown-builder";

export default defineConfig({
	writeYaml: true,
	action: {
		name: "Publish Visual Studio Code Extension",
		description:
			"An action to publish Visual Studio Code Extension to Open VSX Registry or Visual Studio Marketplace",
		author: "luxass",
		branding: {
			color: "purple",
			icon: "package",
		},
		inputs: {
			token: {
				description: "The token to use for authentication.",
				required: true,
			},
			registry: {
				description:
					"The registry to publish to. (URL's are supported, but also the values 'open-vsx' and 'vs-marketplace' are supported.)",
				required: true,
				default: "vs-marketplace",
			},
			"extension-path": {
				description: "Path to VSIX File or path the extension you want to publish.",
				required: false,
				default: "./",
			},
			debug: {
				description:
					"Show debug information. (This is not the same as enabling debug logging for the workflow rerun)",
				required: false,
				default: "false",
			},
			"dry-run": {
				description:
					"Do not publish the extension, but show the information that would be sent to the registry.",
				required: false,
				default: "false",
			},
			"pre-release": {
				description: "Mark the extension as pre-release extension.",
				required: false,
				default: "false",
			},
			manager: {
				description:
					"The package manager to use. (we automatically detect the package manager if you don't specify it)",
				required: false,
			},
			"fail-silently": {
				description: "Do not fail if the extension is already published.",
				required: false,
				default: "false",
			},
			targets: {
				description: "Target architecture(s) the extension should run on. (Comma separated list)",
				required: false,
			},
			"base-content-url": {
				description: "Prepend all relative links in README.md with this URL.",
				required: false,
			},
			"base-images-url": {
				description: "Prepend all relative image links in README.md with this URL.",
				required: false,
			},
		},
		outputs: {
			vsix: {
				description: "The path to the VSIX file.",
			},
			success: {
				description: "Whether the action was successful.",
			},
		},
		runs: {
			using: "node20",
			main: "dist/index.mjs",
		},
	},
	builder: rolldown({
		external: [
			"keytar"
		]
  }),
});
