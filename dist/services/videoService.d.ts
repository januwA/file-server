import { Response } from "express";
export declare class VideoService {
    generateThumbnail(filePath: string, response: Response): Promise<void>;
    isFFmpegAvailable(): Promise<boolean>;
}
//# sourceMappingURL=videoService.d.ts.map