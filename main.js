const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Necessário para AppImage no Linux — chrome-sandbox dentro de FUSE mount não tem setuid
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
}

// Suprimir avisos do VAAPI (aceleração de hardware de vídeo)
app.commandLine.appendSwitch('disable-features', 'VaapiVideoDecoder');

let mainWindow;

const isWindows = process.platform === 'win32';
const BINARY_NAME = isWindows ? 'yt-dlp.exe' : 'yt-dlp';
const UPDATE_INTERVAL_MS = 24 * 60 * 60 * 1000;

// Cópia gravável do yt-dlp (o binário embutido no AppImage/instalador é somente leitura e não se atualiza)
const userBinDir = () => path.join(app.getPath('userData'), 'bin');
const userYtDlpPath = () => path.join(userBinDir(), BINARY_NAME);
const lastUpdateFile = () => path.join(userBinDir(), 'last-update');

function getBundledYtDlpPath() {
  const base = app.isPackaged ? process.resourcesPath : __dirname;
  const bundled = path.join(base, BINARY_NAME);
  return fs.existsSync(bundled) ? bundled : null;
}

// Prioridade: cópia atualizável do usuário → binário embutido → PATH do sistema
function getYtDlpCommand() {
  if (fs.existsSync(userYtDlpPath())) return userYtDlpPath();
  return getBundledYtDlpPath() || BINARY_NAME;
}

function runYtDlp(command, args) {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    const proc = spawn(command, args);
    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', (code) => resolve({ code, stdout: stdout.trim(), stderr: stderr.trim() }));
    proc.on('error', (err) => resolve({ code: -1, stdout: '', stderr: err.message }));
  });
}

async function getVersion(command) {
  const { code, stdout } = await runYtDlp(command, ['--version']);
  return code === 0 ? stdout : null;
}

// Versões do yt-dlp são datas (2026.08.19 ou 2026.08.19.1), comparáveis numericamente por partes
function isNewerVersion(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff > 0;
  }
  return false;
}

// Copia o binário embutido para userData quando ainda não existe cópia ou quando o embutido é mais novo
async function ensureUserYtDlp() {
  const bundled = getBundledYtDlpPath();
  if (!bundled) return;

  const target = userYtDlpPath();
  if (fs.existsSync(target)) {
    const [userVersion, bundledVersion] = await Promise.all([getVersion(target), getVersion(bundled)]);
    if (userVersion && bundledVersion && !isNewerVersion(bundledVersion, userVersion)) return;
  }

  fs.mkdirSync(userBinDir(), { recursive: true });
  fs.copyFileSync(bundled, target);
  if (!isWindows) fs.chmodSync(target, 0o755);
}

function shouldAutoUpdate() {
  try {
    const last = Number(fs.readFileSync(lastUpdateFile(), 'utf8'));
    return !last || Date.now() - last > UPDATE_INTERVAL_MS;
  } catch {
    return true;
  }
}

async function updateYtDlp() {
  const target = userYtDlpPath();
  if (!fs.existsSync(target)) {
    throw new Error('Não há cópia atualizável do yt-dlp (usando binário do sistema). Atualize-o manualmente.');
  }
  const { code, stdout, stderr } = await runYtDlp(target, ['-U', '--update-to', 'stable']);
  if (code !== 0) throw new Error(stderr || stdout || `yt-dlp -U retornou código ${code}`);
  fs.writeFileSync(lastUpdateFile(), String(Date.now()));
  return getVersion(target);
}

// Promessa compartilhada: downloads aguardam a preparação/atualização em andamento antes de executar o yt-dlp
let ytDlpReady = Promise.resolve();

function prepareYtDlp({ force = false } = {}) {
  ytDlpReady = ytDlpReady.catch(() => {}).then(async () => {
    try {
      await ensureUserYtDlp();
      if (force || shouldAutoUpdate()) await updateYtDlp();
    } catch (error) {
      console.error('[yt-dlp] Falha ao preparar/atualizar:', error.message);
      if (force) throw error;
    }
  });
  return ytDlpReady;
}

// Usa o Node.js embutido no próprio Electron para o yt-dlp resolver os desafios JS do YouTube (EJS),
// sem depender de Node/Deno instalados no sistema
function getJsRuntimeArgs() {
  return [
    '--no-update',
    '--js-runtimes', `node:${process.execPath}`,
    '--remote-components', 'ejs:github'
  ];
}

function getYtDlpEnv() {
  return { ...process.env, ELECTRON_RUN_AS_NODE: '1' };
}

function ytDlpNotFoundError() {
  const platform = isWindows ? 'Windows' : process.platform === 'darwin' ? 'macOS' : 'Linux';
  let errorMsg = `yt-dlp não encontrado no sistema (${platform}). Por favor, instale o yt-dlp e certifique-se de que está no PATH do sistema.`;
  if (isWindows) errorMsg += `\n\nDownload: https://github.com/yt-dlp/yt-dlp/releases`;
  return new Error(errorMsg);
}

function spawnErrorToError(error) {
  return error.code === 'ENOENT' ? ytDlpNotFoundError() : new Error(`Erro ao executar yt-dlp: ${error.message}`);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    autoHideMenuBar: true, // Oculta a barra de menus
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
}

// Handler para seleção de arquivo de cookies
ipcMain.handle('select-cookies-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Selecione o arquivo de cookies',
    filters: [
      { name: 'Arquivos de Texto', extensions: ['txt'] },
      { name: 'Todos os Arquivos', extensions: ['*'] }
    ],
    properties: ['openFile']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// Handler para seleção de diretório de destino
ipcMain.handle('select-destination', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Selecione o diretório de destino',
    properties: ['openDirectory']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// Handler para obter informações do vídeo (preview)
ipcMain.handle('get-video-info', async (event, videoUrl) => {
  return new Promise(async (resolve, reject) => {
    // Validação básica da URL
    if (!videoUrl || !videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be')) {
      reject(new Error('URL inválida. Por favor, insira uma URL válida do YouTube.'));
      return;
    }

    await ytDlpReady.catch(() => {});

    const ytdlp = spawn(getYtDlpCommand(), [...getJsRuntimeArgs(), '--dump-json', videoUrl], {
      env: getYtDlpEnv()
    });

    let output = '';
    let errorOutput = '';

    ytdlp.stdout.on('data', (data) => {
      output += data.toString();
    });

    ytdlp.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    ytdlp.on('close', (code) => {
      if (code === 0) {
        try {
          const videoInfo = JSON.parse(output);
          resolve({
            title: videoInfo.title || 'Título não disponível',
            duration: videoInfo.duration || 0,
            thumbnail: videoInfo.thumbnail || null
          });
        } catch (error) {
          reject(new Error('Erro ao processar informações do vídeo.'));
        }
      } else {
        reject(new Error(errorOutput || 'Erro ao obter informações do vídeo. Verifique a URL e tente novamente.'));
      }
    });

    ytdlp.on('error', (error) => reject(spawnErrorToError(error)));
  });
});

// Handler para extrair áudio ou baixar vídeo
ipcMain.handle('extract-audio', async (event, { videoUrl, cookiesPath, destPath, format }) => {
  await ytDlpReady.catch(() => {});

  return new Promise((resolve, reject) => {
    // Validações
    if (!videoUrl || !videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be')) {
      reject(new Error('URL inválida.'));
      return;
    }

    if (!cookiesPath || !fs.existsSync(cookiesPath)) {
      reject(new Error('Arquivo de cookies não encontrado.'));
      return;
    }

    if (!destPath || !fs.existsSync(destPath)) {
      reject(new Error('Diretório de destino não encontrado.'));
      return;
    }

    // Sanitização do caminho de destino
    const safeDestPath = path.resolve(destPath);

    const command = getYtDlpCommand();

    // ffmpeg embutido fica ao lado do yt-dlp original (resources em produção, raiz em dev)
    let ffmpegPath = null;
    const ffmpegBase = app.isPackaged ? process.resourcesPath : __dirname;
    if (fs.existsSync(path.join(ffmpegBase, isWindows ? 'ffmpeg.exe' : 'ffmpeg'))) {
      ffmpegPath = ffmpegBase;
    }

    let args = [
      ...getJsRuntimeArgs(),
      '--cookies', cookiesPath,
      '--progress',
      '-o', path.join(safeDestPath, '%(title)s.%(ext)s'),
      videoUrl
    ];

    if (format === 'video') {
      // Importante: não colocar espaços na expressão do formato, senão o yt-dlp interpreta como múltiplos argumentos/URLs
      args = [
        '-f', 'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/bv*+ba/b',
        '--merge-output-format', 'mp4',
        ...args
      ];
    } else {
      args = [
        '-x',
        '--audio-format', 'mp3',
        ...args
      ];
    }

    if (ffmpegPath) {
      args.unshift('--ffmpeg-location', ffmpegPath);
    }

    const ytdlp = spawn(command, args, {
      env: getYtDlpEnv()
    });

    let errorOutput = '';
    let lastProgress = 0;

    // Parse do output para progresso
    ytdlp.stderr.on('data', (data) => {
      const output = data.toString();
      errorOutput += output;

      // Tentar extrair progresso do output do yt-dlp
      // Formato: [download] X.X% of Y at Z speed ETA HH:MM:SS
      const progressMatch = output.match(/\[download\]\s*(\d+(?:\.\d+)?)%/);
      if (progressMatch) {
        const progress = parseFloat(progressMatch[1]);
        if (progress >= lastProgress) {
          lastProgress = progress;
          mainWindow.webContents.send('progress-update', {
            progress: progress,
            message: `Baixando: ${progress.toFixed(1)}%`
          });
        }
      }

      // Enviar mensagens de status gerais
      if (output.includes('[download]') || output.includes('[ExtractAudio]') || output.includes('[Merger]')) {
        const cleanMessage = output.trim().split('\n')[0];
        if (cleanMessage && !cleanMessage.match(/\[download\]\s*\d+%/)) {
          let displayMsg = cleanMessage;
          if (cleanMessage.includes('[Merger]')) displayMsg = 'Mesclando áudio e vídeo...';
          if (cleanMessage.includes('[ExtractAudio]')) displayMsg = 'Extraindo áudio para MP3...';

          mainWindow.webContents.send('progress-update', {
            message: displayMsg
          });
        }
      }
    });

    ytdlp.stdout.on('data', (data) => {
      const output = data.toString();

      // yt-dlp também pode enviar progresso pelo stdout
      const progressMatch = output.match(/(\d+(?:\.\d+)?)%/);
      if (progressMatch) {
        const progress = parseFloat(progressMatch[1]);
        if (progress > lastProgress) {
          lastProgress = progress;
          mainWindow.webContents.send('progress-update', {
            progress: progress,
            message: `Baixando: ${progress.toFixed(1)}%`
          });
        }
      }
    });

    ytdlp.on('close', async (code) => {
      if (code === 0) {
        mainWindow.webContents.send('progress-update', {
          progress: 100,
          message: 'Download concluído!'
        });

        // Encontrar o arquivo gerado mais recente no diretório
        let outputFilePath = null;
        try {
          const extension = format === 'video' ? '.mp4' : '.mp3';
          const files = fs.readdirSync(safeDestPath);
          const matchedFiles = files
            .filter(file => file.endsWith(extension))
            .map(file => ({
              name: file,
              path: path.join(safeDestPath, file),
              time: fs.statSync(path.join(safeDestPath, file)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time);

          if (matchedFiles.length > 0) {
            // Pegar o arquivo mais recente (primeiro da lista ordenada)
            outputFilePath = matchedFiles[0].path;
          }
        } catch (error) {
          console.error('Erro ao buscar arquivo gerado:', error);
        }

        resolve({
          success: true,
          message: format === 'video' ? 'Download concluído com sucesso!' : 'Extração concluída com sucesso!',
          filePath: outputFilePath
        });
      } else {
        reject(new Error(errorOutput || `yt-dlp retornou código de erro: ${code}`));
      }
    });

    ytdlp.on('error', (error) => reject(spawnErrorToError(error)));
  });
});

// Handler para abrir arquivo no player padrão do sistema
ipcMain.handle('open-file', async (event, filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error('Arquivo não encontrado.');
    }
    await shell.openPath(filePath);
    return { success: true };
  } catch (error) {
    throw new Error(`Erro ao abrir arquivo: ${error.message}`);
  }
});

// Versão atual do yt-dlp (exibida na interface)
ipcMain.handle('get-ytdlp-version', async () => {
  await ytDlpReady.catch(() => {});
  return getVersion(getYtDlpCommand());
});

// Atualização manual do yt-dlp (botão "Atualizar motor")
ipcMain.handle('update-ytdlp', async () => {
  await prepareYtDlp({ force: true });
  return getVersion(getYtDlpCommand());
});

app.whenReady().then(() => {
  // Remover completamente o menu da aplicação
  Menu.setApplicationMenu(null);
  createWindow();
  // Prepara a cópia gravável do yt-dlp e atualiza em segundo plano (no máximo 1x por dia)
  prepareYtDlp();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
