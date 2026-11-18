# Ideias para o futuro

Recursos avaliados em 2026-11-18, inspirados no Mem 2.0. Ainda **não foram decididos**: podem ser feitos, mudar ou ser descartados. A ordem é a sugerida, do mais simples ao mais pesado.

## 1. Busca avançada nos arquivos

- Painel **Buscar nos arquivos** (`Ctrl+Shift+F`), que procura em todos os arquivos da pasta aberta, não só nas abas.
- Ignora acentos e maiúsculas: "acao" encontra "Ação".
- Filtros que podem ser combinados:
  - `site:instagram.com` ou `tem:link`: notas com links (de uma rede social ou qualquer link)
  - `data:2026-11` ou `data:15/11`: datas escritas dentro do texto, em vários formatos
  - `modificado:>2026-10-01`: pela data do arquivo
  - `@Maria` ou `pessoa:Maria`: nomes de pessoas (via `@nome` ou uma lista de nomes cadastrados)
  - `pasta:projetos` e `tipo:md`
- Cada resultado mostra o trecho com a palavra destacada. Clicar abre a aba já na linha certa.
- No Edge, o navegador lê os arquivos. No homelab, o servidor faz a busca (mais rápido, e funciona no Zen).

## 2. Coleções

- Uma coleção é um grupo de notas que não depende das pastas. A mesma nota pode estar em várias coleções.
- Painel na barra lateral com criar, renomear, excluir, juntar duas coleções e escolher uma cor.
- Adicionar uma nota: botão direito na aba ou na árvore, depois **Adicionar à coleção**, ou arrastar da árvore.
- Quando um arquivo é movido ou renomeado, a coleção acompanha, como as abas.
- A busca ganharia o filtro `coleção:Nome`.
- Onde ficam guardadas: na sessão (backup e Exportar) e, no homelab, em `.editor/colecoes.json`.

## 3. Captura da web

O editor é uma página, não uma extensão, então não consegue pegar o conteúdo de outra aba sozinho.

1. **Colar como Markdown:** HTML copiado de um site vira Markdown limpo, com a fonte e a data no final (biblioteca Turndown em `public/vendor`).
2. **Bookmarklet "Capturar":** um clique num site copia a seleção (ou o artigo) com título, endereço e data, pronta para colar.
3. Mais tarde: no homelab, gravar a captura direto em `Capturas/`. Isso exige afrouxar a regra que hoje só aceita pedidos vindos do próprio editor, então precisa ser analisado com cuidado.

## 4. Busca por significado (embeddings)

Encontrar notas pelo sentido, e não pelas palavras exatas ("reunião sobre orçamento" acha "custos do trimestre"), e sugerir **notas parecidas** com a aberta.

| Opção | Funciona em | Problema |
|---|---|---|
| **A. Ollama no homelab** (modelo `bge-m3`, que entende português) | Homelab, qualquer navegador | Exige instalar o Ollama no CasaOS |
| B. Dentro do navegador (transformers.js) | Edge e homelab | Modelo de cerca de 120 MB: não cabe no Cloudflare (limite de 25 MB por arquivo) e fica lento em pastas grandes |
| C. API externa (OpenAI, Voyage etc.) | Todos | Envia as notas para fora, o que quebra a regra "nada sai do seu navegador" |

Recomendação: **A**. O servidor do homelab indexa a pasta em segundo plano e só reindexa o que mudou. Na versão Cloudflare, o recurso não apareceria.
