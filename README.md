# Meu Editor Web Portable

Editor de texto e código que roda direto no navegador, sem instalação e sem build. Ele usa o [Monaco Editor](https://microsoft.github.io/monaco-editor/), o mesmo do VS Code, e o projeto inteiro são três arquivos: `index.html`, `editor.css` e `editor.js`.

## Funcionalidades

- **Editor Monaco** com tema escuro, quebra de linha automática e realce de sintaxe para JavaScript, TypeScript, HTML, CSS, JSON, Markdown e texto puro.
- **Várias abas**: abra e edite vários arquivos ao mesmo tempo. Abas com alterações não salvas ficam marcadas.
- **Abrir e salvar arquivos locais**: com a [File System Access API](https://developer.mozilla.org/docs/Web/API/File_System_API) (Chrome, Edge), o editor grava direto no arquivo original. Em outros navegadores, o salvamento é feito por download.
- **Detecção de linguagem** pela extensão do arquivo (`.js`, `.mjs`, `.cjs`, `.ts`, `.html`, `.htm`, `.css`, `.json`, `.md`, `.markdown`, `.txt`).
- **Preview de Markdown ao vivo**, lado a lado com o editor. O HTML gerado é sanitizado com DOMPurify.
- **Atalhos de Markdown** para negrito, itálico, tachado, código, links, títulos, listas e citações. Funcionam com múltiplas seleções.
- **Formatador JSON**: formata (com 2 espaços, 4 espaços ou tabulação), compacta, valida e copia o resultado.
- **Sessão persistente**: abas, conteúdo e estado da interface são salvos automaticamente no navegador (localStorage + IndexedDB) e restaurados ao reabrir a página.
- **Backup automático em arquivo**: opcionalmente, a sessão é gravada a cada 30 segundos em um arquivo `.json` escolhido por você.
- **Exportar e importar sessão** em JSON, para levar seu trabalho para outro navegador ou computador.

## Como usar

1. Baixe ou clone o repositório:
   ```bash
   git clone https://github.com/felipefm/EditorWebPortable.git
   ```
2. Abra o `public/index.html` no navegador.

### Publicar no Cloudflare

O projeto já vem configurado para o **Cloudflare Workers** (arquivos estáticos, sem build), pelo `wrangler.jsonc`. Só a pasta `public/` vai para o ar.

- **Pelo painel (deploy automático a cada push):** em *Workers & Pages → Create → Import a repository*, escolha este repositório e mantenha o comando de deploy `npx wrangler deploy`.
- **Pelo terminal:** `npx wrangler login` e depois `npx wrangler deploy`.

> **Requer internet.** O Monaco Editor, o `marked` e o `DOMPurify` são carregados do CDN jsDelivr. Sem conexão, o editor mostra uma mensagem de erro.

## Atalhos de teclado

Use `Ctrl` no Windows/Linux e `Cmd` no macOS.

### Editor e arquivos

| Atalho | Ação |
| --- | --- |
| `Ctrl` + `S` | Salvar a aba atual |
| `Ctrl` + `Shift` + `S` | Salvar como |
| `Ctrl` + `O` | Abrir arquivo |
| `Ctrl` + `N` | Nova aba |
| `Ctrl` + `Alt` + `J` | Abrir o formatador JSON |

### Markdown (quando a aba atual é Markdown)

| Atalho | Ação |
| --- | --- |
| `Ctrl` + `B` | Negrito (`**texto**`) |
| `Ctrl` + `I` | Itálico (`*texto*`) |
| `Ctrl` + `Shift` + `X` ou `Alt` + `Shift` + `5` | Tachado (`~~texto~~`) |
| `Ctrl` + `` ` `` | Código inline |
| `Ctrl` + `K` | Transformar a seleção em link |
| `Ctrl` + `1` a `6` | Títulos de nível 1 a 6 |
| `Ctrl` + `Shift` + `7` | Lista numerada |
| `Ctrl` + `Shift` + `8` | Lista com marcadores |
| `Ctrl` + `Shift` + `9` | Lista de tarefas (`- [ ]`) |
| `Ctrl` + `Shift` + `Q` | Citação (`> `) |

A lista completa também está no editor, em **Opções → Atalhos de Markdown**.

## Onde ficam os dados

- **No navegador**: a sessão é salva no `localStorage` e no IndexedDB deste navegador. Limpar os dados do site apaga a sessão.
- **Em arquivo** (opcional): em **Opções → Configurar backup automático**, escolha um arquivo `.json` e a sessão passa a ser gravada nele a cada 30 segundos. Disponível apenas em navegadores com File System Access API.
- **Exportação manual**: **Opções → Exportar sessão agora** e **Importar sessão**.

Nenhum conteúdo é enviado para servidores. Tudo fica no seu navegador ou nos arquivos que você escolher.

## Compatibilidade

| Recurso | Chrome / Edge | Firefox / Safari |
| --- | --- | --- |
| Edição, abas, preview, formatador JSON | ✅ | ✅ |
| Sessão salva no navegador | ✅ | ✅ |
| Salvar direto no arquivo original | ✅ | ⬇️ por download |
| Backup automático em arquivo | ✅ | ❌ |

## Estrutura

```
public/
  index.html   Estrutura da página: barra de ações, abas, editor, preview, formatador JSON e atalhos
  editor.css   Estilos (tema escuro inspirado no VS Code)
  editor.js    Toda a lógica: Monaco, abas, arquivos, sessão, backup, Markdown e JSON
wrangler.jsonc Configuração de deploy no Cloudflare
```

## Dependências (via CDN)

- [Monaco Editor](https://github.com/microsoft/monaco-editor) 0.52.2
- [marked](https://github.com/markedjs/marked) 15.0.7
- [DOMPurify](https://github.com/cure53/DOMPurify) 3.2.6

## Licença

Este projeto é distribuído sob a licença [Creative Commons Atribuição-NãoComercial 4.0 Internacional (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/deed.pt-br).

- ✅ Você pode usar, copiar, modificar e redistribuir.
- ❌ Não é permitido uso comercial.
- 📌 Ao divulgar ou redistribuir, inclusive versões modificadas, dê crédito ao autor (**Felipe FM**), informe a fonte (<https://github.com/felipefm/EditorWebPortable>), indique a licença e diga se houve alterações.

Veja o arquivo [LICENSE](LICENSE) para o texto completo.
