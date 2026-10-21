# Guia para Gerar Instaladores

Este guia explica como gerar instaladores para Linux, Windows e macOS usando `electron-builder`.

## 📦 Pré-requisitos

### Para Linux (já está no Ubuntu):
- Já está configurado! O electron-builder funciona nativamente no Linux.

### Para Windows:
- Você precisa estar em um sistema Windows ou usar uma máquina virtual/CI
- Ou usar GitHub Actions para build automático

### Para macOS:
- Você precisa estar em um Mac ou usar GitHub Actions
- Requer certificado de desenvolvedor Apple (opcional, mas recomendado)

## 🚀 Gerar Instaladores

### Gerar para Linux (AppImage e .deb):
```bash
npm run build:linux
```

Isso gerará:
- `dist/YouTube Audio Extract-1.0.0.AppImage` - Executável portátil
- `dist/YouTube Audio Extract_1.0.0_amd64.deb` - Pacote Debian

### Gerar para Windows (.exe):
```bash
npm run build:win
```

Isso gerará:
- `dist/YouTube Audio Extract Setup 1.0.0.exe` - Instalador Windows

### Gerar para macOS (.dmg):
```bash
npm run build:mac
```

Isso gerará:
- `dist/YouTube Audio Extract-1.0.0.dmg` - Instalador macOS

### Gerar para todas as plataformas:
```bash
npm run build:all
```

**Nota**: Isso só funciona se você estiver em cada plataforma respectiva, ou usando CI/CD.

## 📁 Onde encontrar os instaladores

Todos os instaladores serão gerados na pasta `dist/` após o build.

## 🎨 Ícones (Opcional)

Para adicionar ícones personalizados, coloque os arquivos em `build/`:
- `build/icon.png` - Ícone para Linux (512x512)
- `build/icon.ico` - Ícone para Windows (256x256)
- `build/icon.icns` - Ícone para macOS (512x512)

Se os ícones não existirem, o electron-builder usará um ícone padrão.

## 📦 Instaladores Disponíveis

Os instaladores da versão **v1.0.0** estão disponíveis na [página de Releases](https://github.com/Usiel-Amaral/youtube-audio-extract/releases/tag/v1.0.0) do GitHub.

Para gerar novos instaladores localmente, use os comandos acima (`npm run build:linux`, `npm run build:win`, `npm run build:mac`).

## 📝 Notas Importantes

1. **Primeira vez**: O electron-builder baixará os binários do Electron na primeira execução (pode demorar).

2. **Tamanho**: Os instaladores serão grandes (100-200MB) pois incluem o Electron completo.

3. **yt-dlp**: Os instaladores incluem o yt-dlp standalone (`yt-dlp_linux`, `yt-dlp.exe`, `yt-dlp_macos`, baixados por `npm run download-binaries` ou pelo CI). Em execução, o app copia o binário para a pasta de dados do usuário e o atualiza sozinho, então builds antigos continuam funcionando.

4. **Assinatura**: Para distribuir no macOS e Windows, você pode querer assinar os aplicativos (requer certificados pagos).

5. **Teste**: Sempre teste os instaladores antes de publicar!

## 🚀 Publicar no GitHub Releases

Após gerar os instaladores, você pode:

1. Criar uma release no GitHub
2. Fazer upload dos arquivos da pasta `dist/`
3. Os usuários poderão baixar diretamente

Ou use `electron-builder` com GitHub Releases automático (requer token):

```json
"build": {
  "publish": {
    "provider": "github",
    "owner": "Usiel-Amaral",
    "repo": "youtube-audio-extract"
  }
}
```

E execute:
```bash
npm run build -- --publish always
```

