import express from "express";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { promisify } from 'node:util';
import { fileTypeFromStream } from 'file-type';
import dayjs from "dayjs";

let local_path = ``;

const app = express();

async function readFiles(p) {
  const names = await promisify(fs.readdir)(p);
  const res = [];
  for (const name of names) {
    let filePath = path.join(p, name)
    let s = await promisify(fs.stat)(filePath);
    let fileType = null;
    if (s.isFile()) {
      fileType = await fileTypeFromStream(fs.createReadStream(filePath));
    }

    res.push({
      name,
      size: s.size,
      time: dayjs(s.atime).format('YYYY-MM-DD HH:ss:mm'), // 访问时间戳（atime），修改时间戳（mtime）和更改时间戳（ctime）
      isFile: s.isFile(),
      isDir: s.isDirectory(),
      fileType,
    });
  }
  return res;
}

function files2html(files) {
  //! 使用相对路劲url末尾需要反斜杠
  return files.map(f => {
    let link = f.name;

    if (f.isDir || !f.fileType) {
      return `
      <div>
        <a href="./${link}/">${f.name}</a>
        <span>${f.time}</span>
        <span>${f.size}</span>
      </div>
      `
    }

    // preload 
    // none: 表示不应该预加载视频
    // metadata: 表示仅预先获取视频的元数据（例如长度）
    // auto: 表示可以下载整个视频文件，即使用户不希望使用它
    // 空字符串: 与 auto 值一致。
    if (f.fileType.mime.includes('video')) {
      return `
      <figure>
        <video src2="./${link}" controls preload="auto"></video>
        <figcaption>${f.name}</figcaption>
      </figure>
      `
    }

    if (f.fileType.mime.includes('audio')) {
      return `
      <figure>
        <audio src2="./${link}" controls preload="auto"></audio>
        <figcaption>${f.name}</figcaption>
      </figure>
      `
    }

    if (f.fileType.mime.includes('image')) {
      return `
      <figure>
        <img src2="./${link}" />
        <figcaption>${f.name}</figcaption>
      </figure>
      `
    }
  }).join('')
}

app.use(async (req, res) => {
  let paths = req.path.split('/').filter(e => !!e).map(e => decodeURIComponent(e));

  let p = path.join(local_path, ...paths);

  // console.log(paths, p, req.path);

  if (!fs.existsSync(p)) {
    res.status(404).end();
    return;
  }


  let s = await promisify(fs.stat)(p);

  if (s.isFile()) {
    fs.createReadStream(p).pipe(res);
    return
  }

  let files = await readFiles(p);

  res.send(`
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
    }
    video {
      width: 100%;
    }
  </style>
</head>
<body>
    <a href="../">../</a>
    ${files2html(files)}

  <script>
    const els = document.querySelectorAll('video, audio, img');
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // 处理进入视口的视频
          if (!entry.target.src) {
            entry.target.src = entry.target.getAttribute('src2');
          }
        } else {
          // 处理离开视口的视频
        }
      });
    });
    els.forEach(v => {
      observer.observe(v);
    });
  </script>
</body>
</html>
  `)
});

async function main() {
  local_path = process.argv.at(-1);
  if (!fs.existsSync(local_path)) {
    console.error(`路径"${local_path}"不存在`);
    process.exit(0);
  }
  if (!fs.statSync(local_path).isDirectory()) {
    console.error(`路径"${local_path}"不是目录`);
    process.exit(0);
  }
  let port = 19992;
  app.listen(port, () => {
    const localIP = getLocalIPAddress();
    console.log(`http://${localIP}:${port}`);
  });
}

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const dev in interfaces) {
    const faces = interfaces[dev];
    for (let i = 0; i < faces.length; i++) {
      const iface = faces[i];
      if (iface.family === 'IPv4' && iface.internal === false) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

main();

