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
exports.urlToBuiltUrl = exports.getAssetHash = exports.assetFileNamesToFileName = exports.getAssetFilename = exports.fileToUrl = exports.checkPublicFile = exports.assetUrlRE = exports.normalizePath = exports.slash = exports.isWindows = exports.cleanUrl = exports.hashRE = exports.queryRE = exports.FS_PREFIX = void 0;
const path_1 = __importDefault(require("path"));
const url_1 = require("url");
const fs_1 = __importStar(require("fs"));
const mrmime = __importStar(require("mrmime"));
const crypto_1 = require("crypto");
const os_1 = __importDefault(require("os"));
exports.FS_PREFIX = `/@fs/`;
exports.queryRE = /\?.*$/s;
exports.hashRE = /#.*$/s;
const cleanUrl = (url) => url.replace(exports.hashRE, "").replace(exports.queryRE, "");
exports.cleanUrl = cleanUrl;
exports.isWindows = os_1.default.platform() === "win32";
function slash(p) {
    return p.replace(/\\/g, "/");
}
exports.slash = slash;
function normalizePath(id) {
    return path_1.default.posix.normalize(exports.isWindows ? slash(id) : id);
}
exports.normalizePath = normalizePath;
exports.assetUrlRE = /__VITE_ASSET__([a-z\d]{8})__(?:\$_(.*?)__)?/g;
const rawRE = /(\?|&)raw(?:&|$)/;
const urlRE = /(\?|&)url(?:&|$)/;
const assetCache = new WeakMap();
const assetHashToFilenameMap = new WeakMap();
// save hashes of the files that has been emitted in build watch
const emittedHashMap = new WeakMap();
/**
 * Also supports loading plain strings with import text from './foo.txt?raw'
 */
// export function assetPlugin(config: ResolvedConfig): Plugin {
//   // assetHashToFilenameMap initialization in buildStart causes getAssetFilename to return undefined
//   assetHashToFilenameMap.set(config, new Map());
//   // add own dictionary entry by directly assigning mrmine
//   // https://github.com/lukeed/mrmime/issues/3
//   mrmime.mimes["ico"] = "image/x-icon";
//   return {
//     name: "vite:asset",
//     buildStart() {
//       assetCache.set(config, new Map());
//       emittedHashMap.set(config, new Set());
//     },
//     resolveId(id) {
//       if (!config.assetsInclude(cleanUrl(id))) {
//         return;
//       }
//       // imports to absolute urls pointing to files in /public
//       // will fail to resolve in the main resolver. handle them here.
//       const publicFile = checkPublicFile(id, config);
//       if (publicFile) {
//         return id;
//       }
//     },
//     async load(id) {
//       if (id.startsWith("\0")) {
//         // Rollup convention, this id should be handled by the
//         // plugin that marked it with \0
//         return;
//       }
//       // raw requests, read from disk
//       if (rawRE.test(id)) {
//         const file = checkPublicFile(id, config) || cleanUrl(id);
//         // raw query, read file and return as string
//         return `export default ${JSON.stringify(await fsp.readFile(file, "utf-8"))}`;
//       }
//       if (!config.assetsInclude(cleanUrl(id)) && !urlRE.test(id)) {
//         return;
//       }
//       id = id.replace(urlRE, "$1").replace(/[\?&]$/, "");
//       const url = await fileToUrl(id, config, this);
//       return `export default ${JSON.stringify(url)}`;
//     },
//     renderChunk(code, chunk) {
//       let match: RegExpExecArray | null;
//       let s: MagicString | undefined;
//       // Urls added with JS using e.g.
//       // imgElement.src = "my/file.png" are using quotes
//       // Urls added in CSS that is imported in JS end up like
//       // var inlined = ".inlined{color:green;background:url(__VITE_ASSET__5aa0ddc0__)}\n";
//       // In both cases, the wrapping should already be fine
//       while ((match = assetUrlRE.exec(code))) {
//         s = s || (s = new MagicString(code));
//         const [full, hash, postfix = ""] = match;
//         // some internal plugins may still need to emit chunks (e.g. worker) so
//         // fallback to this.getFileName for that.
//         const file = getAssetFilename(hash, config) || this.getFileName(hash);
//         chunk.viteMetadata.importedAssets.add(cleanUrl(file));
//         const outputFilepath = config.base + file + postfix;
//         s.overwrite(match.index, match.index + full.length, outputFilepath);
//       }
//       if (s) {
//         return {
//           code: s.toString(),
//           map: config.build.sourcemap ? s.generateMap({ hires: true }) : null
//         };
//       } else {
//         return null;
//       }
//     },
//     generateBundle(_, bundle) {
//       // do not emit assets for SSR build
//       if (config.command === "build" && config.build.ssr) {
//         for (const file in bundle) {
//           if (bundle[file].type === "asset" && !file.includes("ssr-manifest.json")) {
//             delete bundle[file];
//           }
//         }
//       }
//     }
//   };
// }
function checkPublicFile(url, { publicDir }) {
    // note if the file is in /public, the resolver would have returned it
    // as-is so it's not going to be a fully resolved path.
    if (!publicDir || !url.startsWith("/")) {
        return;
    }
    const publicFile = path_1.default.join(publicDir, (0, exports.cleanUrl)(url));
    if (fs_1.default.existsSync(publicFile)) {
        return publicFile;
    }
    else {
        return;
    }
}
exports.checkPublicFile = checkPublicFile;
function fileToUrl(id, config, ctx) {
    if (config.command === "serve") {
        return fileToDevUrl(id, config);
    }
    else {
        return fileToBuiltUrl(id, config, ctx);
    }
}
exports.fileToUrl = fileToUrl;
function fileToDevUrl(id, config) {
    let rtn;
    if (checkPublicFile(id, config)) {
        // in public dir, keep the url as-is
        rtn = id;
    }
    else if (id.startsWith(config.root)) {
        // in project root, infer short public path
        rtn = "/" + path_1.default.posix.relative(config.root, id);
    }
    else {
        // outside of project root, use absolute fs path
        // (this is special handled by the serve static middleware
        rtn = path_1.default.posix.join(exports.FS_PREFIX + id);
    }
    const origin = config.server?.origin ?? "";
    return origin + config.base + rtn.replace(/^\//, "");
}
function getAssetFilename(hash, config) {
    return assetHashToFilenameMap.get(config)?.get(hash);
}
exports.getAssetFilename = getAssetFilename;
/**
 * converts the source filepath of the asset to the output filename based on the assetFileNames option. \
 * this function imitates the behavior of rollup.js. \
 * https://rollupjs.org/guide/en/#outputassetfilenames
 *
 * @example
 * ```ts
 * const content = Buffer.from('text');
 * const fileName = assetFileNamesToFileName(
 *   'assets/[name].[hash][extname]',
 *   '/path/to/file.txt',
 *   getAssetHash(content),
 *   content
 * )
 * // fileName: 'assets/file.982d9e3e.txt'
 * ```
 *
 * @param assetFileNames filename pattern. e.g. `'assets/[name].[hash][extname]'`
 * @param file filepath of the asset
 * @param contentHash hash of the asset. used for `'[hash]'` placeholder
 * @param content content of the asset. passed to `assetFileNames` if `assetFileNames` is a function
 * @returns output filename
 */
function assetFileNamesToFileName(assetFileNames, file, contentHash, content) {
    const basename = path_1.default.basename(file);
    // placeholders for `assetFileNames`
    // `hash` is slightly different from the rollup's one
    const extname = path_1.default.extname(basename);
    const ext = extname.substring(1);
    const name = basename.slice(0, -extname.length);
    const hash = contentHash;
    if (typeof assetFileNames === "function") {
        assetFileNames = assetFileNames({
            name: file,
            source: content,
            type: "asset"
        });
        if (typeof assetFileNames !== "string") {
            throw new TypeError("assetFileNames must return a string");
        }
    }
    else if (typeof assetFileNames !== "string") {
        throw new TypeError("assetFileNames must be a string or a function");
    }
    const fileName = assetFileNames.replace(/\[\w+\]/g, (placeholder) => {
        switch (placeholder) {
            case "[ext]":
                return ext;
            case "[extname]":
                return extname;
            case "[hash]":
                return hash;
            case "[name]":
                return name;
        }
        throw new Error(`invalid placeholder ${placeholder} in assetFileNames "${assetFileNames}"`);
    });
    return fileName;
}
exports.assetFileNamesToFileName = assetFileNamesToFileName;
/**
 * Register an asset to be emitted as part of the bundle (if necessary)
 * and returns the resolved public URL
 */
async function fileToBuiltUrl(id, config, pluginContext, skipPublicCheck = false) {
    if (!skipPublicCheck && checkPublicFile(id, config)) {
        return config.base + id.slice(1);
    }
    const cache = assetCache.get(config);
    const cached = cache.get(id);
    if (cached) {
        return cached;
    }
    const file = (0, exports.cleanUrl)(id);
    const content = await fs_1.promises.readFile(file);
    let url;
    if (config.build.lib || (!file.endsWith(".svg") && content.length < Number(config.build.assetsInlineLimit))) {
        // base64 inlined as a string
        url = `data:${mrmime.lookup(file)};base64,${content.toString("base64")}`;
    }
    else {
        // emit as asset
        // rollup supports `import.meta.ROLLUP_FILE_URL_*`, but it generates code
        // that uses runtime url sniffing and it can be verbose when targeting
        // non-module format. It also fails to cascade the asset content change
        // into the chunk's hash, so we have to do our own content hashing here.
        // https://bundlers.tooling.report/hashing/asset-cascade/
        // https://github.com/rollup/rollup/issues/3415
        const map = assetHashToFilenameMap.get(config);
        const contentHash = getAssetHash(content);
        const { search, hash } = (0, url_1.parse)(id);
        const postfix = (search || "") + (hash || "");
        const output = config.build?.rollupOptions?.output;
        const assetFileNames = (output && !Array.isArray(output) ? output.assetFileNames : undefined) ??
            // defaults to '<assetsDir>/[name].[hash][extname]'
            // slightly different from rollup's one ('assets/[name]-[hash][extname]')
            path_1.default.posix.join(config.build.assetsDir, "[name].[hash][extname]");
        const fileName = assetFileNamesToFileName(assetFileNames, file, contentHash, content);
        if (!map.has(contentHash)) {
            map.set(contentHash, fileName);
        }
        const emittedSet = emittedHashMap.get(config);
        if (!emittedSet.has(contentHash)) {
            const name = normalizePath(path_1.default.relative(config.root, file));
            pluginContext.emitFile({
                name,
                fileName,
                type: "asset",
                source: content
            });
            emittedSet.add(contentHash);
        }
        url = `__VITE_ASSET__${contentHash}__${postfix ? `$_${postfix}__` : ``}`;
    }
    cache.set(id, url);
    return url;
}
function getAssetHash(content) {
    return (0, crypto_1.createHash)("sha256").update(content).digest("hex").slice(0, 8);
}
exports.getAssetHash = getAssetHash;
async function urlToBuiltUrl(url, importer, config, pluginContext) {
    if (checkPublicFile(url, config)) {
        return config.base + url.slice(1);
    }
    const file = url.startsWith("/") ? path_1.default.join(config.root, url) : path_1.default.join(path_1.default.dirname(importer), url);
    return fileToBuiltUrl(file, config, pluginContext, 
    // skip public check since we just did it above
    true);
}
exports.urlToBuiltUrl = urlToBuiltUrl;
