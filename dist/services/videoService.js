import { spawn } from "node:child_process";
import { Logger } from "../utils/logger.js";
const logger = new Logger();
export class VideoService {
    async generateThumbnail(filePath, response) {
        return new Promise((resolve, reject) => {
            let ffmpegProcess = null;
            let hasResponded = false;
            const cleanup = (error) => {
                if (ffmpegProcess && !ffmpegProcess.killed) {
                    ffmpegProcess.kill('SIGTERM');
                }
                if (error && !hasResponded) {
                    hasResponded = true;
                    logger.error('FFmpeg error:', error.message);
                    response.status(500).json({ error: 'Error generating thumbnail' });
                    reject(error);
                }
                else if (!hasResponded) {
                    hasResponded = true;
                    resolve();
                }
            };
            try {
                ffmpegProcess = spawn("ffmpeg", [
                    "-i", filePath,
                    "-vf", "select='between(t\\,1\\,10)'",
                    "-frames:v", "1",
                    "-f", "image2",
                    "-q:v", "2",
                    "-"
                ], {
                    stdio: ['ignore', 'pipe', 'pipe']
                });
                if (!ffmpegProcess.stdout) {
                    throw new Error('Failed to create ffmpeg stdout stream');
                }
                response.setHeader('Content-Type', 'image/jpeg');
                response.setHeader('Cache-Control', 'public, max-age=3600');
                ffmpegProcess.stdout.on('data', (chunk) => {
                    if (!hasResponded) {
                        response.write(chunk);
                    }
                });
                ffmpegProcess.stderr?.on('data', (data) => {
                    logger.debug('FFmpeg stderr:', data.toString());
                });
                ffmpegProcess.on('close', (code) => {
                    if (code === 0) {
                        if (!hasResponded) {
                            response.end();
                            cleanup();
                        }
                    }
                    else {
                        cleanup(new Error(`FFmpeg process exited with code ${code}`));
                    }
                });
                ffmpegProcess.on('error', (error) => {
                    cleanup(new Error(`FFmpeg spawn error: ${error.message}`));
                });
                const timeout = setTimeout(() => {
                    cleanup(new Error('FFmpeg process timeout'));
                }, 30000);
                ffmpegProcess.on('close', () => {
                    clearTimeout(timeout);
                });
                response.on('close', () => {
                    if (ffmpegProcess && !ffmpegProcess.killed) {
                        logger.info('Client disconnected, killing ffmpeg process');
                        cleanup();
                    }
                });
            }
            catch (error) {
                cleanup(error);
            }
        });
    }
    isFFmpegAvailable() {
        return new Promise((resolve) => {
            const ffmpeg = spawn('ffmpeg', ['-version'], { stdio: 'ignore' });
            ffmpeg.on('close', (code) => {
                resolve(code === 0);
            });
            ffmpeg.on('error', () => {
                resolve(false);
            });
        });
    }
}
//# sourceMappingURL=videoService.js.map