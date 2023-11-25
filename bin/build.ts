import { build, BuildOptions } from "esbuild";
import { statSync } from "node:fs";
import { resolve } from "node:path";
import { format } from "./pretty-bytes";
import { cyan, green } from "console-log-colors";

interface Options extends BuildOptions {
	outfile: string;
}

const options: Options = {
	entryPoints: ["./src/index.ts"],
	// define: {
	// 	"process.env.NODE_ENV": '"production"',
	// },
	minify: true,
	bundle: true,
	outfile: "./dist/index.js",
	target: "node20",
	platform: "node",
	format: "cjs",
	sourcemap: true,
};

// Log success message
const logSuccess = () => {
	const outfile = options.outfile;
	const distSize = statSync(resolve(outfile)).size;
	console.log(outfile, "|", cyan(format(distSize)));
	console.log(green("\u{2714} Finished successfully!"));
};

// Build and log result
build(options)
	.catch((err) => {
		console.error(err);
		process.exit(1);
	})
	.then(logSuccess);
