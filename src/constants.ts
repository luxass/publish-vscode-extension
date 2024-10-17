export const REGISTRIES = {
	"open-vsx": "https://open-vsx.org",
	"vs-marketplace": "https://marketplace.visualstudio.com",
} as const;

export type Registry = keyof typeof REGISTRIES;
