import { build } from "esbuild";
import fs from "fs";
import path from "path";
import prettyBytes from "pretty-bytes";
import { cyan, green } from "console-log-colors";
import logSymbols from "log-symbols";

/** @type {import('esbuild').BuildOptions} */
const options = {
	entryPoints: ["./src/index.ts"],
	minify: true,
	bundle: true,
	outfile: "./dist/index.js",
	target: "node20",
	platform: "node",
	format: "cjs",
	sourcemap: true,
};

build(options)
	.catch((err) => {
		process.stderr.write(err.stderr);
		process.exit(1);
	})
	.then(() => {
		const distSize = fs.statSync(path.resolve(options.outfile)).size;
		console.log(
			options.outfile,
			"|",
			cyan(prettyBytes(distSize, { space: false })),
		);
		console.log(logSymbols.success, green("Finished successfully!"));
	});
