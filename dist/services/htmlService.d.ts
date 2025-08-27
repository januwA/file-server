import { FileInfo, Config } from "../types/index.js";
export declare class HtmlService {
    private config;
    constructor(config: Config);
    generateFileListHtml(files: FileInfo[]): string;
    private generateFileHtml;
    private generateDirectoryHtml;
    private generateGenericFileHtml;
    private generateVideoHtml;
    private generateAudioHtml;
    private generateImageHtml;
    private escapeHtml;
}
//# sourceMappingURL=htmlService.d.ts.map