# Testes automatizados

Este documento explica como os testes do Editor Portable funcionam, como rodá-los, como o projeto decide quais testes rodar depois de uma alteração e como escrever testes novos.

## Sumário

- [Visão geral](#visão-geral)
- [Instalação](#instalação)
- [Comandos](#comandos)
- [Testar só o que mudou](#testar-só-o-que-mudou)
- [Verificação antes do push](#verificação-antes-do-push)
- [Lista de testes por área](#lista-de-testes-por-área)
- [Como os testes funcionam por dentro](#como-os-testes-funcionam-por-dentro)
- [Escrevendo um teste novo](#escrevendo-um-teste-novo)
- [Criando uma área nova](#criando-uma-área-nova)
- [Quando um teste falha](#quando-um-teste-falha)
- [Solução de problemas](#solução-de-problemas)
- [Limitações](#limitações)

## Visão geral

Os testes usam o [Playwright](https://playwright.dev). Cada teste abre o editor num navegador de verdade (o Microsoft Edge instalado no Windows), clica, digita e confere o resultado na tela, do mesmo jeito que uma pessoa faria.

São **155 testes** em **9 áreas**, um arquivo por área. A suíte completa leva cerca de 1 minuto.

| Área | Arquivo | Testes | O que cobre |
| --- | --- | --- | --- |
| geral | `geral.spec.js` | 6 | Carregamento sem erros, barra lateral, paleta de comandos, rodapé |
| abas | `abas.spec.js` | 10 | Criar, trocar e fechar abas, indicador de não salvo, diálogo de confirmação |
| arquivos | `arquivos.spec.js` | 19 | Abrir, salvar, salvar como, detecção de linguagem, modo "Baixar" dos navegadores sem gravação direta |
| markdown | `markdown.spec.js` | 44 | Barra e **todos os atalhos** de formatação, linha horizontal, preview, segurança do preview, modos de visualização |
| visual | `visual.spec.js` | 34 | Modo Visual (Milkdown): edição formatada, **todos os atalhos**, sincronia com o Markdown, preservação do estilo, salvar, abas, falta de internet |
| imagens | `imagens.spec.js` | 16 | Imagens preservadas no modo Visual, diálogo "Inserir imagem" (link e arquivo), redução de tamanho |
| json | `json.spec.js` | 11 | Formatar, compactar, indentação, erros com linha e coluna, copiar, abrir em aba |
| sessao | `sessao.spec.js` | 10 | Sessão restaurada, painel de backup, exportar e importar |
| celular | `celular.spec.js` | 5 | Layout em tela de 390 × 844 |

Tudo fica na pasta `tests/`, separada do site. O Cloudflare publica só a pasta `public/`, então os testes nunca vão para o ar.

```
tests/
  geral.spec.js        ┐
  abas.spec.js         │
  arquivos.spec.js     │  um arquivo de teste por área
  markdown.spec.js     │
  visual.spec.js       │
  imagens.spec.js      │
  json.spec.js         │
  sessao.spec.js       │
  celular.spec.js      ┘
  utilidades.js        funções compartilhadas pelos testes
  alterados.js         descobre o que mudou e roda só as áreas afetadas
  servidor.js          servidor local que serve public/ durante os testes
  playwright.config.js configuração (navegador, telas, relatório)
  package.json         comandos npm
.githooks/
  pre-push             roda os testes antes de cada git push
```

## Instalação

Precisa de [Node.js](https://nodejs.org) e do Microsoft Edge (já vem no Windows). Na primeira vez:

```bash
cd tests
npm install
```

Esse comando instala o Playwright e ativa a [verificação antes do push](#verificação-antes-do-push).

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

## Verificação antes do push

Todo `git push` passa pelo script `.githooks/pre-push`, que roda os testes das áreas alteradas **nos commits que estão sendo enviados**:

```
git push
  └─ .githooks/pre-push
       └─ compara o que está no GitHub com o que você está enviando
            └─ node tests/alterados.js <commit no GitHub>..<seu commit>
                 ├─ testes passaram → o push continua → o Cloudflare publica
                 └─ algum teste falhou → push cancelado → nada vai para o ar
```

Como o Cloudflare só publica o que chega ao GitHub, um teste falhando também impede que a versão quebrada seja publicada.

Quando o push é cancelado, aparece:

```
Push cancelado: há testes falhando. Corrija e tente de novo.
Para ver detalhes: cd tests && npm run test:relatorio
Para enviar mesmo assim (não recomendado): git push --no-verify
```

Detalhes:

- **Branch nova** (que ainda não existe no GitHub): roda todos os testes.
- **Alterações não commitadas:** os testes rodam sobre os arquivos da pasta, então essas alterações também entram no teste. O hook avisa quando isso acontece.
- **Emergência:** `git push --no-verify` envia sem testar.
- **Ativação:** o `npm install` em `tests/` roda `git config core.hooksPath .githooks`. Isso vale por computador, porque a configuração do git não vai junto com o repositório. Em outro computador, basta rodar `npm install` em `tests/` de novo.

## Lista de testes por área

### geral (6)

- carrega sem erros e mostra a interface principal
- barra lateral alterna entre documentos, JSON e atalhos
- Ctrl+Alt+J abre o formatador JSON
- botão de busca abre a paleta de comandos
- rodapé mostra caracteres, cursor, linguagem e quebra de linha
- rodapé esconde dados do documento no formatador JSON

### abas (10)

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

### markdown (44)

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
- formatação funciona com várias linhas selecionadas
- preview renderiza o Markdown ao vivo
- preview remove scripts e eventos perigosos
- links do preview abrem em nova aba
- modos Editor, Dividido e Preview mostram os painéis certos
- usar a barra no modo Preview volta para o modo Dividido
- documento que não é Markdown não mostra preview
- modo de visualização é lembrado depois de recarregar

### visual (34)

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
- sem internet para o editor visual, volta ao modo Dividido e avisa
- documento que não é Markdown não usa o modo Visual

### imagens (16)

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
- imagem embutida aparece no preview

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

### celular (5)

Estes rodam numa tela de 390 × 844 (projeto `celular` no `playwright.config.js`).

- topo fica visível e a barra de ferramentas vai para baixo
- botões do topo mostram só ícones
- nada ultrapassa a largura da tela
- modo dividido empilha editor e preview
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

## Solução de problemas

| Problema | Causa provável | Solução |
| --- | --- | --- |
| Todos os testes falham esperando `window.editor` | Sem internet, ou o CDN fora do ar | Confira a conexão; o Monaco vem do jsDelivr |
| `browserType.launch: Chromium distribution 'msedge' is not found` | Edge não instalado | Instale o Edge ou rode com `NAVEGADOR=chrome` |
| `As dependências dos testes não estão instaladas` | Falta `npm install` | `cd tests && npm install` |
| O push não roda os testes | Hook não ativado neste computador | `git config core.hooksPath .githooks` |
| Erro `\r: command not found` no push | O hook ficou com quebras de linha do Windows | O `.gitattributes` evita isso; se acontecer, rode `git checkout -- .githooks/pre-push` |
| Porta 4173 em uso | Outro programa usando a porta | Feche o programa ou mude `porta` no `playwright.config.js` |
| Teste de copiar falha raramente | A área de transferência é do sistema inteiro | Rode de novo; evite copiar algo enquanto os testes rodam |

## Limitações

- **Arquivos reais não são testados.** A gravação em disco usa a API simulada. O comportamento das janelas nativas do Windows e das permissões do navegador precisa ser conferido à mão.
- **A aparência não é comparada pixel a pixel.** Os testes conferem estrutura, textos, posições e tamanhos, mas não pegam, por exemplo, uma cor errada.
- **Só Edge (Chromium).** Firefox e Safari não são testados automaticamente.
- **A escolha da área é por palavras-chave.** Funciona bem para o código atual. Se uma função nova tiver um nome que não diz a área, adicione-a em `funcoesConhecidas` no `alterados.js`.
