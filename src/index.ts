import express from "express";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { fileTypeFromStream } from "file-type";
import dayjs from "dayjs";

let local_path = ``;

const app = express();

async function readFiles(p: string) {
  const names = await fs.promises.readdir(p);
  const res: Array<{
    name: string;
    time: string;
    isFile: boolean;
    isDir: boolean;
    fileType: Awaited<ReturnType<typeof fileTypeFromStream>> | null;
  }> = [];
  for (const name of names) {
    let filePath = path.join(p, name);
    let s = await fs.promises.stat(filePath);
    let fileType = null as Awaited<ReturnType<typeof fileTypeFromStream>> | null;
    if (s.isFile()) {
      fileType = await fileTypeFromStream(fs.createReadStream(filePath));
    }

    res.push({
      name,
      time: dayjs(s.atime).format("YYYY-MM-DD HH:ss:mm"),
      isFile: s.isFile(),
      isDir: s.isDirectory(),
      fileType,
    });
  }
  return res;
}

function files2html(files: Awaited<ReturnType<typeof readFiles>>) {
  return files
    .map((f) => {
      let link = f.name;

      if (f.isDir || !f.fileType) {
        return `
      <div>
        <span>${f.isDir ? "🗂️" : "📄"}</span>
        <a href="./${link}/">${f.name}</a>
        <span>${f.time}</span>
      </div>
      `;
      }

      if (f.fileType.mime.includes("video")) {
        return `
      <figure>
        <video src2="./${link}" controls src="./${link}" preload="none" loop></video>
        <figcaption>${f.name}</figcaption>
      </figure>
      `;
      }

      if (f.fileType.mime.includes("audio")) {
        return `
      <figure>
        <audio src2="./${link}" controls preload="none"></audio>
        <figcaption>${f.name}</figcaption>
      </figure>
      `;
      }

      if (f.fileType.mime.includes("image")) {
        return `
      <figure>
        <img src2="./${link}" />
        <figcaption>${f.name}</figcaption>
      </figure>
      `;
      }
      return ``;
    })
    .join("");
}

app.use(async (req, res) => {
  let paths = req.path
    .split("/")
    .filter((e) => !!e)
    .map((e) => decodeURIComponent(e));

  let p = path.join(local_path, ...paths);

  if (!fs.existsSync(p)) {
    res.status(404).end();
    return;
  }

  let s = await fs.promises.stat(p);

  if (s.isFile()) {
    let poster = (req.query as any).poster;
    if (poster) {
      const ffmpeg = spawn("ffmpeg", [
        "-i",
        p,
        "-vf",
        `select='between(t\,1\,10)'`,
        "-frames:v",
        "1",
        "-f",
        "image2",
        "-",
      ]);

      ffmpeg.stdout.on("data", (chunk) => {
        res.write(chunk);
      });

      ffmpeg.stderr.on("data", () => {
        // ignore
      });

      ffmpeg.on("close", (code) => {
        if (code === 0) {
          res.end();
        } else {
          console.error("ffmpeg process exited with code " + code);
          res.status(500).send("Error generating image");
        }
      });
    } else {
      res.sendFile(p);
    }
    return;
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
    body.grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    }
    video {
      width: 100%;
    }
  </style>
</head>
<body class='grid'>
    <a href="../">../</a>
    ${files2html(files)}

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
        if (!entry.target.poster && entry.target.nodeName) {
          entry.target.poster = entry.target.getAttribute('src2') + '?poster=1'
        }
      }, 1000);
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
  `);
});

async function main() {
  local_path = process.argv.at(-1) as string;
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
    const faces = interfaces[dev] ?? [];
    for (let i = 0; i < faces.length; i++) {
      const iface = faces[i]!;
      if (iface.family === "IPv4" && iface.internal === false) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

main();


