# Testes automatizados

Este documento explica como os testes do Editor Portable funcionam, como rodá-los, como o projeto decide quais testes rodar depois de uma alteração e como escrever testes novos.

## Sumário

- [Visão geral](#visão-geral)
- [Instalação](#instalação)
- [Comandos](#comandos)
- [Testar só o que mudou](#testar-só-o-que-mudou)
- [Verificação no GitHub](#verificação-no-github)
- [Lista de testes por área](#lista-de-testes-por-área)
- [Como os testes funcionam por dentro](#como-os-testes-funcionam-por-dentro)
- [Escrevendo um teste novo](#escrevendo-um-teste-novo)
- [Criando uma área nova](#criando-uma-área-nova)
- [Quando um teste falha](#quando-um-teste-falha)
- [Solução de problemas](#solução-de-problemas)
- [Limitações](#limitações)

## Visão geral

Os testes usam o [Playwright](https://playwright.dev). Cada teste abre o editor num navegador de verdade (o Microsoft Edge instalado no Windows), clica, digita e confere o resultado na tela, do mesmo jeito que uma pessoa faria.

São **230 testes** em **11 áreas**, um arquivo por área. Eles rodam em dois navegadores: o **Microsoft Edge** (projeto `desktop`) e o **Firefox** (projeto `firefox`, o mesmo motor do Zen Browser e do LibreWolf). Os testes de celular rodam só no Edge. Ao todo são cerca de 454 execuções, e a suíte completa leva uns 4 minutos.

| Área | Arquivo | Testes | O que cobre |
| --- | --- | --- | --- |
| geral | `geral.spec.js` | 6 | Carregamento sem erros, barra lateral, paleta de comandos, rodapé |
| abas | `abas.spec.js` | 12 | Criar, trocar e fechar abas, indicador de não salvo, diálogo de confirmação, troca de linguagem |
| arquivos | `arquivos.spec.js` | 19 | Abrir, salvar, salvar como, detecção de linguagem, modo "Baixar" dos navegadores sem gravação direta |
| markdown | `markdown.spec.js` | 57 | Barra e **todos os atalhos** de formatação, envolver a seleção com aspas e parênteses, linha horizontal, preview, segurança do preview, modos de visualização |
| visual | `visual.spec.js` | 53 | Modo Visual (Milkdown): edição formatada, **todos os atalhos**, cursor pronto para digitar, envolver a seleção, botão + da margem sem a alça de arrastar, sincronia com o Markdown, preservação do estilo, salvar, abas, falta de internet |
| imagens | `imagens.spec.js` | 17 | Imagens preservadas no modo Visual, diálogo "Inserir imagem" (link e arquivo), item Imagem do menu `/`, redução de tamanho |
| mapa | `mapa.spec.js` | 13 | Minimapa do Monaco (Editor e Dividido) e o desenhado no modo Visual: botão Mapa, escolha lembrada, clicar e arrastar para rolar, atualização ao digitar |
| atalhos | `atalhos.spec.js` | 26 | Atalhos gerais (salvar, salvar como, abrir, nova aba, formatador JSON) em cada modo, com o foco dentro e fora do texto |
| json | `json.spec.js` | 11 | Formatar, compactar, indentação, erros com linha e coluna, copiar, abrir em aba |
| sessao | `sessao.spec.js` | 10 | Sessão restaurada, painel de backup, exportar e importar |
| celular | `celular.spec.js` | 6 | Layout em tela de 390 × 844 |

Tudo fica na pasta `tests/`, separada do site. O Cloudflare publica só a pasta `public/`, então os testes nunca vão para o ar.

```
tests/
  geral.spec.js        ┐
  abas.spec.js         │
  arquivos.spec.js     │  um arquivo de teste por área
  markdown.spec.js     │
  visual.spec.js       │
  imagens.spec.js      │
  mapa.spec.js         │
  atalhos.spec.js      │
  json.spec.js         │
  sessao.spec.js       │
  celular.spec.js      ┘
  utilidades.js        funções compartilhadas pelos testes
  alterados.js         descobre o que mudou e roda só as áreas afetadas
  servidor.js          servidor local que serve public/ durante os testes
  playwright.config.js configuração (navegador, telas, relatório)
  package.json         comandos npm
.github/workflows/
  testes-e-publicacao.yml  roda os testes no GitHub e publica no Cloudflare
.githooks/
  pre-push             opcional: roda os testes no computador antes do push
```

## Instalação

Precisa de [Node.js](https://nodejs.org) e do Microsoft Edge (já vem no Windows). O Firefox de testes é baixado pelo próprio Playwright. Na primeira vez:

```bash
cd tests
npm install
```

Esse comando instala o Playwright e baixa o Firefox de testes.

Os testes precisam de internet, porque o Monaco Editor, o `marked` e o `DOMPurify` são carregados do CDN, e o Milkdown (modo Visual) do esm.sh.

## Comandos

Todos são executados dentro da pasta `tests/`.

| Comando | O que faz |
| --- | --- |
| `npm run test:alterado` | Roda só os testes das áreas que você alterou (alterações ainda não commitadas) |
| `npm run test:alterado -- HEAD~1` | Roda os testes das áreas alteradas no último commit |
| `npm run test:alterado -- --listar` | Mostra quais áreas seriam testadas, sem rodar |
| `npm test` | Roda todos os testes |
| `npm run test:geral` | Só a área geral |
| `npm run test:abas` | Só abas |
| `npm run test:arquivos` | Só arquivos |
| `npm run test:markdown` | Só Markdown |
| `npm run test:visual` | Só o modo Visual |
| `npm run test:imagens` | Só imagens |
| `npm run test:mapa` | Só o minimapa |
| `npm run test:atalhos` | Só os atalhos gerais em todos os modos |
| `npm run test:firefox` | Todos os testes, só no Firefox |
| `npm run test:json` | Só o formatador JSON |
| `npm run test:sessao` | Só sessão e backup |
| `npm run test:celular` | Só o layout de celular |
| `npm run test:assistir` | Roda com o navegador aberto, para acompanhar o que o teste faz |
| `npm run test:relatorio` | Abre o relatório da última execução |

Para rodar um único teste pelo nome:

```bash
npx playwright test -g "fechar a última aba"
```

Para usar o Chrome em vez do Edge:

```bash
NAVEGADOR=chrome npm test
```

## Testar só o que mudou

O comando `npm run test:alterado` evita rodar a suíte inteira a cada alteração. Ele:

1. Lê o `git diff` para saber quais linhas mudaram em `public/` e `tests/`.
2. Descobre a **área** de cada linha alterada.
3. Roda só os testes dessas áreas, sempre junto com a área **geral**, que é rápida e pega erros de carregamento.

Exemplo real: uma mudança na função `transformarCitacaoMarkdown` mostra isto e roda 31 testes em vez de 77:

```
O que mudou:
  - editor.js: transformarCitacaoMarkdown() → markdown

Áreas a testar: geral, markdown
```

### Como a área é escolhida

**`public/editor.js`:** pela função onde a linha mudou. O nome da função é comparado com palavras-chave:

| Se o nome tiver… | Área |
| --- | --- |
| `json` | json |
| `visual`, `milkdown`, `crepe`, `atualizarPreviewMarkdown`, `aplicarModoPreview` | visual |
| `imagem`, `image`, `img` | imagens |
| `mapa`, `minimap` | mapa |
| `markers` | abas |
| `atalho`, `keydown`, `keybinding` | atalhos |
| `envolver` | markdown e visual |
| `markdown`, `preview`, `modo`, `marcacao`, `citacao`, `tarefas`, `numerada`, `negrito`, `italico`, `tachado`, `horizontal` | markdown |
| `sessao`, `backup`, `persist`, `navegador`, `indexeddb`, `instantaneo`, `importar`, `exportar` | sessao |
| `arquivo`, `salvar`, `salvo`, `baixar`, `download`, `gravacao`, `sugerido`, `carregar`, `manipulador` | arquivos |
| `aba`, `documento`, `semtitulo`, `modificac`, `dialogo`, `confirmar`, `linguagem` | abas |
| `topo`, `trilho`, `rodape`, `paleta`, `falha`, `visualizacao`, `cursor`, `cabecalho` | geral |

Alguns exemplos:

| Função alterada | Áreas testadas |
| --- | --- |
| `formatarJson` | json |
| `aplicarMarcacaoMarkdown` | markdown |
| `gravarSessaoNoArquivo` | sessao + arquivos |
| `fecharDocumento` | abas |
| `atualizarRodape` | geral |

Uma função pode cair em mais de uma área, e então todas rodam. Funções auxiliares cujo nome não diz a área (por exemplo, `obterLinhasSelecionadas`, que só é usada pelo Markdown) estão listadas à mão em `funcoesConhecidas`, dentro de `tests/alterados.js`.

Se a linha alterada estiver **fora de uma função** (por exemplo, no bloco de inicialização, onde os botões são ligados), a área é escolhida pelo **texto da linha**. Uma linha com `botaoFormatarJson.addEventListener` cai em json.

**`public/index.html` e `public/editor.css`:** pelo texto da linha alterada, que normalmente contém ids e classes como `#json-erro`, `.aba`, `#painel-sessao` ou `data-md`. Mudanças no CSS dentro de um bloco `@media` também rodam os testes de **celular**.

**`tests/`:**
- Um arquivo `*.spec.js` alterado roda a própria área.
- `utilidades.js`, `servidor.js`, `playwright.config.js`, `package.json` ou `package-lock.json` rodam **todos** os testes, porque afetam todas as áreas.

**Em caso de dúvida, roda tudo.** Se nenhuma regra reconhece a alteração, o comando roda a suíte inteira. Como a identificação é feita por palavras-chave, às vezes ele roda uma área a mais do que o necessário. A regra é nunca rodar a menos.

Mudanças fora de `public/` e `tests/` (por exemplo, só no README) não rodam testes.

## Verificação no GitHub

Os testes rodam nos servidores do GitHub (GitHub Actions), de graça porque o repositório é público. Nada roda no seu computador, e o `git push` termina na hora. O arquivo é `.github/workflows/testes-e-publicacao.yml`:

```
git push (main)
  └─ GitHub Actions, numa máquina Windows
       ├─ testes: node tests/alterados.js <commit anterior>..<commit novo>
       │    ├─ passaram → publicar: wrangler deploy → site no ar
       │    └─ falhou   → nada é publicado, e o GitHub avisa por e-mail
```

Detalhes:

- **Onde ver:** na aba **Actions** do repositório no GitHub. Cada push aparece com ✓ (publicado) ou ✗ (teste falhou, não publicado).
- **Quanto demora:** a máquina do GitHub é mais lenta que um computador de mesa. Um push que muda uma área leva poucos minutos; um que roda tudo, uns 10 a 15 minutos. O site só muda depois disso.
- **Quando um teste falha:** o relatório completo, com prints e traces, fica em **Actions → (o push) → Artifacts → relatorio-dos-testes**, por 14 dias. Baixe, descompacte e abra com `npx playwright show-report relatorio` ou `npx playwright show-trace resultados/<pasta>/trace.zip`.
- **Rodar tudo de novo:** em **Actions → Testes e publicação → Run workflow**, roda todos os testes e publica se passarem. Serve, por exemplo, para republicar depois de uma falha de rede.
- **Uma publicação por vez:** pushes seguidos entram numa fila, na ordem em que chegaram.
- **Segredos:** a publicação usa `CLOUDFLARE_API_TOKEN` (token do Cloudflare com o modelo *Edit Cloudflare Workers*) e `CLOUDFLARE_ACCOUNT_ID`, guardados em **Settings → Secrets and variables → Actions** no GitHub. A publicação automática do próprio Cloudflare (Workers Builds) fica desligada, senão ela publicaria sem esperar os testes.

### Verificação opcional no computador

O script `.githooks/pre-push` faz a mesma verificação no seu computador, antes do push, e cancela o push se algum teste falhar. Ele vem desligado, porque usa bastante o processador durante alguns minutos. Para ligar neste computador:

```bash
git config core.hooksPath .githooks
```

Para desligar: `git config --unset core.hooksPath`. Com ele ligado, `git push --no-verify` envia sem testar.

## Lista de testes por área

### geral (6)

- carrega sem erros e mostra a interface principal
- barra lateral alterna entre documentos, JSON e atalhos
- Ctrl+Alt+J abre o formatador JSON
- botão de busca abre a paleta de comandos
- rodapé mostra caracteres, cursor, linguagem e quebra de linha
- rodapé esconde dados do documento no formatador JSON

### abas (12)

- botão + cria uma nova aba ativa
- botão Novo do topo também cria uma aba
- Ctrl+Alt+N cria uma nova aba
- editar marca a aba e o rodapé como não salvos
- clicar numa aba troca o documento exibido
- fechar aba sem alterações não pede confirmação
- fechar aba modificada pede confirmação; cancelar mantém a aba
- fechar aba modificada e confirmar remove a aba
- fechar a última aba cria uma aba vazia
- trocar a linguagem atualiza a sigla da aba
- trocar de JavaScript para Markdown logo depois de abrir não deixa o texto marcado como erro
- voltar para JavaScript volta a mostrar os erros

### arquivos (19)

Com gravação direta (Chrome, Edge):

- abrir `notas.md`, `dados.json`, `estilo.css`, `pagina.html`, `script.ts` e `leia.txt` detecta a linguagem certa (6 testes)
- sem a API de arquivos, salvar baixa uma cópia com o nome informado
- com a API de arquivos, salvar um documento novo grava e limpa o indicador
- nome sugerido para documento novo usa a extensão da linguagem
- com gravação direta o botão continua "Salvar" e não há aviso
- arquivo aberto é salvo no mesmo arquivo com Ctrl+S
- Salvar como grava com o nome sugerido

Sem gravação direta (Firefox, Zen, Safari, celular):

- botão vira "Baixar" e o aviso explica o motivo
- "Entendi" esconde o aviso, que não volta depois de recarregar
- primeiro download pergunta o nome; os seguintes reaproveitam sem perguntar
- arquivo aberto é baixado com o próprio nome, sem perguntar
- "Baixar com outro nome" sempre pergunta e renomeia a aba
- Ctrl+S não baixa nada e confirma o salvamento no navegador
- cancelar a pergunta do nome não baixa nada

### markdown (57)

- barra de formatação só aparece em documentos Markdown
- botão de negrito aplica e remove a marcação
- Ctrl+B aplica negrito
- itálico, tachado e código inline: pelo botão e pelo atalho (6 testes)
- link transforma a seleção e seleciona a URL
- H1, H2, H3, lista, lista numerada, lista de tarefas e citação aplicam e removem o formato da linha (7 testes)
- linha horizontal no meio do texto, numa linha vazia e no fim do documento insere `---` com as linhas em branco certas (3 testes)
- `---` colado no texto vira título; com linha em branco vira linha
- **cada atalho de linha** (`Ctrl+1` a `6`, `Ctrl+Shift+1`, `2` e `6`, `Ctrl+Shift+7`, `8`, `9` e `Q`) aplica e remove o formato (13 testes)
- `Alt+Shift+5` aplica tachado; `Ctrl+K` cria link
- digitar `"` `'` `(` `[` `{` `` ` `` `*` `_` ou `<` com a palavra selecionada envolve em vez de apagar (9 testes)
- a palavra continua selecionada: digitar `*` duas vezes vira `**negrito**`
- envolve várias seleções ao mesmo tempo
- sem seleção, digitar aspas funciona normalmente
- em código, `*` substitui a seleção (só Markdown envolve com `*`)
- formatação funciona com várias linhas selecionadas
- preview renderiza o Markdown ao vivo
- preview remove scripts e eventos perigosos
- links do preview abrem em nova aba
- modos Editor, Dividido e Preview mostram os painéis certos
- usar a barra no modo Preview volta para o modo Dividido
- documento que não é Markdown não mostra preview
- modo de visualização é lembrado depois de recarregar

### visual (53)

- mostra o Markdown formatado e esconde a barra do editor de texto
- entrar e sair do modo Visual sem editar não altera o texto
- digitar no modo Visual atualiza o Markdown
- Ctrl+B no modo Visual vira **negrito** no Markdown
- editar preserva o estilo do documento (listas com `*` e itálico com `*`)
- tabela editada mantém o separador `| --- |`
- Ctrl+S no modo Visual salva o texto mais recente
- trocar de aba mostra o conteúdo da outra e preserva o da primeira
- modo Visual é lembrado depois de recarregar
- menu "/" aparece em português
- **cada atalho documentado funciona no modo Visual**: negrito, itálico, tachado (os dois atalhos), código inline, títulos 1 a 6, título com `Ctrl+Shift`, listas numerada, com marcadores e de tarefas, e citação (16 testes)
- `Ctrl+K` pede o endereço e cria o link
- apertar o atalho duas vezes desfaz título, listas e citação (5 testes)
- digitar `"` `'` `(` `[` ou `{` com a palavra selecionada envolve em vez de apagar (5 testes)
- ao passar o mouse aparece o + na margem, sem a alça de arrastar
- clicar no + abre o menu de blocos
- arrastar pelo + não move o parágrafo
- começar a seleção pela margem esquerda não move o parágrafo
- sem internet para o editor visual, volta ao modo Dividido e avisa

Cursor pronto para digitar, sem clicar no texto, depois de:

- criar um arquivo novo pelo botão Novo, pelo + das abas e por Ctrl+Alt+N (3 testes)
- clicar no botão Visual
- trocar de aba
- fechar uma aba (digita na que ficou)
- mudar a linguagem para Markdown com o modo Visual escolhido
- recarregar a página
- voltar da tela de atalhos
- criar um arquivo novo no modo Editor (comparação: o Monaco recebe o foco)
- documento que não é Markdown não usa o modo Visual

### imagens (17)

- imagem sozinha sem título (link e embutida), com título, no meio da frase e sem descrição continua no texto depois de editar outro trecho no modo Visual (5 testes)
- a descrição da imagem é preservada (não vira "1.00")
- botão "Imagem" aparece só em documentos Markdown
- sem link e sem arquivo, o diálogo avisa e não insere nada
- cancelar fecha o diálogo sem inserir
- no modo Editor, insere `![descrição](link)` na posição do cursor
- no modo Visual, insere a imagem por link e ela aparece
- arquivo grande é reduzido para no máximo 1600 px e embutido no documento
- arquivo pequeno mantém o tamanho original
- no modo Visual, o arquivo enviado aparece como imagem
- arquivo que não é imagem mostra erro e não insere nada
- no modo Visual, "/" + Imagem abre o diálogo e insere a imagem no lugar do "/"
- imagem embutida aparece no preview

### mapa (13)

Modos Editor e Dividido (minimapa do Monaco):

- vem ligado no modo Editor, inclusive em arquivos que não são Markdown
- aparece no modo Dividido
- o botão Mapa desliga e liga o minimapa
- a escolha fica lembrada depois de recarregar
- clicar no minimapa rola o documento

Modo Visual (minimapa desenhado pelo editor):

- o mapa aparece ao lado da página e tem desenho
- desligar esconde o mapa e a página ocupa a largura toda
- a escolha também vale para o modo Visual depois de recarregar
- clicar no mapa rola o documento até aquele ponto
- arrastar a janela do mapa rola o documento
- rolar a página move a janela do mapa
- o mapa se atualiza ao digitar
- os botões do bloco de código ("js", "Copiar") não viram traços no mapa

### atalhos (26)

Em cada modo (Editor, Dividido, Preview e Visual), com o foco num botão, fora do texto:

- `Ctrl+S` salva o documento
- `Ctrl+Shift+S` salva como
- `Ctrl+O` abre um arquivo
- `Ctrl+Alt+N` cria uma aba nova
- `Ctrl+Alt+J` abre o formatador JSON

Em cada modo, com o foco no texto: `Ctrl+S` salva o documento.

Também:

- navegador sem gravação direta (Zen/Firefox): `Ctrl+S` no modo Visual com foco num botão salva no navegador
- atalho com um diálogo aberto não executa a ação

### json (11)

- entrada vazia mostra o estado vazio e desativa as ações
- formata automaticamente um JSON válido
- indentação com 4 espaços e com tabulação
- compactar remove espaços e quebras de linha
- JSON inválido mostra linha e coluna do erro
- "Ir para o erro" posiciona o cursor no erro
- corrigir o JSON esconde o erro
- "Usar aba atual" traz o conteúdo do documento
- documento JSON aberto preenche a entrada ao abrir o formatador
- copiar coloca o resultado na área de transferência
- "Abrir em nova aba" cria um documento JSON não salvo

### sessao (10)

- abas e conteúdo voltam depois de recarregar a página
- a ferramenta aberta também é restaurada
- painel de sessão abre, fecha com Esc e com clique fora
- painel mostra o horário do último salvamento e o número de abas
- exportar cópia baixa um JSON com todas as abas
- importar sessão substitui as abas
- importar com alterações pendentes pede confirmação
- importar arquivo inválido avisa e mantém as abas
- configurar backup em arquivo grava a sessão e mostra "Backup ativo"
- navegador sem backup em arquivo explica e esconde o botão

### celular (6)

Estes rodam numa tela de 390 × 844 (projeto `celular` no `playwright.config.js`).

- topo fica visível e a barra de ferramentas vai para baixo
- botões do topo mostram só ícones
- nada ultrapassa a largura da tela
- modo dividido empilha editor e preview
- minimapa fica desligado e o botão Mapa não aparece
- painel de sessão cabe na tela

## Como os testes funcionam por dentro

### Servidor local

O Playwright sobe o `servidor.js`, que serve a pasta `public/` em `http://localhost:4173`, e para o servidor no fim. Se a porta já estiver em uso por um servidor anterior, ele é reaproveitado.

### Navegador limpo a cada teste

Cada teste roda num perfil de navegador novo. Por isso, o `localStorage` e o IndexedDB começam vazios, e um teste nunca depende do que outro deixou salvo. Os testes rodam em paralelo (6 ao mesmo tempo, por padrão).

### Arquivos simulados

Os testes não abrem as janelas de "Abrir" e "Salvar" do Windows, que travariam a execução. Em vez disso, `utilidades.js` substitui a File System Access API por uma versão simulada:

- `showOpenFilePicker` devolve os arquivos passados em `abrirArquivos`.
- `showSaveFilePicker` devolve um arquivo falso, e tudo o que é gravado fica em `window.__arquivosGravados[nome]`, onde o teste pode conferir.

Também dá para simular um navegador **sem** essa API (como o Firefox), para testar o caminho de download.

### Funções de apoio (`utilidades.js`)

| Função | O que faz |
| --- | --- |
| `abrirEditor(page, opcoes)` | Abre o editor e espera o Monaco carregar. Devolve a lista de erros de JavaScript da página |
| `recarregar(page)` | Recarrega a página e espera carregar de novo |
| `definirConteudo(page, texto)` / `obterConteudo(page)` | Escreve ou lê o texto do documento atual |
| `focarEditor(page)` | Clica no editor para receber o teclado |
| `selecionar(page, linha, coluna, linhaFinal, colunaFinal)` | Seleciona um trecho (linhas e colunas começam em 1) |
| `novaAba(page, linguagem, conteudo)` | Cria uma aba, opcionalmente com linguagem e conteúdo |
| `nomesDasAbas(page)` | Lista os nomes das abas abertas |
| `editorJson(page, 'entrada' \| 'saida', texto?)` | Lê ou escreve nos editores do formatador JSON |
| `arquivosGravados(page)` | Devolve o que foi "gravado" nos arquivos simulados |

Opções de `abrirEditor`:

| Opção | Valores | Para quê |
| --- | --- | --- |
| `arquivos` | `'simulados'` (padrão), `'indisponivel'`, `'nativo'` | Simular a API de arquivos, removê-la ou usar a do navegador |
| `abrirArquivos` | `[{ nome, conteudo }]` | Arquivos que o "Abrir" simulado vai devolver, em ordem |
| `respostaPrompt` | texto | Resposta automática para `window.prompt` |

O aviso de "sair da página com alterações não salvas" é aceito automaticamente, para que `recarregar` funcione.

## Escrevendo um teste novo

Ao mudar ou criar uma funcionalidade, adicione o teste no arquivo da área correspondente. Exemplo de um teste novo em `tests/abas.spec.js`:

```js
test('duplo clique no + cria duas abas', async ({ page }) => {
    await abrirEditor(page);
    await page.locator('#nova-aba').click();
    await page.locator('#nova-aba').click();
    await expect(page.locator('.aba')).toHaveCount(3);
});
```

Boas práticas:

- **Um comportamento por teste**, com um nome que diga o resultado esperado ("fechar a última aba cria uma aba vazia").
- **Use os ids da página** (`#salvar`, `#json-erro`) como seletores. Se mudar um id no HTML, atualize os testes.
- **Prefira `await expect(...).toHaveText(...)`** em vez de `waitForTimeout`. O `expect` espera a tela atualizar sozinho, até 7 segundos.
- **Prepare o estado pela API do editor** (`definirConteudo`, `selecionar`) e **teste a ação pela interface** (clicar no botão, apertar o atalho). Assim o teste é rápido e continua testando o que a pessoa faz.
- **Confira que não há erros de JavaScript** quando fizer sentido:
  ```js
  const erros = await abrirEditor(page);
  // ...
  expect(erros).toEqual([]);
  ```

Para ver o teste rodando enquanto escreve:

```bash
npx playwright test -g "duplo clique" --headed
```

## Criando uma área nova

1. Crie `tests/<area>.spec.js`.
2. Em `tests/package.json`, adicione o script `"test:<area>": "playwright test <area>"`.
3. Em `tests/alterados.js`:
   - adicione a área em `areasConhecidas`;
   - adicione uma linha em `regras` com as palavras-chave das funções e dos ids dessa área.
4. Confira o mapeamento com uma alteração de teste:
   ```bash
   npm run test:alterado -- --listar
   ```
5. Atualize este documento.

## Quando um teste falha

O terminal mostra o que era esperado e o que apareceu. Por exemplo:

```
✘ markdown.spec.js › botão citacao aplica e remove o formato da linha
    Expected: "> item"
    Received: ">> item"
```

Para investigar:

- `npm run test:relatorio` abre o relatório no navegador, com o **print da tela** no momento da falha.
- Cada falha também gera um **trace** em `tests/resultados/`. Ele grava passo a passo o que o teste fez, com a tela, o console e a rede. Para abrir:
  ```bash
  npx playwright show-trace resultados/<pasta-do-teste>/trace.zip
  ```
- `npm run test:assistir` roda com o navegador aberto, para ver a falha acontecer.

As pastas `tests/relatorio/` e `tests/resultados/` são geradas a cada execução e ficam fora do git.

### Testes instáveis (flaky)

Um teste que falha é **repetido uma vez** automaticamente (`retries: 1` no `playwright.config.js`). Se passar na segunda tentativa, o resultado mostra, por exemplo, `1 flaky`, e o push segue. Isso acontece por motivos que não são defeitos do editor:

- o Milkdown (modo Visual) vem da internet (esm.sh) e às vezes demora ou falha;
- com vários testes em paralelo, o computador fica ocupado e o navegador perde o tempo de um duplo clique ou de uma digitação.

Um defeito de verdade falha nas duas tentativas e continua bloqueando o push. Se o mesmo teste aparecer como instável com frequência, vale investigar: rode `npx playwright test <área> --repeat-each=5` para tentar reproduzir.

## Solução de problemas

| Problema | Causa provável | Solução |
| --- | --- | --- |
| Todos os testes falham esperando `window.editor` | Sem internet, ou o CDN fora do ar | Confira a conexão; o Monaco vem do jsDelivr |
| `browserType.launch: Chromium distribution 'msedge' is not found` | Edge não instalado | Instale o Edge ou rode com `NAVEGADOR=chrome` |
| `As dependências dos testes não estão instaladas` | Falta `npm install` | `cd tests && npm install` |
| O site não atualizou depois do push | Algum teste falhou no GitHub, ou a publicação ainda está na fila | Veja a aba **Actions** do repositório |
| A publicação falha com erro de autenticação | Segredo do Cloudflare ausente ou vencido | Crie um token novo e atualize `CLOUDFLARE_API_TOKEN` no GitHub |
| O push não roda os testes no computador | O hook opcional está desligado (o padrão) | `git config core.hooksPath .githooks` |
| Erro `\r: command not found` no push | O hook ficou com quebras de linha do Windows | O `.gitattributes` evita isso; se acontecer, rode `git checkout -- .githooks/pre-push` |
| Porta 4173 em uso | Outro programa usando a porta | Feche o programa ou mude `porta` no `playwright.config.js` |
| Teste de copiar falha raramente | A área de transferência é do sistema inteiro | Rode de novo; evite copiar algo enquanto os testes rodam |

## Limitações

- **Arquivos reais não são testados.** A gravação em disco usa a API simulada. O comportamento das janelas nativas do Windows e das permissões do navegador precisa ser conferido à mão.
- **A aparência não é comparada pixel a pixel.** Os testes conferem estrutura, textos, posições e tamanhos, mas não pegam, por exemplo, uma cor errada.
- **Edge e Firefox.** O Safari não é testado automaticamente. No Firefox, o teste de copiar para a área de transferência é pulado, porque o Firefox não deixa testes lerem a área de transferência.
- **A escolha da área é por palavras-chave.** Funciona bem para o código atual. Se uma função nova tiver um nome que não diz a área, adicione-a em `funcoesConhecidas` no `alterados.js`.
