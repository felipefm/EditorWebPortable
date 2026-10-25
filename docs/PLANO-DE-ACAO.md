# Plano de ação

> **Criado em:** 24/10/2026. **Status:** etapa 2 concluída em 25/10/2026; etapa 1 cancelada; etapas 0, 3 e 4 pendentes.

Lista do que falta fazer no editor, em ordem sugerida, com as decisões que precisam ser tomadas antes de cada etapa.

## Sumário

- [Visão geral](#visão-geral)
- [Etapa 0: terminar a publicação pelo GitHub](#etapa-0-terminar-a-publicação-pelo-github)
- [Etapa 1: listas com letras (cancelada)](#etapa-1-listas-com-letras-cancelada)
- [Etapa 2: árvore de pastas no Edge e no Chrome](#etapa-2-árvore-de-pastas-no-edge-e-no-chrome)
- [Etapa 3: ajudante local](#etapa-3-ajudante-local)
- [Etapa 4: banco de dados na nuvem](#etapa-4-banco-de-dados-na-nuvem)
- [Decisões em aberto](#decisões-em-aberto)
- [Já concluído](#já-concluído)

## Visão geral

| Etapa | O que é | Depende de | Tamanho |
| --- | --- | --- | --- |
| 0 | Terminar a publicação pelo GitHub Actions | Ações no GitHub e no Cloudflare | Pequeno |
| 1 | ~~Listas com letras~~ (cancelada) | — | — |
| 2 | ✅ Painel com a árvore de uma pasta do computador (Edge e Chrome), concluído | — | — |
| 3 | Ajudante local, para a árvore e o salvar funcionarem no Zen | Etapa 2 (reaproveita o painel) | Grande |
| 4 | Guardar documentos num banco de dados na nuvem | Decisão sobre o objetivo e a política da empresa | Médio |

A ordem 2 → 3 constrói o painel primeiro onde o navegador já ajuda (Edge e Chrome) e depois leva o mesmo painel para o Zen. Também dá para inverter: fazer o ajudante primeiro, se usar a árvore no Zen for o mais urgente.

## Etapa 0: terminar a publicação pelo GitHub

Os testes já rodam no GitHub a cada push, mas a publicação no Cloudflare falha. O site continua no ar com a última versão publicada antes da mudança.

| # | Tarefa | Quem |
| --- | --- | --- |
| 0.1 | Corrigir o segredo `CLOUDFLARE_API_TOKEN` no GitHub (*Settings → Secrets and variables → Actions*). O log mostra que o GitHub não o encontra. Provavelmente o nome está errado (a primeira tentativa foi `CLOUDFLARE_API_TOKKEN`) | Você |
| 0.2 | Na última rodada que falhou, clicar em **Re-run jobs → Re-run failed jobs** e confirmar que **Publicar no Cloudflare** fica verde | Você |
| 0.3 | Desconectar o Git no Cloudflare (*Workers & Pages → editorportable → Settings → Build → Disconnect*), para só o GitHub publicar, e só depois dos testes | Você |
| 0.4 | Apagar o token antigo "editorportable build token" no Cloudflare, que deixa de ser usado | Você |
| 0.5 | Atualizar as versões das ações do workflow, para tirar o aviso "Node.js 20 is deprecated" | Claude |
| 0.6 | Fazer o push dos commits que estão só no computador e conferir que o site atualiza | Claude |

## Etapa 1: listas com letras (cancelada)

**Pedido:** listas com letras (a., b., c.) no modo Visual, como mais uma opção além da numerada.

**Decisão do usuário (25/10/2026):** cancelada. O Markdown padrão não tem lista com letras, e todas as formas de gravar isso no arquivo (letras no texto, comentário oculto ou HTML) bagunçam o Markdown ou quebram em outros programas. As listas continuam só com números, em todos os níveis.

## Etapa 2: árvore de pastas no Edge e no Chrome

> **Concluída em 25/10/2026.** Implementada como descrito abaixo, com 33 testes na área `pastas`. Diferenças do plano: os botões do topo criam na pasta aberta até a pessoa escolher um item na árvore, arquivos que não são texto (imagens, PDFs) não abrem, e o menu também abre com `Shift+F10`. Detalhes no README, em "Painel de pastas".

**Pedido:** abrir uma pasta do computador e ver os arquivos numa árvore ao lado esquerdo, nos modos Editor, Dividido e Visual. Pela árvore, abrir, criar, renomear e excluir arquivos e pastas, como no Notepad++ e no Sublime Text.

No Edge e no Chrome, o próprio navegador permite isso (`showDirectoryPicker`), sem nada instalado. É o mesmo recurso que o VS Code web usa.

### Como funcionaria

- **Abrir o painel:** um botão novo na barra lateral (ícone de pasta) mostra ou esconde o painel. A escolha fica lembrada.
- **Abrir uma pasta:** o botão **Abrir pasta** no painel. O navegador pede permissão para a pasta.
- **A árvore:**
  - pastas expandem e recolhem, e a ordem é pastas primeiro, depois arquivos, em ordem alfabética
  - o ícone de cada arquivo depende do tipo (`.md`, `.js`, `.json`...)
  - o arquivo aberto na aba atual fica destacado
- **Clique num arquivo:** abre numa aba. Se já estiver aberto, só muda para a aba dele. Salvar grava direto no arquivo.
- **Ações no topo do painel:** novo arquivo, nova pasta, atualizar e recolher tudo.
- **Ações por item** (clique com o botão direito ou botão "⋯"): renomear, excluir, novo arquivo aqui e nova pasta aqui.
- **Excluir:** pede confirmação. Se o arquivo estiver aberto e com alterações não salvas, avisa antes.
- **Renomear:** atualiza o nome da aba se o arquivo estiver aberto.
- **Reabrir o editor:** a pasta volta sozinha. O navegador pode pedir para confirmar a permissão com um clique.
- **Celular:** o painel fica escondido. O celular não oferece esse recurso.
- **Zen e Firefox:** o botão aparece com a explicação de que é preciso o ajudante (etapa 3).

### Tarefas

1. **HTML e CSS:** o painel redimensionável entre a barra lateral e o editor, a árvore, o menu de contexto e os estados vazio e sem permissão.
2. **Modelo da árvore:** ler a pasta sob demanda, ao expandir, para não travar com pastas grandes, e ignorar `.git` e `node_modules`.
3. **Operações:** abrir, criar, renomear e excluir.
   - **Renomear:** a API não tem renomear para todos os casos. Nesses casos, copia com o nome novo e apaga o antigo.
4. **Integração com as abas:** a aba guarda de qual arquivo da pasta veio. Renomear ou excluir na árvore atualiza a aba.
5. **Sessão:** guardar a pasta aberta e as pastas expandidas, e restaurar ao abrir o editor.
6. **Testes:** uma área nova, `pastas`.
   - Usa uma pasta simulada, como já é feito com os arquivos simulados.
   - Cobre abrir pasta, expandir, abrir arquivo, salvar, criar, renomear, excluir (com e sem alterações abertas), permissão negada, restaurar após recarregar, painel escondido no celular e o aviso no Firefox.
7. **Documentação:** README e `docs/TESTES.md`.

### Riscos

- **Excluir é definitivo nesta API:** não vai para a lixeira do Windows. Por isso a confirmação é obrigatória.
- **Pastas muito grandes** (milhares de arquivos): por isso a leitura é sob demanda.

## Etapa 3: ajudante local

**Pedido:** implementar o ajudante, depois de analisá-lo melhor. Ele é necessário para a árvore de pastas funcionar no Zen, porque o Firefox não deixa um site abrir pastas do computador.

O desenho de segurança está em [PROPOSTA-AJUDANTE-LOCAL.md](PROPOSTA-AJUDANTE-LOCAL.md). Ele precisa de três mudanças para servir à árvore:

| Mudança | Por quê |
| --- | --- |
| Novas operações: criar pasta, renomear e excluir | A proposta original só listava, lia e gravava |
| Excluir **move para uma pasta `.lixeira`** dentro da pasta liberada, em vez de apagar | Diminui o estrago de um erro ou de um uso indevido |
| O painel da etapa 2 passa a ter duas fontes de arquivos: o navegador (Edge e Chrome) ou o ajudante (qualquer navegador) | A interface é a mesma; só muda quem lê e grava |

### Tarefas

1. **Ajudante:**
   - servidor só em `127.0.0.1`, com conferência de origem e senha
   - caminhos presos à pasta liberada
   - operações listar, ler, gravar (com conflito por `If-Match`), criar, renomear e mover para `.lixeira`
2. **Configuração inicial:** escolher a pasta liberada e gerar a senha.
3. **Forma de iniciar:** conforme a decisão abaixo.
4. **Editor:** detectar o ajudante, pedir a senha na primeira conexão e usá-lo como fonte do painel de arquivos e do salvar.
5. **Testes do ajudante:**
   - origem errada, senha errada e caminhos fora da pasta (`..`, absolutos, links simbólicos)
   - limite de tamanho, conflito e lixeira
6. **Testes do editor:** a área `pastas` roda também com o ajudante, apontado para uma pasta temporária.
7. **Empacotamento** e documentação.

### Decisões

1. **Formato:** um `ajudante.exe` único, que não precisa de Node.js e cabe num pendrive, ou um script `ajudante.js`, que precisa do Node.js mas é mais simples de manter?
2. **Início:** com o Windows, sem janela, ou por atalho, que inicia o ajudante e abre o editor?
3. **Pastas:** uma pasta liberada ou várias?
4. **Cópia de segurança:** guardar uma `.bak` antes de sobrescrever?

### Pontos de atenção

- **É um programa rodando no computador:** em 21/10 essa foi a objeção principal. O editor continua funcionando sem ele.
- **Antivírus:** pode questionar um `.exe` novo sem assinatura digital.
- **Computador do trabalho:** instalar programas pode exigir autorização da S.I.

## Etapa 4: banco de dados na nuvem

**Pedido:** verificar se dá para guardar os documentos num banco de dados, como a Vercel oferece, sem sofrer bloqueio da S.I. Se for complicado, deixar para lá.

**Avaliação:** é viável e de complexidade média. A recomendação é o **Cloudflare**, não a Vercel:

| | Cloudflare (D1 ou KV) | Vercel (Postgres ou KV, pelo Marketplace) |
| --- | --- | --- |
| Onde o site está | Já está aqui | Outro serviço e outra conta |
| Plano gratuito | Generoso para uso pessoal | Existe, mas por parceiros (Neon, Upstash) |
| Login | **Cloudflare Access**: gratuito, código por e-mail, sem programar senha | Precisaria programar ou contratar |
| Mudança no projeto | O Worker ganha uma rota `/api` além dos arquivos | Segundo backend, com CORS entre domínios |

**Sobre a S.I.:** há dois riscos diferentes.

- **Bloqueio de acesso:** algumas empresas bloqueiam domínios como `*.workers.dev`. Um domínio próprio costuma resolver.
- **Política de dados:** é o risco real. Guardar conteúdo de trabalho numa nuvem pessoal pode ir contra a política da empresa, mesmo que tecnicamente funcione. Vale confirmar com a S.I. antes de usar com documentos de trabalho.

**Tarefas, se seguir:**

1. Criar o banco D1 e a tabela de documentos: id, nome, conteúdo, data e versão.
2. Proteger a rota `/api` com o Cloudflare Access, só para o seu e-mail.
3. API: listar, ler, salvar (com conflito de versão) e excluir.
4. **Editor:** opção "Salvar na nuvem" e uma lista "Documentos na nuvem" para abrir. Se a etapa 2 existir, a nuvem pode aparecer como mais uma pasta na árvore.
5. Testes com um banco local (`wrangler dev`) e documentação.

**Decisões:**

1. **Objetivo:** ter os mesmos documentos em casa e no trabalho? Ou só uma cópia de segurança?
2. **S.I.:** há permissão para conteúdo de trabalho? Se não houver, usar só com documentos pessoais.
3. **Domínio:** usar um domínio próprio, para evitar bloqueio do `workers.dev`?

## Decisões em aberto

Resumo do que precisa ser respondido antes de começar:

| Etapa | Pergunta |
| --- | --- |
| Ordem | Fazer a árvore no Edge e no Chrome primeiro (etapa 2) ou o ajudante primeiro (etapa 3)? |
| 3 | `.exe` ou script? Iniciar com o Windows ou por atalho? Uma pasta ou várias? Guardar `.bak`? |
| 4 | Qual o objetivo do banco? A S.I. permite conteúdo de trabalho? Usar domínio próprio? |

## Já concluído

- **Etapa 2, painel de pastas** (25/10/2026): árvore no Edge e no Chrome, com abrir, criar, renomear, excluir, teclado, sessão e aviso no Zen e no Firefox.

Itens da mesma lista de pedidos, implementados e testados em 24/10/2026 (commit `b8fbca2`):

- **Listas no Markdown padrão:**
  - listas do arquivo continuam idênticas depois de editar no Visual
  - sublista criada com Tab não ganha mais linha em branco
  - `1)` não vira mais `1.`
  - a linha vazia continua como `<br />`, como no Typora, por escolha do usuário
- **Fechamento automático no Visual:** `(`, `[` e `{` fecham sozinhos, como no modo Editor.
- **Documento novo:** abre em Markdown, no modo Visual.
- **Linha horizontal:** mais visível, sólida e com 2 px, no Visual e no Preview.

Limitação conhecida, sem correção prevista: se a próxima tecla vier em menos de ~20 ms depois de um Tab ou de `1. `, o Milkdown embaralha as letras. Isso não acontece na digitação humana.
