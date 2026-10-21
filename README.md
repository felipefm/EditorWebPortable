# Meu Editor Web Portable

Editor de texto e código que roda direto no navegador, sem instalação e sem build. Ele usa o [Monaco Editor](https://microsoft.github.io/monaco-editor/), o mesmo do VS Code, e o projeto inteiro são três arquivos: `index.html`, `editor.css` e `editor.js`.

**🌐 Acesse online:** <https://editorportable.felipefm-suporte.workers.dev>

## Funcionalidades

- **Editor Monaco** com tema escuro, quebra de linha automática e realce de sintaxe para JavaScript, TypeScript, HTML, CSS, JSON, Markdown e texto puro.
- **Várias abas**: abra e edite vários arquivos ao mesmo tempo. Cada aba mostra a linguagem, e as que têm alterações não salvas ganham um ponto amarelo.
- **Minimapa** ao lado da barra de rolagem, como no Sublime Text e no VS Code: uma miniatura do documento onde clicar ou arrastar rola o texto. Funciona nos modos Editor, Dividido e Visual, e o botão **Mapa** no rodapé liga e desliga. Veja [Minimapa](#minimapa).
- **Paleta de comandos** (`F1`): busque e execute qualquer ação do editor pelo teclado.
- **Abrir e salvar arquivos locais**: com a [File System Access API](https://developer.mozilla.org/docs/Web/API/File_System_API) (Chrome, Edge), o editor grava direto no arquivo original. Nos navegadores que não têm essa API (Firefox e derivados, como Zen e LibreWolf, Safari e navegadores de celular), o botão vira **Baixar** e um aviso explica o motivo. Veja [Compatibilidade](#compatibilidade).
- **Detecção de linguagem** pela extensão do arquivo (`.js`, `.mjs`, `.cjs`, `.ts`, `.html`, `.htm`, `.css`, `.json`, `.md`, `.markdown`, `.txt`).
- **Preview de Markdown ao vivo**, com três modos: só editor, dividido ou só preview. O HTML gerado é sanitizado com DOMPurify.
- **Modo Visual de Markdown**: edite vendo o texto já formatado, como no Typora ou no Notion (usa o [Milkdown](https://milkdown.dev)). Digite `/` para inserir títulos, listas, tabelas, citações e blocos de código. Veja [Modo Visual](#modo-visual).
- **Barra e atalhos de Markdown** para negrito, itálico, tachado, código, links, títulos, listas, citações e linha horizontal. Funcionam com múltiplas seleções.
- **Formatador JSON**: formata automaticamente enquanto você digita (2 espaços, 4 espaços ou tabulação), compacta, aponta a linha e a coluna do erro, copia o resultado ou abre em uma nova aba.
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

> **Requer internet.** O Monaco Editor, o `marked` e o `DOMPurify` são carregados do CDN jsDelivr, e o Milkdown (modo Visual) do esm.sh. Sem conexão, o editor mostra uma mensagem de erro.

### Modo Visual

Nos documentos Markdown, o seletor de visualização tem quatro opções: **Editor**, **Dividido**, **Preview** e **Visual**. No modo Visual, você edita o texto já formatado: negrito aparece em negrito, listas como listas, tabelas como tabelas.

- **Atalhos:** todos os [atalhos de teclado](#atalhos-de-teclado) funcionam também no modo Visual. Além disso, digite `/` numa linha vazia para inserir blocos, ou selecione um trecho para ver uma barra de formatação.
- **O texto Markdown continua sendo o arquivo.** Cada edição no modo Visual atualiza o Markdown, e dá para trocar de modo a qualquer momento.
- **Entrar e sair sem editar não muda nada.** Ao editar, o Markdown é reescrito no formato padrão, preservando o estilo que o documento já usa (`-` ou `*` nas listas, `_` ou `*` no itálico, `---` ou `***` nas linhas). Algumas coisas podem mudar mesmo assim: linhas em branco extras somem, e HTML escrito dentro do Markdown pode se perder.
- O Milkdown é carregado só na primeira vez que você usa o modo Visual. Sem internet, o editor avisa e volta para o modo Dividido.

### Minimapa

O minimapa é a miniatura do documento ao lado da barra de rolagem. A faixa destacada mostra o trecho que está na tela. Clique num ponto do mapa para ir até ele, ou arraste a faixa para rolar.

- **Editor e Dividido:** é o minimapa do próprio Monaco, o mesmo do VS Code, com as letras em miniatura.
- **Visual:** o Milkdown não tem minimapa, então o editor desenha um. Cada linha de texto vira um traço com o tamanho e a cor dela; blocos de código, tabelas, citações e imagens também aparecem.
- O botão **Mapa**, no rodapé, liga e desliga o minimapa em todos os modos. A escolha fica guardada no navegador.
- No celular, o minimapa fica sempre desligado, porque ocuparia espaço demais.

### Imagens

Nos documentos Markdown, o botão **Imagem** da barra (nos modos Editor e Visual) ou o item **Imagem** do menu `/` (no modo Visual) insere uma imagem de duas formas:

- **Por link:** cole o endereço de uma imagem da internet. O documento guarda só o link.
- **Por arquivo:** escolha uma imagem do computador. Como o editor não tem servidor, a imagem é guardada **dentro do próprio arquivo `.md`**, codificada como texto (data URI). Antes disso, ela é reduzida para no máximo 1600 px e comprimida (WebP), para o arquivo não crescer demais. O editor avisa quando a imagem passa de 700 KB.

O campo **Descrição** vira o texto alternativo (`![descrição](imagem)`), usado por leitores de tela e mostrado quando a imagem não carrega.

Imagens embutidas aparecem no preview e no modo Visual do editor, mas **o GitHub não mostra imagens embutidas** em arquivos `.md`. Para documentos que vão para o GitHub, prefira imagens por link.

## Atalhos de teclado

Use `Ctrl` no Windows/Linux e `Cmd` no macOS.

### Editor e arquivos

| Atalho | Ação |
| --- | --- |
| `Ctrl` + `S` | Salvar a aba atual |
| `Ctrl` + `Shift` + `S` | Salvar como |
| `Ctrl` + `O` | Abrir arquivo |
| `Ctrl` + `Alt` + `N` | Nova aba |
| `F1` | Paleta de comandos |
| `Ctrl` + `Alt` + `J` | Abrir o formatador JSON |

### Markdown (quando a aba atual é Markdown)

| Atalho | Ação |
| --- | --- |
| `Ctrl` + `B` | Negrito (`**texto**`) |
| `Ctrl` + `I` | Itálico (`*texto*`) |
| `Ctrl` + `Shift` + `X` ou `Alt` + `Shift` + `5` | Tachado (`~~texto~~`) |
| `Ctrl` + `` ` `` | Código inline |
| `Ctrl` + `K` | Transformar a seleção em link |
| `Ctrl` + `1` a `6` ou `Ctrl` + `Shift` + `1` a `6` | Títulos de nível 1 a 6 (no Firefox e no Zen, `Ctrl` + número troca de aba; use a versão com `Shift`) |
| `Ctrl` + `Shift` + `7` | Lista numerada |
| `Ctrl` + `Shift` + `8` | Lista com marcadores |
| `Ctrl` + `Shift` + `9` | Lista de tarefas (`- [ ]`) |
| `Ctrl` + `Shift` + `Q` | Citação (`> `) |

Os atalhos gerais (salvar, abrir, nova aba, formatador JSON) funcionam em qualquer modo, mesmo com o foco fora do texto. Os atalhos de Markdown funcionam nos modos Editor, Dividido e Visual.

**Envolver a seleção:** como no VS Code, com um trecho selecionado, digitar `"` `'` `(` `[` `{` ou `` ` `` envolve o trecho em vez de apagá-lo. Em Markdown, também `*` `_` `~` e `<`; digitar `*` duas vezes dá `**negrito**`. No modo Visual, funciona com aspas, parênteses, colchetes e chaves.

A lista completa também está no editor, no ícone de teclado da barra lateral.

## Onde ficam os dados

- **No navegador**: a sessão é salva no `localStorage` e no IndexedDB deste navegador. Limpar os dados do site apaga a sessão.
- **Em arquivo** (opcional): no botão de backup do topo, em **Arquivo de backup → Configurar**, escolha um arquivo `.json` e a sessão passa a ser gravada nele a cada 30 segundos. Disponível apenas em navegadores com File System Access API.
- **Exportação manual**: no mesmo painel, **Exportar cópia** e **Importar sessão**.

O botão do topo mostra o estado do backup: **Backup ativo** (verde), **Backup pendente** (amarelo, quando o navegador pede nova autorização) ou **Salvo no navegador**.

Nenhum conteúdo é enviado para servidores. Tudo fica no seu navegador ou nos arquivos que você escolher.

## Compatibilidade

| Recurso | Chrome / Edge / Opera (computador) | Firefox, Zen, LibreWolf, Safari, celular |
| --- | --- | --- |
| Edição, abas, preview, formatador JSON | ✅ | ✅ |
| Sessão salva no navegador | ✅ | ✅ |
| Salvar direto no arquivo original | ✅ | ⬇️ botão **Baixar** |
| Backup automático em arquivo | ✅ | ❌ |

**Por que alguns navegadores só baixam?** Gravar num arquivo do computador exige a [File System Access API](https://developer.mozilla.org/docs/Web/API/Window/showSaveFilePicker), que só os navegadores baseados no Chromium oferecem. A Mozilla decidiu não implementá-la, por segurança, e não existe opção para ativá-la no Firefox nem nos navegadores derivados dele. No Brave, ela vem desligada e pode ser ativada em `brave://flags/#file-system-access-api`.

Nesses navegadores, o editor:

- mostra o botão **Baixar** no lugar de **Salvar**, e um aviso na primeira visita (some ao clicar em **Entendi**);
- pergunta o nome só no primeiro download de um documento novo e depois reaproveita o nome. Arquivos abertos são baixados com o próprio nome;
- marca o documento como salvo depois de baixar;
- no `Ctrl+S`, só confirma que o texto está salvo no navegador, sem baixar nada.

O navegador pode acrescentar um número ao nome (`notas (1).md`) quando o arquivo já existe na pasta de downloads. Isso é controlado pelo navegador, não pelo editor.

## Testes automatizados

O projeto tem **218 testes automatizados**, divididos em 11 áreas: geral, atalhos, abas, arquivos, Markdown, modo Visual, imagens, minimapa, JSON, sessão e celular. Eles usam o [Playwright](https://playwright.dev) e abrem o editor num navegador de verdade, clicando, digitando e conferindo o resultado. Rodam no **Microsoft Edge** e no **Firefox** (o motor do Zen Browser): ao todo, cerca de 430 execuções.

📖 **Documentação completa: [docs/TESTES.md](docs/TESTES.md).** Explica como funcionam, a lista de todos os testes, como o projeto escolhe o que testar, como escrever testes novos e o que fazer quando algo falha.

### Começando

```bash
cd tests
npm install              # primeira vez: instala o Playwright e o Firefox de testes, e ativa a verificação antes do push
npm run test:alterado    # roda só os testes das áreas que você alterou
npm test                 # roda todos, no Edge e no Firefox (cerca de 4 minutos)
```

Também dá para rodar uma área específica: `npm run test:geral`, `test:atalhos`, `test:abas`, `test:arquivos`, `test:markdown`, `test:visual`, `test:imagens`, `test:mapa`, `test:json`, `test:sessao` ou `test:celular`, ou só o Firefox: `npm run test:firefox`.

### Testa só o que mudou

O `npm run test:alterado` lê o `git diff`, descobre em qual função do `editor.js` (ou em qual id/classe do HTML e do CSS) cada linha mudou e roda só os testes daquela área. Por exemplo, mudar `formatarJson` roda os testes de JSON. Em caso de dúvida, roda tudo.

### Verificação automática antes do push

Todo `git push` roda antes os testes das áreas alteradas. Se algum falhar, o push é cancelado e nada vai para o ar, porque o Cloudflare só publica o que chega ao GitHub. Numa emergência: `git push --no-verify`.

## Estrutura

```
public/
  index.html   Estrutura da página: barra de ações, abas, editor, preview, formatador JSON e atalhos
  editor.css   Estilos (tema escuro inspirado no VS Code)
  editor.js    Toda a lógica: Monaco, abas, arquivos, sessão, backup, Markdown e JSON
tests/        Testes automatizados (Playwright), um arquivo por área
docs/         Documentação (TESTES.md)
.githooks/    Verificação de testes antes do push
wrangler.jsonc Configuração de deploy no Cloudflare
```

## Dependências (via CDN)

- [Monaco Editor](https://github.com/microsoft/monaco-editor) 0.52.2
- [marked](https://github.com/markedjs/marked) 15.0.7
- [DOMPurify](https://github.com/cure53/DOMPurify) 3.2.6
- [Milkdown](https://github.com/Milkdown/milkdown) (Crepe) 7.22.2, carregado sob demanda no modo Visual

## Licença

Este projeto é distribuído sob a licença [Creative Commons Atribuição-NãoComercial 4.0 Internacional (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/deed.pt-br).

- ✅ Você pode usar, copiar, modificar e redistribuir.
- ❌ Não é permitido uso comercial.
- 📌 Ao divulgar ou redistribuir, inclusive versões modificadas, dê crédito ao autor (**Felipe FM**), informe a fonte (<https://github.com/felipefm/EditorWebPortable>), indique a licença e diga se houve alterações.

Veja o arquivo [LICENSE](LICENSE) para o texto completo.
