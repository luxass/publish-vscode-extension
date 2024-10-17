// @ts-check
import actionsKit from "actions-kit/unplugin/rspack"
import { resolve } from "node:path";

/** @type {import("@rspack/core").Configuration} */
export default {
  target: "node",
  mode: "production",
  entry: "./src/index.ts",
  output: {
    path: resolve(import.meta.dirname, "dist"),
    filename: "index.cjs",
    library: {
      type: "commonjs2",
    },
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  devtool: false,
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: [/node_modules/],
        loader: "builtin:swc-loader",
        options: {
          jsc: {
            parser: {
              syntax: "typescript",
            },
          },
        },
        type: "javascript/auto",
      },
    ],
  },
	experiments: {
		rspackFuture: {
			bundlerInfo: {
				force: true
			}
		},
	},
  optimization: {
    minimize: false,
  },
	plugins: [
		actionsKit({
			actionPath: "./action.yml",
			inject: true
		})
	],
  externals: {
    keytar: "commonjs keytar",
  },
};
