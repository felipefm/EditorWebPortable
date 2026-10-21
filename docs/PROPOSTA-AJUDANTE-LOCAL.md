# Proposta: ajudante local para salvar arquivos em qualquer navegador

> **Status:** em avaliação. Nada foi implementado.
> **Ponto contra já levantado:** exige um programa rodando no computador enquanto o editor é usado.

## Sumário

- [O problema](#o-problema)
- [Por que o editor sozinho não resolve](#por-que-o-editor-sozinho-não-resolve)
- [A proposta](#a-proposta)
- [Segurança](#segurança)
- [Como o editor muda](#como-o-editor-muda)
- [Como o ajudante é iniciado](#como-o-ajudante-é-iniciado)
- [Instalação e outras máquinas](#instalação-e-outras-máquinas)
- [Comunicação entre editor e ajudante](#comunicação-entre-editor-e-ajudante)
- [Testes](#testes)
- [Esforço estimado](#esforço-estimado)
- [Limitações e riscos](#limitações-e-riscos)
- [Alternativas consideradas](#alternativas-consideradas)
- [Decisões em aberto](#decisões-em-aberto)

## O problema

No Firefox e nos navegadores derivados dele (Zen, LibreWolf), no Safari e nos navegadores de celular, o editor não consegue gravar no arquivo original. O botão vira **Baixar** e cada salvamento gera uma cópia na pasta de downloads.

O objetivo é abrir e salvar **direto nos arquivos do computador** também nesses navegadores.

## Por que o editor sozinho não resolve

Gravar num arquivo do computador exige a [File System Access API](https://developer.mozilla.org/docs/Web/API/Window/showSaveFilePicker), que só os navegadores baseados no Chromium (Chrome, Edge, Opera) oferecem. A Mozilla decidiu não implementá-la, por segurança, e não há configuração que a ative.

Nenhum site consegue contornar isso sozinho. Os projetos que parecem fazer isso no Firefox têm um programa local por trás:

| Projeto | Como grava no Firefox |
| --- | --- |
| [FrankMD](https://github.com/akitaonrails/FrankMD) | Servidor Ruby on Rails rodando no Docker (`-p 7591:80 -v ~/notes:/rails/notes`). O servidor lê e grava os `.md` |
| VS Code web (vscode.dev) | Não grava. No Firefox, não abre pastas locais. No Chrome e no Edge, usa a mesma API do nosso editor |
| VS Code Remote Tunnels | Programa `code tunnel` rodando no computador |

## A proposta

Um programa pequeno, o **ajudante**, roda no computador e faz a leitura e a gravação no lugar do navegador. O editor continua sendo o mesmo site no Cloudflare. Quando encontra o ajudante, passa a usá-lo.

```
Navegador (qualquer um)                     Seu computador
┌────────────────────────────┐              ┌──────────────────────────────┐
│ editorportable...workers.dev│  HTTP local │ ajudante                     │
│                            │ ───────────▶ │  - escuta só em 127.0.0.1    │
│ "Salvar notas.md"          │   + senha    │  - confere origem e senha    │
│                            │ ◀─────────── │  - grava em C:\...\Notas\    │
└────────────────────────────┘    "ok"      └──────────────────────────────┘
                                                        │
                                                        ▼
                                            Pasta liberada (ex.: Documentos\Notas)
```

É o mesmo princípio do FrankMD, mas bem mais leve: sem Docker, sem banco de dados, sem servir a interface. O ajudante só lê e grava arquivos.

## Segurança

O ajudante teria mais permissão que o site, então as proteções são a parte mais importante da proposta.

| Risco | Proteção |
| --- | --- |
| Alguém na rede ou na internet acessar o ajudante | Escuta apenas em `127.0.0.1`: só o próprio computador consegue conectar |
| Outro site aberto no navegador tentar usar o ajudante | Aceita só pedidos com `Origin` igual ao endereço do editor (e ao `localhost` dos testes). Os demais são recusados, inclusive na verificação prévia de CORS |
| Um programa local qualquer chamar o ajudante | Exige uma **senha** gerada na instalação, enviada em todo pedido. O editor guarda a senha depois que você a cola uma vez |
| Gravar fora da pasta liberada (`../../Windows/...`) | Todo caminho é resolvido e conferido contra a pasta raiz. Caminhos absolutos, `..` e links simbólicos que apontem para fora são recusados |
| Apagar ou sobrescrever arquivos importantes | Só existem as operações listar, ler e gravar. Não há apagar, mover nem executar. Antes de sobrescrever, guarda uma cópia `.bak` (opcional) |
| Arquivos enormes travarem o computador | Limite de tamanho por arquivo (por exemplo, 10 MB) |
| Executar comandos | O ajudante não executa nada: só lê e grava texto |

Detalhes técnicos:

- **CORS e Private Network Access:** o Chrome e o Edge exigem o cabeçalho `Access-Control-Allow-Private-Network: true` para um site HTTPS acessar `127.0.0.1`. O ajudante responderia isso só para a origem permitida.
- **Conteúdo misto:** os navegadores aceitam um site HTTPS chamando `http://127.0.0.1`, porque o endereço local é tratado como confiável. Não é preciso certificado.
- **Senha:** 32 bytes aleatórios, comparados em tempo constante, guardados num arquivo de configuração na pasta do usuário.

## Como o editor muda

O editor escolheria o modo de salvamento por ordem de prioridade:

| Situação | Modo usado |
| --- | --- |
| Ajudante encontrado e com senha configurada | **Ajudante:** abre e salva nos arquivos da pasta liberada, em qualquer navegador |
| Sem ajudante, Chrome, Edge ou Opera | **Gravação direta** pela API do navegador (como hoje) |
| Sem ajudante, Firefox, Zen, Safari ou celular | **Baixar** (como hoje) |

Mudanças previstas:

- **Detecção:** ao abrir, o editor faz `GET http://127.0.0.1:<porta>/status` com tempo limite curto. Se não houver resposta, segue como hoje, sem mensagem de erro.
- **Painel de arquivos:** sem a API, não existe a janela "Abrir" do sistema. O editor ganharia um painel na barra lateral listando as pastas e os arquivos da pasta liberada, para abrir com um clique e salvar em qualquer subpasta.
- **Indicador:** o botão de backup do topo mostraria também "Ajudante conectado".
- **Configuração:** na primeira conexão, o editor pede a senha mostrada pelo ajudante e a guarda neste navegador.
- **Documentos abertos pelo ajudante** guardam o caminho relativo (`projetos/notas.md`) em vez do manipulador da API, e esse caminho também é restaurado com a sessão.

## Como o ajudante é iniciado

Um site não pode iniciar programas no computador, então o ajudante não pode ser ligado pelo editor. Opções:

| Opção | Como funciona | Avaliação |
| --- | --- | --- |
| Iniciar com o Windows | Um atalho na pasta de inicialização liga o ajudante em segundo plano, sem janela | Mais prático: nunca precisa lembrar dele |
| Atalho na área de trabalho | Inicia o ajudante e abre o editor no navegador | Funciona só se o editor for aberto pelo atalho |
| Link especial (`editorportable://iniciar`) | Botão no editor; o navegador pergunta "Abrir este aplicativo?" | Exige alterar o registro do Windows e a pergunta aparece toda vez. Não recomendado |

Parado, o ajudante usa pouca memória (estimativa: 30 a 40 MB, contra cerca de 115 MB do container do FrankMD) e praticamente nenhum processador.

## Instalação e outras máquinas

Formas de distribuir:

| Forma | Precisa de Node.js? | Observação |
| --- | --- | --- |
| Um único `ajudante.exe` (Node.js Single Executable Application) | Não | Cabe num pendrive, combinando com o "Portable" do nome |
| Script `ajudante.js` | Sim | Mais simples de manter |

Primeira execução: escolher a pasta liberada, gerar a senha e, opcionalmente, ativar o início com o Windows.

Em outra máquina:

| Situação | Comportamento |
| --- | --- |
| Ajudante instalado e rodando | Modo ajudante |
| Sem ajudante | O editor funciona como hoje (gravação direta ou Baixar, conforme o navegador) |

O que não vai junto entre máquinas:

- **Os arquivos:** ficam na pasta de cada máquina. O ajudante não sincroniza. Uma solução é deixar a pasta liberada dentro do OneDrive, Google Drive ou Dropbox.
- **A sessão (abas e rascunhos):** continua salva no navegador de cada máquina. Para levar, use Exportar e Importar sessão.
- **A senha:** cada instalação tem a sua, e o editor pede a senha na primeira conexão em cada navegador.

## Comunicação entre editor e ajudante

Rascunho dos pedidos HTTP. Todos exigem o cabeçalho `Authorization: Bearer <senha>`, exceto `/status`.

| Pedido | Para quê | Resposta |
| --- | --- | --- |
| `GET /status` | Detectar o ajudante | `{ "versao": "1.0", "pasta": "Notas" }` (sem o caminho completo) |
| `GET /arquivos?caminho=projetos` | Listar uma pasta | `[{ "nome": "notas.md", "tipo": "arquivo", "tamanho": 1234, "modificado": "..." }]` |
| `GET /arquivo?caminho=projetos/notas.md` | Ler um arquivo | Conteúdo em texto, com `ETag` |
| `PUT /arquivo?caminho=projetos/notas.md` | Gravar um arquivo | `{ "ok": true }`. Com `If-Match`, recusa (409) se o arquivo mudou fora do editor |

O `If-Match` evita sobrescrever alterações feitas por outro programa enquanto o arquivo estava aberto no editor. Nesse caso, o editor perguntaria se quer sobrescrever ou recarregar.

## Testes

- **Ajudante:** testes do próprio servidor, como recusar origem errada, senha errada e caminhos fora da pasta (`..`, absolutos, links simbólicos), respeitar o limite de tamanho e o conflito por `If-Match`.
- **Editor:** uma nova área `ajudante` em `tests/`, com o ajudante rodando apontado para uma pasta temporária. Ela cobriria detecção, painel de arquivos, abrir, salvar, conflito e ausência do ajudante, que deve cair no comportamento atual.
- O `tests/alterados.js` ganharia a regra da nova área.

## Esforço estimado

| Parte | Tamanho aproximado |
| --- | --- |
| Ajudante (servidor, segurança, configuração, início automático) | 150 a 200 linhas |
| Editor (detecção, painel de arquivos, modo de salvamento, senha) | 150 a 250 linhas |
| Testes (ajudante e editor) | 200 a 300 linhas |
| Empacotamento como `.exe` e documentação | pequeno |

## Limitações e riscos

- **Precisa de algo rodando no computador.** É o ponto central da proposta e a principal objeção.
- **Não funciona no celular.** Celulares não rodam o ajudante; lá continua o modo Baixar.
- **Superfície de ataque nova.** Mesmo com as proteções, é um programa local com acesso a uma pasta. Erros no código de segurança teriam impacto real, e por isso os testes de segurança são obrigatórios.
- **Antivírus e firewall** podem questionar um `.exe` novo e sem assinatura digital.
- **Manutenção:** mais uma peça para atualizar quando o editor mudar a forma de abrir e salvar.

## Alternativas consideradas

| Alternativa | Grava no arquivo original? | Precisa de algo rodando? | Situação |
| --- | --- | --- | --- |
| Usar Edge ou Chrome para editar arquivos | ✅ Em qualquer pasta | ❌ | Funciona hoje, sem mudanças |
| Modo **Baixar** (atual) | ⬇️ Cópia em Downloads | ❌ | Implementado |
| Userscript no Tampermonkey (`GM_download`) | ⚠️ Sobrescreve, mas só dentro de Downloads | ❌ (é uma extensão) | Não testado: falta confirmar a sobrescrita no Firefox |
| Salvar na nuvem (GitHub, OneDrive, Google Drive) | ☁️ Na nuvem; aparece no computador se a pasta estiver sincronizada | ❌ | Exige login no serviço e internet |
| Extensão própria com acesso ao sistema (native messaging) | ✅ | ✅ Programa nativo registrado | Descartada: muito trabalho para o ganho |
| Transformar em programa de computador (Electron, Tauri) | ✅ | ✅ É o próprio programa | Descartada: deixa de ser um editor web |

## Decisões em aberto

1. Seguir com o ajudante, apesar de exigir um programa rodando, ou preferir uma alternativa sem nada local (Tampermonkey ou nuvem)?
2. Distribuição: `.exe` único ou script Node?
3. Início: com o Windows ou por atalho?
4. Uma pasta liberada ou várias?
5. Guardar cópia `.bak` antes de sobrescrever?
