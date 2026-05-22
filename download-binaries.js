const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const platform = process.platform;

const YTDLP_URLS = {
  linux: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp',
  darwin: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos',
  win32: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
};

const FFMPEG_WIN_URL =
  'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip';

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const request = https.get(url, { headers: { 'User-Agent': 'youtube-audio-extract' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlinkSync(dest);
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        return reject(new Error(`HTTP ${res.statusCode} para ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    });
    request.on('error', (err) => { fs.unlinkSync(dest); reject(err); });
  });
}

async function main() {
  const ytdlpUrl = YTDLP_URLS[platform];
  if (!ytdlpUrl) {
    console.error(`Plataforma não suportada: ${platform}`);
    process.exit(1);
  }

  const ytdlpDest = platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
  console.log(`Baixando yt-dlp para ${platform}...`);
  await download(ytdlpUrl, ytdlpDest);
  if (platform !== 'win32') fs.chmodSync(ytdlpDest, 0o755);
  console.log(`✅ ${ytdlpDest} baixado`);

  if (platform === 'win32') {
    console.log('Baixando ffmpeg para Windows...');
    await download(FFMPEG_WIN_URL, 'ffmpeg.zip');
    execSync(
      'powershell -Command "Expand-Archive -Path ffmpeg.zip -DestinationPath ffmpeg_temp -Force"',
      { stdio: 'inherit' }
    );
    const findExe = (name) => {
      const result = execSync(`powershell -Command "Get-ChildItem -Path ffmpeg_temp -Recurse -Filter ${name} | Select-Object -First 1 -ExpandProperty FullName"`)
        .toString().trim();
      return result;
    };
    fs.copyFileSync(findExe('ffmpeg.exe'), 'ffmpeg.exe');
    fs.copyFileSync(findExe('ffprobe.exe'), 'ffprobe.exe');
    fs.rmSync('ffmpeg_temp', { recursive: true, force: true });
    fs.unlinkSync('ffmpeg.zip');
    console.log('✅ ffmpeg.exe e ffprobe.exe baixados');
  } else if (platform === 'darwin') {
    for (const bin of ['ffmpeg', 'ffprobe']) {
      try {
        const src = execSync(`which ${bin}`).toString().trim();
        fs.copyFileSync(src, bin);
        fs.chmodSync(bin, 0o755);
        console.log(`✅ ${bin} copiado do sistema`);
      } catch {
        console.warn(`⚠️  ${bin} não encontrado no PATH — instale via: brew install ffmpeg`);
      }
    }
  }
}

main().catch((err) => { console.error('Erro:', err.message); process.exit(1); });
