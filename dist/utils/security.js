import path from "node:path";
import { Logger } from "./logger.js";
const logger = new Logger();
export function sanitizePath(userPath, basePath) {
    try {
        const decodedPath = decodeURIComponent(userPath);
        const cleanPath = decodedPath
            .replace(/\.\./g, '')
            .replace(/[<>:"|?*]/g, '')
            .replace(/\0/g, '');
        const fullPath = path.resolve(basePath, cleanPath);
        if (!fullPath.startsWith(path.resolve(basePath))) {
            logger.warn('Path traversal attempt detected:', userPath);
            return {
                isValid: false,
                sanitizedPath: '',
                error: 'Invalid path: outside of allowed directory'
            };
        }
        return {
            isValid: true,
            sanitizedPath: fullPath
        };
    }
    catch (error) {
        logger.error('Path sanitization error:', error);
        return {
            isValid: false,
            sanitizedPath: '',
            error: 'Invalid path format'
        };
    }
}
export function isValidMimeType(mimeType) {
    const allowedTypes = [
        'video/', 'audio/', 'image/', 'text/', 'application/pdf',
        'application/json', 'application/xml'
    ];
    return allowedTypes.some(type => mimeType.startsWith(type));
}
export function validateFileName(filename) {
    if (filename.length > 255) {
        return false;
    }
    const dangerousPatterns = [
        /^\.+$/,
        /[<>:"|?*\0]/,
        /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i
    ];
    return !dangerousPatterns.some(pattern => pattern.test(filename));
}
//# sourceMappingURL=security.js.map