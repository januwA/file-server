import { FileInfo, Config } from "../types/index.js";
export declare class FileService {
    private config;
    private cache;
    private readonly CACHE_TTL;
    constructor(config: Config);
    readFiles(directoryPath: string): Promise<FileInfo[]>;
    private processConcurrentFiles;
    private processFile;
    private cleanExpiredCache;
    clearCache(): void;
}
//# sourceMappingURL=fileService.d.ts.map