const fs = require('fs');
const path = require('path');

// Injeta --no-sandbox no AppRun do AppImage para funcionar no Linux sem setuid
exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'linux') return;

  const appRunPath = path.join(context.appOutDir, 'AppRun');
  if (!fs.existsSync(appRunPath)) return;

  let content = fs.readFileSync(appRunPath, 'utf8');
  // Adiciona --no-sandbox antes de repassar os args do usuário ($@)
  if (!content.includes('--no-sandbox')) {
    content = content.replace(/"\$@"/, '"--no-sandbox" "$@"');
    fs.writeFileSync(appRunPath, content);
    console.log('afterPack: --no-sandbox injetado no AppRun');
  }
};
