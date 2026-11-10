# Histórico de versões

Cada versão tem uma tag no git (`v1.7.0`, por exemplo) e o número aparece no rodapé do editor.
Assim dá para ver se o Cloudflare e o homelab estão na mesma versão.

Numeração: `MAIOR.MENOR.CORREÇÃO`.
- **MENOR** sobe quando entra um recurso novo.
- **CORREÇÃO** sobe quando só há correções ou atualizações de bibliotecas.
- **MAIOR** sobe se algo deixar de funcionar como antes (por exemplo, uma sessão antiga que não abre mais).

As versões de 1.0.0 a 1.6.1 foram reconstruídas em 2026-11-10 a partir do histórico do git.

## 1.7.0 — 2026-11-10

- Formatador JSON: a divisão entre entrada e resultado pode ser arrastada (ou ajustada com as setas). O duplo clique volta ao meio, e a largura fica salva no navegador.
- Número da versão no rodapé, tags no git e este histórico.

## 1.6.1 — 2026-10-30

- Todas as bibliotecas (Monaco, marked, DOMPurify, Milkdown) passam a vir de `public/vendor`, em versões fixas. Antes vinham de CDNs, e o modo Visual parou de carregar duas vezes por falha do esm.sh.
- DOMPurify atualizado para 3.4.17, com correções de segurança (XSS).

## 1.6.0 — 2026-10-30

- Painel de **textos rápidos**: trechos que você cola muitas vezes por dia. Cada um pode ser copiado ou inserido no cursor, ter uma abreviação expandida com Tab e um atalho Alt+1 a 9. Aceita `{data}`, `{hora}` e `{cursor}`.

## 1.5.0 — 2026-10-28

- Mover arquivos e pastas na árvore: arrastando, ou com Recortar/Colar aqui (Ctrl+X / Ctrl+V). As abas abertas acompanham o arquivo movido.
- Imagens coladas ou soltas num documento Markdown são incorporadas ao texto (reduzidas a 1600 px), em vez de ficar com um endereço `blob:` que se perdia ao recarregar.

## 1.4.0 — 2026-10-26

- **Versão homelab**: o editor e uma pasta do servidor rodando em Docker (porta 8887). O painel de pastas funciona em qualquer navegador, inclusive no Zen. Itens excluídos vão para a lixeira, há cópias ao gravar por cima, e o editor avisa quando o arquivo foi alterado em outro aparelho.
- No celular, o painel de pastas da versão homelab abre por cima do editor.
- Modo Visual: o texto não pula mais ao clicar e selecionar.
- Correção: o modo Visual voltou a carregar depois que o esm.sh passou a servir uma versão inexistente do CodeMirror.

## 1.3.0 — 2026-10-25

- **Painel de pastas** (Chrome e Edge): abrir uma pasta do computador e navegar numa árvore ao lado do editor. Abre arquivos em abas, cria, renomeia e exclui arquivos e pastas. Tem menu de contexto e navegação pelo teclado, e a pasta volta ao recarregar.

## 1.2.0 — 2026-10-24

- Modo Visual: listas novas ficam compactas (sem linha em branco entre os itens), e parênteses, colchetes e chaves se fecham sozinhos.
- Documentos novos abrem no modo Visual quando ele está em uso.

## 1.1.0 — 2026-10-21

- **Modo Visual** para editar Markdown já formatado, com o Milkdown.
- Botão e diálogo **Imagem**: inserir por link ou por arquivo (reduzida e incorporada ao texto).
- **Minimapa** nos modos Editor, Dividido e Visual, com botão no rodapé.
- Os atalhos gerais (salvar, abrir, nova aba, JSON) funcionam com o foco em qualquer lugar e em qualquer modo.
- O cursor vai direto para o editor Visual ao criar ou trocar de aba.
- Correção: o Firefox perdia as últimas edições ao recarregar.
- Os testes e a publicação no Cloudflare passam a rodar no GitHub Actions.

## 1.0.0 — 2026-10-20

Primeira versão publicada.

- Editor Monaco com abas, paleta de comandos (F1) e realce para JavaScript, TypeScript, HTML, CSS, JSON, Markdown e texto puro.
- Abrir e salvar arquivos locais. No Firefox, Zen e celulares, o botão vira **Baixar**.
- Preview de Markdown ao vivo (Editor, Dividido e Preview), com barra e atalhos de formatação, incluindo linha horizontal.
- Formatador JSON com formatação automática, compactação e posição do erro.
- Sessão salva no navegador, backup automático em arquivo, exportar e importar sessão.
- Testes automatizados divididos por área.
