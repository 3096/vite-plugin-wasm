export interface WasmInfo {
    imports: {
        from: string;
        names: string[];
    }[];
    exports: string[];
}
export declare function parseWasm(wasmFilePath: string): Promise<WasmInfo>;
