# YouTube Audio & Video Extract

Aplicativo cross-platform desenvolvido com Electron para extrair áudio MP3 ou baixar vídeos completos (MP4) do YouTube de forma simples e intuitiva.

## 📥 Download

### Instaladores Disponíveis

Baixe os arquivos disponíveis na [página de Releases](https://github.com/UsielAmaral/youtube-audio-extract/releases/latest):

| Plataforma | Formato |
|------------|---------|
| 🐧 **Linux** | AppImage ou Debian/Ubuntu (.deb) |
| 🪟 **Windows** | Aplicativo portátil (.exe) |
| 🍎 **macOS** | DMG para Intel (x64) ou Apple Silicon (arm64) |

### Instalação Rápida

1. Acesse a [página de Releases](https://github.com/UsielAmaral/youtube-audio-extract/releases/latest).
2. Baixe o arquivo correspondente ao seu sistema e arquitetura.
3. Execute o instalador ou aplicativo portátil.

### Primeira abertura no macOS

O app não possui assinatura Developer ID nem notarização da Apple. Na primeira abertura, será necessário liberá-lo nos ajustes do macOS:

1. Abra o `.dmg` correspondente ao seu Mac e arraste o app para **Aplicativos**.
2. Tente abrir **YouTube Audio Extract** uma vez.
3. Abra **Ajustes do Sistema → Privacidade e Segurança** e clique em **Abrir Mesmo Assim**.
4. Confirme em **Abrir** e autentique-se se solicitado.

Siga esse procedimento para o app obtido na página oficial de Releases. Veja também as [instruções da Apple](https://support.apple.com/pt-br/102445).

O **yt-dlp** já vem incluído e se atualiza automaticamente. No macOS, **ffmpeg** e **ffprobe** são incluídos como binários universais para Intel e Apple Silicon; não é necessário instalar Homebrew.

**Versão do projeto:** v1.3.1

## 🚀 Características

- ✅ Interface gráfica moderna e intuitiva
- ✅ Extração de áudio MP3 de vídeos do YouTube
- ✅ Download de vídeos completos (MP4) do YouTube
- ✅ Seleção entre formato de áudio ou vídeo antes do download
- ✅ Suporte a autenticação via cookies
- ✅ Preview do título do vídeo antes do download
- ✅ Barra de progresso em tempo real
- ✅ Abertura automática do arquivo no player padrão
- ✅ Compatível com Linux, Windows e macOS

## 📋 Requisitos

### Software Necessário

Nenhum além do aplicativo:

- **yt-dlp**: incluído no instalador. Na primeira execução é copiado para a pasta de dados do usuário e se atualiza automaticamente (no máximo 1x por dia). Também é possível forçar a atualização pelo botão **"Atualizar motor"** na tela principal.
- **Runtime JavaScript**: os desafios JS do YouTube são resolvidos com o Node.js embutido no próprio Electron.
- **ffmpeg** (somente Linux): necessário para converter em MP3 — `sudo apt install ffmpeg`. No Windows e macOS já vem incluído.

## 📦 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/Usiel-Amaral/youtube-audio-extract.git
cd youtube-audio-extract
```

2. Instale as dependências:
```bash
npm install
```

3. Execute a aplicação:
```bash
npm start
```

## 🎯 Como Usar

1. **Obter arquivo de cookies**: Exporte os cookies do seu navegador usando uma extensão como "Get cookies.txt LOCALLY" (veja instruções na aplicação)

2. **Selecionar arquivo de cookies**: Clique em "Selecionar" e escolha o arquivo .txt exportado

3. **Inserir URL do vídeo**: Cole a URL completa do vídeo do YouTube

4. **Selecionar diretório de destino**: Escolha onde deseja salvar o arquivo

5. **Selecionar formato**: Escolha se deseja "Somente Áudio (MP3)" ou "Vídeo Completo (MP4)"

6. **Iniciar Processo**: Clique em "Extrair Áudio" ou "Baixar Vídeo" (o botão mudará de acordo com sua escolha) e aguarde a conclusão

7. **Abrir arquivo**: Após a conclusão, clique no link para abrir o arquivo no player padrão

## 📖 Obter Arquivo de Cookies

### Método Recomendado: Extensão "Get cookies.txt LOCALLY"

1. Instale a extensão no seu navegador (Chrome, Firefox, Edge, etc.)
2. Faça login no YouTube
3. Clique no ícone da extensão e exporte os cookies
4. Salve o arquivo .txt em um local de fácil acesso

Outras extensões similares:
- cookies.txt
- EditThisCookie
- Cookie-Editor

## 🛠️ Tecnologias Utilizadas

- **Electron**: Framework para aplicações desktop
- **Node.js**: Runtime JavaScript
- **yt-dlp**: Ferramenta de download de vídeos
- **HTML/CSS/JavaScript**: Interface e lógica da aplicação

## 📝 Estrutura do Projeto

```
youtube-audio-extract/
├── main.js          # Processo principal do Electron
├── renderer.js      # Lógica da interface
├── index.html       # Interface do usuário
├── styles.css       # Estilos da aplicação
├── package.json     # Configurações e dependências
└── README.md        # Este arquivo
```

## 🔧 Desenvolvimento

### Preparar binários

```bash
npm run download-binaries
```

No macOS, o script baixa `ffmpeg` e `ffprobe` estáticos da release `b6.1.1` do `ffmpeg-static` para as duas arquiteturas e os combina com `lipo`. Para compilar, instale as ferramentas de linha de comando do Xcode (`xcode-select --install`), que fornecem o `lipo`.

### Executar em modo de desenvolvimento:
```bash
npm start
```

## 📄 Licença

Este projeto está licenciado sob a **ISC License** - uma licença de código aberto gratuita e permissiva.

Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

### O que a licença ISC permite:

- ✅ **Uso comercial**: Você pode usar este software em projetos comerciais
- ✅ **Modificação**: Você pode modificar o código como desejar
- ✅ **Distribuição**: Você pode distribuir o software livremente
- ✅ **Uso privado**: Você pode usar o software para qualquer propósito
- ✅ **Sem garantias**: O software é fornecido "como está", sem garantias

## 👤 Desenvolvedor

**Usiel Amaral**

- 📧 Email: suporte@usis.com.br
- 🐙 GitHub: [@Usiel-Amaral](https://github.com/Usiel-Amaral)

### Desenvolvido com Assistência de IA

Este projeto foi desenvolvido com a assistência de Inteligência Artificial (IA) para acelerar o processo de desenvolvimento, incluindo:
- Geração e otimização de código
- Resolução de problemas técnicos
- Documentação e estruturação do projeto
- Configuração de ferramentas

A IA foi utilizada como ferramenta de desenvolvimento, mas todas as decisões de design, arquitetura e implementação foram tomadas pelo desenvolvedor.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

- 🐛 Reportar bugs
- 💡 Sugerir novas funcionalidades
- 📝 Melhorar a documentação
- 🔧 Enviar pull requests

Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 🙏 Agradecimentos

- **yt-dlp**: Ferramenta essencial para download de vídeos do YouTube
- **Electron**: Framework que torna possível aplicações desktop cross-platform
- **Comunidade Open Source**: Por todas as ferramentas e bibliotecas utilizadas

---

**Nota**: Este projeto utiliza yt-dlp para realizar os downloads. O aplicativo mantém o yt-dlp atualizado automaticamente.

