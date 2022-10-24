/// <reference types="node" />
import type { ResolvedConfig } from "vite";
import type { OutputOptions, PluginContext } from "rollup";
export declare const FS_PREFIX = "/@fs/";
export declare const queryRE: RegExp;
export declare const hashRE: RegExp;
export declare const cleanUrl: (url: string) => string;
export declare const isWindows: boolean;
export declare function slash(p: string): string;
export declare function normalizePath(id: string): string;
export declare const assetUrlRE: RegExp;
/**
 * Also supports loading plain strings with import text from './foo.txt?raw'
 */
export declare function checkPublicFile(url: string, { publicDir }: ResolvedConfig): string | undefined;
export declare function fileToUrl(id: string, config: ResolvedConfig, ctx: PluginContext): string | Promise<string>;
export declare function getAssetFilename(hash: string, config: ResolvedConfig): string | undefined;
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
export declare function assetFileNamesToFileName(assetFileNames: Exclude<OutputOptions["assetFileNames"], undefined>, file: string, contentHash: string, content: string | Buffer): string;
export declare function getAssetHash(content: Buffer): string;
export declare function urlToBuiltUrl(url: string, importer: string, config: ResolvedConfig, pluginContext: PluginContext): Promise<string>;
