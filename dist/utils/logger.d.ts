import { Config } from "../types/index.js";
export declare class Logger {
    private logLevel;
    private levels;
    constructor(logLevel?: Config['logLevel']);
    private shouldLog;
    private formatMessage;
    error(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
}
//# sourceMappingURL=logger.d.ts.map