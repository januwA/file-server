import { HTML_TEMPLATE, SUPPORTED_VIDEO_TYPES, SUPPORTED_AUDIO_TYPES, SUPPORTED_IMAGE_TYPES } from "../constants/index.js";
import { isValidMimeType } from "../utils/security.js";
export class HtmlService {
    config;
    constructor(config) {
        this.config = config;
    }
    generateFileListHtml(files) {
        const filesContent = files
            .map(file => this.generateFileHtml(file))
            .join("");
        return HTML_TEMPLATE
            .replace('{{FILES_CONTENT}}', filesContent)
            .replace('{{LAZY_LOAD_DELAY}}', this.config.lazyLoadDelay.toString());
    }
    generateFileHtml(file) {
        const encodedName = encodeURIComponent(file.name);
        if (file.isDir) {
            return this.generateDirectoryHtml(file, encodedName);
        }
        if (!file.fileType || !isValidMimeType(file.fileType.mime)) {
            return this.generateGenericFileHtml(file, encodedName);
        }
        const mimeType = file.fileType.mime;
        if (SUPPORTED_VIDEO_TYPES.some(type => mimeType.includes(type.split('/')[1] ?? ''))) {
            return this.generateVideoHtml(file, encodedName);
        }
        if (SUPPORTED_AUDIO_TYPES.some(type => mimeType.includes(type.split('/')[1] ?? ''))) {
            return this.generateAudioHtml(file, encodedName);
        }
        if (SUPPORTED_IMAGE_TYPES.some(type => mimeType.includes(type.split('/')[1] ?? ''))) {
            return this.generateImageHtml(file, encodedName);
        }
        return this.generateGenericFileHtml(file, encodedName);
    }
    generateDirectoryHtml(file, encodedName) {
        return `
      <div class="file-item">
        <span>🗂️</span>
        <a href="./${encodedName}/">${this.escapeHtml(file.name)}</a>
        <span class="file-time">${file.time}</span>
      </div>
    `;
    }
    generateGenericFileHtml(file, encodedName) {
        return `
      <div class="file-item">
        <span>📄</span>
        <a href="./${encodedName}" target="_blank">${this.escapeHtml(file.name)}</a>
        <span class="file-time">${file.time}</span>
      </div>
    `;
    }
    generateVideoHtml(file, encodedName) {
        return `
      <figure>
        <video 
          src2="./${encodedName}" 
          controls 
          preload="none" 
          loop
          style="max-width: 100%; max-height: 400px;"
        ></video>
        <figcaption>${this.escapeHtml(file.name)} <span class="file-time">${file.time}</span></figcaption>
      </figure>
    `;
    }
    generateAudioHtml(file, encodedName) {
        return `
      <figure>
        <audio 
          src2="./${encodedName}" 
          controls 
          preload="none"
        ></audio>
        <figcaption>${this.escapeHtml(file.name)} <span class="file-time">${file.time}</span></figcaption>
      </figure>
    `;
    }
    generateImageHtml(file, encodedName) {
        return `
      <figure>
        <img 
          src2="./${encodedName}"
          alt="${this.escapeHtml(file.name)}"
          loading="lazy"
        />
        <figcaption>${this.escapeHtml(file.name)} <span class="file-time">${file.time}</span></figcaption>
      </figure>
    `;
    }
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, char => map[char] || char);
    }
}
//# sourceMappingURL=htmlService.js.map