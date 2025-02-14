"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.esbuildPlugin = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = require("path");
const wasmHelper = __importStar(require("./wasm-helper"));
const wasm_parser_1 = require("./wasm-parser");
function esbuildPlugin() {
    return {
        name: "vite-plugin-wasm",
        setup(build) {
            const NAMESPACE = "vite-plugin-wasm-namespace";
            build.onResolve({ filter: /\.wasm$/ }, args => ({
                path: path_1.posix.join(path_1.posix.dirname(args.importer), args.path),
                namespace: NAMESPACE
            }));
            build.onLoad({ filter: /.*/, namespace: NAMESPACE }, async (args) => {
                const base64 = await fs_1.default.promises.readFile(args.path, "base64");
                const dataUri = "data:application/wasm;base64," + base64;
                return {
                    contents: `
const wasmUrl = "${dataUri}";
const initWasm = ${wasmHelper.code};
${await (0, wasm_parser_1.generateGlueCode)(args.path, build.initialOptions.absWorkingDir, { initWasm: "initWasm", wasmUrl: "wasmUrl" })}
`,
                    loader: "js",
                    resolveDir: path_1.posix.dirname(args.path)
                };
            });
        }
    };
}
exports.esbuildPlugin = esbuildPlugin;
