import express from "express";
import fs from "node:fs";
import { DEFAULT_CONFIG } from "./constants/index.js";
import { FileService } from "./services/fileService.js";
import { HtmlService } from "./services/htmlService.js";
import { VideoService } from "./services/videoService.js";
import { Logger } from "./utils/logger.js";
import { getLocalIPAddress } from "./utils/network.js";
import { sanitizePath } from "./utils/security.js";
class FileServer {
    localPath = "";
    config = DEFAULT_CONFIG;
    logger = new Logger(this.config.logLevel);
    fileService = new FileService(this.config);
    htmlService = new HtmlService(this.config);
    videoService = new VideoService();
    app = express();
    constructor() {
        this.setupMiddleware();
        this.setupRoutes();
    }
    setupMiddleware() {
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use((req, _res, next) => {
            this.logger.info(`${req.method} ${req.path}`, {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            next();
        });
        this.app.use((err, _req, res, _next) => {
            this.logger.error('Unhandled error:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    setupRoutes() {
        this.app.use('*', async (req, res) => {
            try {
                await this.handleRequest(req, res);
            }
            catch (error) {
                this.logger.error('Request handler error:', error);
                if (!res.headersSent) {
                    res.status(500).json({
                        error: 'Server error',
                        message: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }
        });
    }
    async handleRequest(req, res) {
        const requestPath = req.path || '/';
        const pathSegments = requestPath
            .split("/")
            .filter(segment => segment.length > 0);
        const { isValid, sanitizedPath, error } = sanitizePath(pathSegments.join('/'), this.localPath);
        if (!isValid) {
            this.logger.warn('Invalid path requested:', requestPath, error);
            res.status(400).json({ error: error || 'Invalid path' });
            return;
        }
        if (!fs.existsSync(sanitizedPath)) {
            this.logger.debug('Path not found:', sanitizedPath);
            res.status(404).json({ error: 'Path not found' });
            return;
        }
        const stats = await fs.promises.stat(sanitizedPath);
        if (stats.isFile()) {
            await this.handleFileRequest(req, res, sanitizedPath);
        }
        else if (stats.isDirectory()) {
            await this.handleDirectoryRequest(res, sanitizedPath);
        }
        else {
            res.status(400).json({ error: 'Invalid file type' });
        }
    }
    async handleFileRequest(req, res, filePath) {
        const isPosterRequest = req.query.poster === '1';
        if (isPosterRequest) {
            const isFFmpegAvailable = await this.videoService.isFFmpegAvailable();
            if (!isFFmpegAvailable) {
                this.logger.warn('FFmpeg not available for thumbnail generation');
                res.status(503).json({ error: 'Thumbnail service unavailable' });
                return;
            }
            try {
                await this.videoService.generateThumbnail(filePath, res);
            }
            catch (error) {
                this.logger.error('Thumbnail generation failed:', error);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Thumbnail generation failed' });
                }
            }
        }
        else {
            try {
                res.sendFile(filePath, {
                    dotfiles: 'deny',
                    headers: {
                        'Cache-Control': 'public, max-age=3600'
                    }
                }, (error) => {
                    if (error) {
                        this.logger.error('File serving error:', error);
                        if (!res.headersSent) {
                            res.status(500).json({ error: 'Failed to serve file' });
                        }
                    }
                });
            }
            catch (error) {
                this.logger.error('File access error:', error);
                res.status(500).json({ error: 'File access denied' });
            }
        }
    }
    async handleDirectoryRequest(res, directoryPath) {
        try {
            const files = await this.fileService.readFiles(directoryPath);
            const html = this.htmlService.generateFileListHtml(files);
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache');
            res.send(html);
        }
        catch (error) {
            this.logger.error('Directory listing error:', error);
            res.status(500).json({
                error: 'Failed to read directory',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    validateLocalPath(localPath) {
        if (!localPath) {
            throw new Error('请提供目录路径作为参数');
        }
        if (!fs.existsSync(localPath)) {
            throw new Error(`路径"${localPath}"不存在`);
        }
        const stats = fs.statSync(localPath);
        if (!stats.isDirectory()) {
            throw new Error(`路径"${localPath}"不是目录`);
        }
        this.logger.info('Local path validated:', localPath);
    }
    async start() {
        try {
            this.localPath = process.argv.at(-1);
            this.validateLocalPath(this.localPath);
            const server = this.app.listen(this.config.port, () => {
                const localIP = getLocalIPAddress();
                const url = `http://${localIP}:${this.config.port}`;
                this.logger.info('File server started');
                this.logger.info('Server URL:', url);
                this.logger.info('Serving directory:', this.localPath);
                console.log(`🚀 File Server started at: ${url}`);
            });
            process.on('SIGINT', () => {
                this.logger.info('Shutting down server...');
                server.close(() => {
                    this.logger.info('Server stopped');
                    process.exit(0);
                });
            });
            process.on('SIGTERM', () => {
                this.logger.info('Received SIGTERM, shutting down...');
                server.close(() => {
                    this.logger.info('Server stopped');
                    process.exit(0);
                });
            });
        }
        catch (error) {
            this.logger.error('Failed to start server:', error);
            process.exit(1);
        }
    }
}
const fileServer = new FileServer();
fileServer.start().catch(error => {
    console.error('Fatal error starting server:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map