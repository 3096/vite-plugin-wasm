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
Object.defineProperty(exports, "__esModule", { value: true });
const esbuild_plugin_1 = require("./esbuild-plugin");
const wasm_parser_1 = require("./wasm-parser");
const wasmHelper = __importStar(require("./wasm-helper"));
function wasm() {
    let rootPath;
    return {
        name: "vite-plugin-wasm",
        enforce: "pre",
        configResolved(config) {
            if (config.optimizeDeps?.esbuildOptions) {
                // https://github.com/Menci/vite-plugin-wasm/pull/11
                if (!config.optimizeDeps.esbuildOptions.plugins) {
                    config.optimizeDeps.esbuildOptions.plugins = [];
                }
                config.optimizeDeps.esbuildOptions.plugins.push((0, esbuild_plugin_1.esbuildPlugin)());
                // Allow usage of top-level await during development build (not affacting the production build)
                config.optimizeDeps.esbuildOptions.target = "esnext";
            }
            rootPath = config.root;
        },
        resolveId(id) {
            if (id === wasmHelper.id) {
                return id;
            }
        },
        async load(id) {
            if (id === wasmHelper.id) {
                return `export default ${wasmHelper.code}`;
            }
            if (!id.toLowerCase().endsWith(".wasm")) {
                return;
            }
            // Get WASM's download URL by Vite's ?url import
            const wasmUrlUrl = id + "?url";
            return `
import __vite__wasmUrl from ${JSON.stringify(wasmUrlUrl)};
import __vite__initWasm from "${wasmHelper.id}"
${await (0, wasm_parser_1.generateGlueCode)(id, rootPath, { initWasm: "__vite__initWasm", wasmUrl: "__vite__wasmUrl" })}
`;
        }
    };
}
exports.default = wasm;
