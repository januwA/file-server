import fs from "node:fs";
import path from "node:path";
import { fileTypeFromStream } from "file-type";
import dayjs from "dayjs";
import { Logger } from "../utils/logger.js";
import { validateFileName } from "../utils/security.js";
const logger = new Logger();
export class FileService {
    config;
    cache = new Map();
    CACHE_TTL = 60000;
    constructor(config) {
        this.config = config;
    }
    async readFiles(directoryPath) {
        const cacheKey = directoryPath;
        if (this.config.enableCache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.CACHE_TTL) {
                logger.debug('Using cached data for:', directoryPath);
                return cached.data;
            }
        }
        try {
            const fileNames = await fs.promises.readdir(directoryPath);
            const validFiles = fileNames.filter(validateFileName);
            if (validFiles.length !== fileNames.length) {
                logger.warn(`Filtered ${fileNames.length - validFiles.length} invalid filenames`);
            }
            const results = await this.processConcurrentFiles(validFiles, directoryPath);
            if (this.config.enableCache) {
                this.cache.set(cacheKey, { data: results, timestamp: Date.now() });
                this.cleanExpiredCache();
            }
            return results;
        }
        catch (error) {
            logger.error('Error reading directory:', directoryPath, error);
            throw new Error(`Cannot read directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async processConcurrentFiles(fileNames, directoryPath) {
        const results = [];
        const concurrency = this.config.maxConcurrentFileReads;
        for (let i = 0; i < fileNames.length; i += concurrency) {
            const batch = fileNames.slice(i, i + concurrency);
            const batchPromises = batch.map(fileName => this.processFile(fileName, directoryPath));
            try {
                const batchResults = await Promise.allSettled(batchPromises);
                batchResults.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        results.push(result.value);
                    }
                    else {
                        logger.error(`Failed to process file ${batch[index]}:`, result.reason);
                    }
                });
            }
            catch (error) {
                logger.error('Error processing file batch:', error);
            }
        }
        return results.sort((a, b) => {
            if (a.isDir !== b.isDir) {
                return a.isDir ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });
    }
    async processFile(fileName, directoryPath) {
        const filePath = path.join(directoryPath, fileName);
        try {
            const stats = await fs.promises.stat(filePath);
            let fileType = null;
            if (stats.isFile()) {
                try {
                    const stream = fs.createReadStream(filePath);
                    fileType = await fileTypeFromStream(stream);
                    stream.destroy();
                }
                catch (error) {
                    logger.debug(`Could not determine file type for ${fileName}:`, error);
                }
            }
            return {
                name: fileName,
                time: dayjs(stats.mtime).format("YYYY-MM-DD HH:mm:ss"),
                isFile: stats.isFile(),
                isDir: stats.isDirectory(),
                fileType
            };
        }
        catch (error) {
            logger.error(`Error processing file ${fileName}:`, error);
            throw error;
        }
    }
    cleanExpiredCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.CACHE_TTL) {
                this.cache.delete(key);
            }
        }
    }
    clearCache() {
        this.cache.clear();
        logger.info('File cache cleared');
    }
}
//# sourceMappingURL=fileService.js.map