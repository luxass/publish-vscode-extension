declare module "parse-semver" {
	interface Result {
		readonly name: string;
		readonly version: string;
	}
	namespace parseSemver {}
	function parseSemver(input: string): Result;
	export = parseSemver;
}
