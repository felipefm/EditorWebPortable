# Meu Editor Web Portable

Editor de texto e código que roda direto no navegador, sem instalação e sem build. Ele usa o [Monaco Editor](https://microsoft.github.io/monaco-editor/), o mesmo do VS Code, e o projeto inteiro são três arquivos: `index.html`, `editor.css` e `editor.js`.

**🌐 Acesse online:** <https://editorportable.felipefm-suporte.workers.dev>

## Funcionalidades

- **Editor Monaco** com tema escuro, quebra de linha automática e realce de sintaxe para JavaScript, TypeScript, HTML, CSS, JSON, Markdown e texto puro.
- **Várias abas**: abra e edite vários arquivos ao mesmo tempo. Cada aba mostra a linguagem, e as que têm alterações não salvas ganham um ponto amarelo.
- **Minimapa** ao lado da barra de rolagem, como no Sublime Text e no VS Code: uma miniatura do documento onde clicar ou arrastar rola o texto. Funciona nos modos Editor, Dividido e Visual, e o botão **Mapa** no rodapé liga e desliga. Veja [Minimapa](#minimapa).
- **Painel de pastas** (Edge e Chrome): abra uma pasta do computador e veja os arquivos numa árvore à esquerda, como no VS Code e no Sublime Text. Pela árvore dá para abrir, criar, renomear e excluir arquivos e pastas. Veja [Painel de pastas](#painel-de-pastas).
- **Versão homelab** (Docker): o mesmo editor num servidor da sua casa, com a pasta de arquivos do servidor no painel de pastas, em qualquer navegador, inclusive o Zen. Veja [Versão homelab](#versão-homelab).
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

- **Automático, pelo GitHub (como está configurado):** a cada push na `main`, o GitHub Actions roda os testes e, se passarem, publica com `wrangler deploy`. Veja [Verificação automática no GitHub](#verificação-automática-no-github). Precisa dos segredos `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` no repositório.
- **Pelo terminal:** `npx wrangler login` e depois `npx wrangler deploy`.

> **Requer internet.** O Monaco Editor, o `marked` e o `DOMPurify` são carregados do CDN jsDelivr, e o Milkdown (modo Visual) do esm.sh. Sem conexão, o editor mostra uma mensagem de erro.

### Modo Visual

Nos documentos Markdown, o seletor de visualização tem quatro opções: **Editor**, **Dividido**, **Preview** e **Visual**. No modo Visual, você edita o texto já formatado: negrito aparece em negrito, listas como listas, tabelas como tabelas.

- **Atalhos:** todos os [atalhos de teclado](#atalhos-de-teclado) funcionam também no modo Visual. Além disso, digite `/` numa linha vazia para inserir blocos, ou selecione um trecho para ver uma barra de formatação.
- **O texto Markdown continua sendo o arquivo.** Cada edição no modo Visual atualiza o Markdown, e dá para trocar de modo a qualquer momento.
- **Documento novo já começa aqui:** o botão Novo, o + das abas e `Ctrl+Alt+N` criam um documento em Markdown, aberto no modo Visual.
- **Listas no Markdown padrão:** listas digitadas no Visual saem como `- item`, `1. item` e `- [ ] tarefa`, e sublistas ficam coladas ao item de cima. Uma linha vazia fica marcada com `<br />`, como no Typora.
- **Fechamento automático:** como no modo Editor, digitar `(`, `[` ou `{` já insere o fechamento, com o cursor no meio. Digitar o fechamento em cima dele não duplica, e Backspace entre um par vazio apaga os dois.
- **Entrar e sair sem editar não muda nada.** Ao editar, o Markdown é reescrito no formato padrão, preservando o estilo que o documento já usa (`-` ou `*` nas listas, `1.` ou `1)` nas numeradas, `_` ou `*` no itálico, `---` ou `***` nas linhas). Algumas coisas podem mudar mesmo assim: linhas em branco extras somem, e HTML escrito dentro do Markdown pode se perder.
- O Milkdown é carregado só na primeira vez que você usa o modo Visual. Sem internet, o editor avisa e volta para o modo Dividido.

### Minimapa

O minimapa é a miniatura do documento ao lado da barra de rolagem. A faixa destacada mostra o trecho que está na tela. Clique num ponto do mapa para ir até ele, ou arraste a faixa para rolar.

- **Editor e Dividido:** é o minimapa do próprio Monaco, o mesmo do VS Code, com as letras em miniatura.
- **Visual:** o Milkdown não tem minimapa, então o editor desenha um. Cada linha de texto vira um traço com o tamanho e a cor dela; blocos de código, tabelas, citações e imagens também aparecem.
- O botão **Mapa**, no rodapé, liga e desliga o minimapa em todos os modos. A escolha fica guardada no navegador.
- No celular, o minimapa fica sempre desligado, porque ocuparia espaço demais.

### Painel de pastas

O botão de pasta na barra lateral mostra ou esconde o painel. Em **Abrir pasta**, escolha uma pasta do computador; o navegador pede permissão para editar os arquivos dela.

- **A árvore:** pastas primeiro, depois arquivos, em ordem alfabética. Cada pasta só é lida quando você a expande, então pastas grandes não travam o editor. As pastas `.git` e `node_modules` ficam escondidas.
- **Abrir:** clique num arquivo para abri-lo numa aba. Se ele já estiver aberto, o editor só muda para a aba dele. O arquivo da aba atual fica destacado, e `Ctrl+S` grava direto nele. Imagens, PDFs e outros arquivos que não são texto não abrem.
- **Criar:** os botões do topo do painel criam um arquivo ou uma pasta. Depois que você escolhe um item na árvore, eles criam dentro da pasta escolhida (ou ao lado do arquivo); antes disso, na pasta aberta. O nome sugerido é `novo-arquivo.md`. Arquivos Markdown novos abrem no modo Visual, prontos para escrever.
- **Renomear e excluir:** clique com o botão direito num item, ou no botão ⋯ que aparece ao passar o mouse. Também dá para usar `F2` (renomear) e `Delete` (excluir). Renomear atualiza a aba, se o arquivo estiver aberto, inclusive a linguagem quando a extensão muda.
- **Excluir é definitivo:** o arquivo é apagado do computador e **não vai para a Lixeira**, por isso o editor sempre pergunta antes. Se o arquivo estiver aberto com alterações não salvas, o aviso diz isso, e a aba continua aberta com o texto.
- **Teclado:** as setas para cima e para baixo andam pela árvore, direita e esquerda expandem e recolhem, `Enter` abre e `Shift+F10` mostra as ações do item.
- **Outros botões do topo:** **Atualizar** mostra o que mudou na pasta por fora do editor, **Recolher** fecha todas as pastas e **Fechar a pasta** tira a pasta do painel, sem mexer nos arquivos nem nas abas.
- **Ao reabrir o editor,** a pasta e as pastas expandidas voltam. Às vezes o navegador pede para confirmar a permissão de novo; nesse caso, basta clicar em **Permitir acesso**.
- Arraste a borda direita do painel para mudar a largura. A escolha fica guardada.
- No **Zen, no Firefox** e no celular, o navegador não deixa abrir pastas. No Zen e no Firefox, o painel explica isso; nesses navegadores, a árvore funciona na [versão homelab](#versão-homelab). No celular, o botão não aparece.

### Versão homelab

A versão online não muda. A versão homelab é o mesmo editor rodando num container Docker num servidor da sua casa, junto com uma pasta de arquivos desse servidor. Ela serve para usar o painel de pastas no Zen (ou em qualquer navegador e aparelho da rede), sem instalar nada no computador.

**Instalar (Portainer ou CasaOS):**

1. No servidor, clone o projeto numa pasta: `git clone https://github.com/felipefm/EditorWebPortable.git`
2. Copie o [`homelab/docker-compose.yml`](homelab/docker-compose.yml) para uma stack nova do Portainer (ou para "Instalar app personalizado" no CasaOS).
3. Troque os dois caminhos em `volumes`: onde ficou a pasta do projeto e a pasta com os seus arquivos. Em `user`, use o dono dos arquivos (`1000:1000` é o mais comum).
4. Suba o container e abra `http://IP-DO-SERVIDOR:8887`.

**Atualizar:** `git pull` na pasta do projeto e reiniciar o container. A imagem é a oficial do Node (`node:22-alpine`); o servidor (`servidor/servidor.js`) usa só o que já vem com o Node.

**Como fica no editor:**

- O painel de pastas já mostra a pasta do servidor; não precisa clicar em Abrir pasta. Abrir, criar, renomear e excluir funcionam como no Edge.
- O botão é **Salvar** em qualquer navegador. Um documento novo pergunta o nome e é gravado na pasta escolhida na árvore (ou na pasta do servidor).
- **Excluir não apaga:** o item vai para `.editor/lixeira`, dentro da pasta de arquivos, e é apagado de vez depois de 30 dias.
- **Gravar por cima guarda uma cópia** do conteúdo anterior em `.editor/copias` (as 10 mais recentes de cada arquivo).
- **Conflito:** se o arquivo foi alterado em outro aparelho depois de aberto, o editor pergunta antes de gravar por cima. A versão do outro aparelho fica nas cópias.
- A pasta `.editor` não aparece na árvore.

**Segurança:**

- **Sem senha por padrão**, porque é só a rede de casa. Para ligar, preencha `SENHA` no `docker-compose.yml`; o editor pede a senha uma vez e o navegador lembra.
- O servidor só mexe dentro da pasta de arquivos: caminhos com `..`, caminhos absolutos e atalhos (links) para fora dela são recusados.
- Só aceita alterações vindas da própria página do editor, para outro site aberto no navegador não conseguir mandar pedidos escondidos.
- Só responde pelo IP, por `localhost` e por nomes da rede local (`homelab`, `servidor.lan`...). Outros nomes, como o do Tailscale, vão em `ENDERECOS`. Isso impede um site de fora de se passar por um endereço da sua rede.
- **Não tem HTTPS:** na rede de casa, os textos passam sem criptografia; pela VPN, o túnel já protege. **Não abra a porta para a internet.**
- Limite de 10 MB por arquivo.

Como a versão online, o homelab precisa de internet para carregar o Monaco e o Milkdown (CDN).

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
| Painel de pastas (abrir uma pasta inteira) | ✅ | ❌ (✅ na [versão homelab](#versão-homelab)) |

**Por que alguns navegadores só baixam?** Gravar num arquivo do computador exige a [File System Access API](https://developer.mozilla.org/docs/Web/API/Window/showSaveFilePicker), que só os navegadores baseados no Chromium oferecem. A Mozilla decidiu não implementá-la, por segurança, e não existe opção para ativá-la no Firefox nem nos navegadores derivados dele. No Brave, ela vem desligada e pode ser ativada em `brave://flags/#file-system-access-api`.

Nesses navegadores, o editor:

- mostra o botão **Baixar** no lugar de **Salvar**, e um aviso na primeira visita (some ao clicar em **Entendi**);
- pergunta o nome só no primeiro download de um documento novo e depois reaproveita o nome. Arquivos abertos são baixados com o próprio nome;
- marca o documento como salvo depois de baixar;
- no `Ctrl+S`, só confirma que o texto está salvo no navegador, sem baixar nada.

O navegador pode acrescentar um número ao nome (`notas (1).md`) quando o arquivo já existe na pasta de downloads. Isso é controlado pelo navegador, não pelo editor.

## Testes automatizados

O projeto tem **343 testes automatizados**, divididos em 13 áreas: geral, atalhos, abas, arquivos, Markdown, modo Visual, imagens, minimapa, pastas, homelab, JSON, sessão e celular. Eles usam o [Playwright](https://playwright.dev) e abrem o editor num navegador de verdade, clicando, digitando e conferindo o resultado. Rodam no **Microsoft Edge** e no **Firefox** (o motor do Zen Browser): ao todo, cerca de 621 execuções.

📖 **Documentação completa: [docs/TESTES.md](docs/TESTES.md).** Explica como funcionam, a lista de todos os testes, como o projeto escolhe o que testar, como escrever testes novos e o que fazer quando algo falha.

### Começando

```bash
cd tests
npm install              # primeira vez: instala o Playwright e o Firefox de testes
npm run test:alterado    # roda só os testes das áreas que você alterou
npm test                 # roda todos, no Edge e no Firefox (cerca de 6 minutos)
```

Também dá para rodar uma área específica: `npm run test:geral`, `test:atalhos`, `test:abas`, `test:arquivos`, `test:markdown`, `test:visual`, `test:imagens`, `test:mapa`, `test:json`, `test:sessao` ou `test:celular`, ou só o Firefox: `npm run test:firefox`.

### Testa só o que mudou

O `npm run test:alterado` lê o `git diff`, descobre em qual função do `editor.js` (ou em qual id/classe do HTML e do CSS) cada linha mudou e roda só os testes daquela área. Por exemplo, mudar `formatarJson` roda os testes de JSON. Em caso de dúvida, roda tudo.

### Verificação automática no GitHub

Os testes rodam nos servidores do GitHub (GitHub Actions), não no seu computador. A cada `git push` na `main`, o GitHub roda os testes das áreas alteradas, no Edge e no Firefox, numa máquina Windows. Se passarem, publica o site no Cloudflare. Se algum falhar, o site **não é publicado** e o GitHub avisa por e-mail. O resultado fica na aba **Actions** do repositório. Detalhes em [docs/TESTES.md](docs/TESTES.md#verificação-no-github).

## Estrutura

```
public/
  index.html   Estrutura da página: barra de ações, abas, editor, preview, formatador JSON e atalhos
  editor.css   Estilos (tema escuro inspirado no VS Code)
  editor.js    Toda a lógica: Monaco, abas, arquivos, sessão, backup, Markdown e JSON
servidor/     Servidor da versão homelab (só Node, sem dependências)
homelab/      docker-compose.yml da versão homelab
tests/        Testes automatizados (Playwright), um arquivo por área
docs/         Documentação: testes (TESTES.md), plano de ação e propostas
.github/      Testes e publicação no GitHub Actions
.githooks/    Verificação opcional antes do push, no próprio computador
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
