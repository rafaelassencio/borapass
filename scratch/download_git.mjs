import fs from "fs";
import https from "https";
import { execSync } from "child_process";
import path from "path";

const targetDir = "C:\\Users\\rafae\\.gemini\\git";
const zipPath = path.join(targetDir, "mingit.zip");

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

function download(url) {
  console.log("Downloading from:", url);
  https.get(url, (res) => {
    if (res.statusCode === 301 || res.statusCode === 302) {
      download(res.headers.location);
      return;
    }
    const file = fs.createWriteStream(zipPath);
    res.pipe(file);
    file.on("finish", () => {
      file.close(() => {
        console.log("Extracting MinGit to:", targetDir);
        execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${targetDir}' -Force"`);
        fs.unlinkSync(zipPath);
        console.log("MinGit installed successfully!");
      });
    });
  }).on("error", (err) => {
    console.error("Download error:", err);
  });
}

download("https://github.com/git-for-windows/git/releases/download/v2.48.1.windows.1/MinGit-2.48.1-64-bit.zip");
