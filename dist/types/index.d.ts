import { fileTypeFromStream } from "file-type";
export interface FileInfo {
    name: string;
    time: string;
    isFile: boolean;
    isDir: boolean;
    fileType: Awaited<ReturnType<typeof fileTypeFromStream>> | null;
}
export interface Config {
    port: number;
    lazyLoadDelay: number;
    maxConcurrentFileReads: number;
    enableCache: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
}
export interface NetworkInterface {
    address: string;
    family: string;
    internal: boolean;
}
//# sourceMappingURL=index.d.ts.map