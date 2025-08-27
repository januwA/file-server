export const DEFAULT_CONFIG = {
    port: 19992,
    lazyLoadDelay: 1000,
    maxConcurrentFileReads: 10,
    enableCache: true,
    logLevel: 'info'
};
export const HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <title>/</title>
  <style>
    body {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    body.grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    }
    video {
      width: 100%;
      max-height: 300px;
    }
    img {
      max-width: 100%;
      max-height: 300px;
      object-fit: contain;
    }
    .file-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px;
    }
    .file-time {
      color: #666;
      font-size: 0.9em;
    }
  </style>
</head>
<body class='grid'>
    <a href="../">../</a>
    {{FILES_CONTENT}}

  <script>
  let observerCallback = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.setAttribute('show', '1');
        setTimeout(() => {
          if(!entry.target.getAttribute('show')) return;
          if (!entry.target.src) {
            entry.target.src = entry.target.getAttribute('src2');
          }
          if (!entry.target.poster && entry.target.nodeName === 'VIDEO') {
            entry.target.poster = entry.target.getAttribute('src2') + '?poster=1'
          }
        }, {{LAZY_LOAD_DELAY}});
      } else {
        entry.target.removeAttribute('show');
      }
    });
  }

  const els = document.querySelectorAll('video, audio, img');
  const observer = new IntersectionObserver(observerCallback);
  els.forEach(v => { observer.observe(v); });
  </script>
</body>
</html>
`;
export const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
export const SUPPORTED_AUDIO_TYPES = ['audio/mp3', 'audio/wav', 'audio/ogg'];
export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
//# sourceMappingURL=index.js.map