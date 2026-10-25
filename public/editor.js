(function () {
            const caminhoBaseMonaco = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs';
            const chaveConteudo = 'meu-editor-web-conteudo';
            const chaveNomeArquivo = 'meu-editor-web-nome-arquivo';
            const chaveSessaoLocal = 'meu-editor-web-sessao-v2';
            const nomeBancoSessao = 'meu-editor-web';
            const nomeArmazenamentoSessao = 'sessao';
            const conteudoInicial = '// Digite seu texto ou código aqui...\n// O conteúdo é salvo neste navegador.';
            const estado = document.getElementById('estado');
            const indicadorDocumento = document.getElementById('indicador-documento');
            const statusCursor = document.getElementById('status-cursor');
            const statusCaracteres = document.getElementById('status-caracteres');
            const statusEol = document.getElementById('status-eol');
            const falha = document.getElementById('falha');
            const areaDocumentos = document.getElementById('area-documentos');
            const editorPaineis = document.getElementById('editor-paineis');
            const container = document.getElementById('container');
            const previewConteudo = document.getElementById('preview-conteudo');
            const barraMarkdown = document.getElementById('barra-markdown');
            const ferramentasMarkdown = document.getElementById('ferramentas-markdown');
            const editorVisual = document.getElementById('editor-visual');
            const carregandoVisual = document.getElementById('visual-carregando');
            const botaoMapa = document.getElementById('alternar-mapa');
            const mapaVisual = document.getElementById('mapa-visual');
            const telaMapaVisual = document.getElementById('mapa-visual-tela');
            const janelaMapaVisual = document.getElementById('mapa-visual-janela');
            const chaveMapa = 'meu-editor-web-minimapa';
            // No celular o minimapa ocupa espaço demais; fica sempre desligado.
            const telaEstreita = window.matchMedia('(max-width: 640px)');
            const versaoMilkdown = '7.22.2';
            const botaoInserirImagem = document.getElementById('inserir-imagem');
            const dialogoImagem = document.getElementById('dialogo-imagem');
            const formularioImagem = document.getElementById('formulario-imagem');
            const campoLinkImagem = document.getElementById('imagem-link');
            const campoArquivoImagem = document.getElementById('imagem-arquivo');
            const campoDescricaoImagem = document.getElementById('imagem-descricao');
            const erroImagem = document.getElementById('imagem-erro');
            const botaoConfirmarImagem = document.getElementById('imagem-confirmar');
            const botoesModoVisualizacao = Array.from(document.querySelectorAll('#modo-visualizacao button'));
            const abas = document.getElementById('abas');
            const linguagem = document.getElementById('linguagem');
            const botaoAbrir = document.getElementById('abrir');
            const botaoNovo = document.getElementById('novo');
            const botaoNovaAba = document.getElementById('nova-aba');
            const botaoSalvar = document.getElementById('salvar');
            const botaoSalvarComo = document.getElementById('salvar-como');
            const botaoAbrirPaleta = document.getElementById('abrir-paleta');
            const seletorArquivo = document.getElementById('seletor-arquivo');
            const botaoTrilhoDocumentos = document.getElementById('trilho-documentos');
            const botaoTrilhoJson = document.getElementById('trilho-json');
            const botaoTrilhoAtalhos = document.getElementById('trilho-atalhos');
            const botaoUsarJsonAtual = document.getElementById('usar-json-atual');
            const botaoFormatarJson = document.getElementById('formatar-json');
            const botaoCompactarJson = document.getElementById('compactar-json');
            const botaoCopiarJson = document.getElementById('copiar-json');
            const botaoJsonNovaAba = document.getElementById('json-nova-aba');
            const seletorIndentacaoJson = document.getElementById('indentacao-json');
            const formatadorJson = document.getElementById('formatador-json');
            const elementoEntradaJson = document.getElementById('json-entrada');
            const elementoSaidaJson = document.getElementById('json-saida');
            const situacaoJson = document.getElementById('json-situacao');
            const erroJson = document.getElementById('json-erro');
            const erroJsonTexto = document.getElementById('json-erro-texto');
            const botaoIrErroJson = document.getElementById('ir-erro-json');
            const vazioJson = document.getElementById('json-vazio');
            const botaoSessao = document.getElementById('botao-sessao');
            const rotuloSessao = document.getElementById('rotulo-sessao');
            const painelSessao = document.getElementById('painel-sessao');
            const sessaoAbas = document.getElementById('sessao-abas');
            const statusNavegador = document.getElementById('status-navegador');
            const indicadorBackup = document.getElementById('indicador-backup');
            const botaoExportarSessao = document.getElementById('exportar-sessao');
            const botaoImportarSessao = document.getElementById('importar-sessao');
            const botaoConfigurarBackup = document.getElementById('configurar-backup');
            const statusBackup = document.getElementById('status-backup');
            const seletorSessao = document.getElementById('seletor-sessao');
            const botaoVoltarEditorMarkdown = document.getElementById('voltar-editor-markdown');
            const atalhosMarkdown = document.getElementById('atalhos-markdown');
            const dialogoConfirmacao = document.getElementById('dialogo-confirmacao');
            const dialogoMensagem = document.getElementById('dialogo-mensagem');
            const dialogoConfirmar = document.getElementById('dialogo-confirmar');
            const avisoArquivos = document.getElementById('aviso-arquivos');
            const botaoFecharAvisoArquivos = document.getElementById('fechar-aviso-arquivos');
            const chaveAvisoArquivos = 'meu-editor-web-aviso-arquivos';
            // Chrome, Edge e Opera no computador gravam direto no arquivo; os demais só baixam cópias.
            const gravacaoDiretaDisponivel = typeof window.showSaveFilePicker === 'function';
            const botaoTrilhoPastas = document.getElementById('trilho-pastas');
            const painelPastas = document.getElementById('painel-pastas');
            const alcaPainelPastas = document.getElementById('painel-pastas-alca');
            const tituloPastas = document.getElementById('pastas-titulo');
            const acoesPastas = document.getElementById('pastas-acoes');
            const semSuportePastas = document.getElementById('pastas-sem-suporte');
            const vazioPastas = document.getElementById('pastas-vazio');
            const permissaoPastas = document.getElementById('pastas-permissao');
            const textoPermissaoPastas = document.getElementById('pastas-permissao-texto');
            const senhaPastas = document.getElementById('pastas-senha');
            const arvorePastas = document.getElementById('arvore-pastas');
            const erroPastas = document.getElementById('pastas-erro');
            const menuPastas = document.getElementById('menu-pastas');
            const chavePainelPastas = 'meu-editor-web-painel-pastas';
            // Abrir uma pasta inteira só existe no Chrome e no Edge do computador.
            const aberturaPastaDisponivel = typeof window.showDirectoryPicker === 'function';
            const pastasIgnoradas = ['.git', 'node_modules'];
            const extensoesBinarias = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'ico', 'webp', 'avif', 'tif', 'tiff', 'pdf', 'zip', '7z', 'rar', 'gz', 'tar', 'exe', 'dll', 'msi', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'mp3', 'mp4', 'wav', 'ogg', 'avi', 'mov', 'mkv', 'woff', 'woff2', 'ttf', 'otf', 'eot', 'class', 'jar', 'so', 'bin', 'iso', 'db', 'sqlite'];
            const iconesPastas = {
                seta: '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
                pasta: '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
                pastaAberta: '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17V7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v1"/><path d="M3 17l3-7h15l-3 7a2 2 0 0 1-1.8 1.2H5A2 2 0 0 1 3 17z"/></svg>',
                arquivo: '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg>',
                mais: '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="18" cy="12" r="1"/></svg>'
            };
            const siglasLinguagem = {
                javascript: 'JS',
                typescript: 'TS',
                html: 'HTML',
                css: 'CSS',
                json: '{ }',
                markdown: 'MD',
                plaintext: 'TXT'
            };
            let editor;
            let editorEntradaJson;
            let editorSaidaJson;
            let documentos = [];
            let documentoAtual;
            let proximoIdDocumento = 1;
            let visualizacaoAtual = 'editor';
            let modoPreview = 'dividido';
            let jsonCompacto = false;
            let carregamentoMilkdown;
            const visual = {
                crepe: undefined,
                documento: undefined,
                geracao: 0,
                aplicando: false,
                focarAoMontar: false,
                terminaComQuebra: false,
                ultimoMarkdown: undefined
            };
            let mapaLigado = lerPreferenciaMapa();
            const mapa = {
                formas: [],
                larguraConteudo: 1,
                escala: 1,
                deslocamento: 0,
                temporizador: undefined,
                quadro: undefined,
                arrasto: undefined
            };
            const pastas = {
                ...lerPreferenciasPastas(),
                raiz: undefined,
                permitida: false,
                // Caminho relativo à pasta aberta ("" é a própria pasta) → { caminho, nome, tipo, manipulador, filhos }.
                // "filhos" fica undefined até a pasta ser lida pela primeira vez.
                nos: new Map(),
                expandidas: new Set(),
                focado: undefined,
                // Se a pessoa já clicou ou navegou na árvore. Antes disso, os botões do topo criam na pasta aberta.
                escolhido: false,
                edicao: undefined,
                menu: undefined,
                arrasto: undefined
            };
            // Na versão homelab: { nome, senha, autenticado } da pasta do servidor. Na versão online, undefined.
            let servidorPastas;
            let posicaoErroJson;
            let temporizadorSessao;
            let temporizadorJson;
            let temporizadorBackupAutomatico;
            let manipuladorBackupSessao;
            let ultimoSalvamentoNavegador;
            let backupAutomaticoEmAndamento = false;
            let backupPrecisaAutorizacao = false;
            let filaPersistenciaSessao = Promise.resolve();

            function mostrarFalha(mensagem) {
                estado.textContent = 'Falha ao carregar';
                falha.textContent = mensagem;
                falha.style.display = 'block';
                areaDocumentos.style.display = 'none';
            }

            function formatarHorario(data) {
                return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            }

            function confirmar(mensagem, rotuloConfirmar) {
                if (!dialogoConfirmacao || typeof dialogoConfirmacao.showModal !== 'function') {
                    return Promise.resolve(window.confirm(mensagem));
                }
                dialogoMensagem.textContent = mensagem;
                dialogoConfirmar.textContent = rotuloConfirmar || 'Confirmar';
                dialogoConfirmacao.returnValue = '';
                dialogoConfirmacao.showModal();
                return new Promise(function (resolver) {
                    dialogoConfirmacao.addEventListener('close', function () {
                        resolver(dialogoConfirmacao.returnValue === 'confirmar');
                        if (editor && visualizacaoAtual === 'editor') {
                            focarTexto();
                        }
                    }, { once: true });
                });
            }

            function abrirBancoSessao() {
                return new Promise(function (resolver, rejeitar) {
                    if (!window.indexedDB) {
                        rejeitar(new Error('IndexedDB indisponível'));
                        return;
                    }

                    const requisicao = window.indexedDB.open(nomeBancoSessao, 1);
                    requisicao.onupgradeneeded = function () {
                        if (!requisicao.result.objectStoreNames.contains(nomeArmazenamentoSessao)) {
                            requisicao.result.createObjectStore(nomeArmazenamentoSessao);
                        }
                    };
                    requisicao.onsuccess = function () {
                        resolver(requisicao.result);
                    };
                    requisicao.onerror = function () {
                        rejeitar(requisicao.error || new Error('Não foi possível abrir a memória da sessão'));
                    };
                });
            }

            function lerSessaoIndexedDb() {
                return abrirBancoSessao().then(function (banco) {
                    return new Promise(function (resolver, rejeitar) {
                        const transacao = banco.transaction(nomeArmazenamentoSessao, 'readonly');
                        const requisicao = transacao.objectStore(nomeArmazenamentoSessao).get('atual');
                        requisicao.onsuccess = function () {
                            banco.close();
                            resolver(requisicao.result);
                        };
                        requisicao.onerror = function () {
                            banco.close();
                            rejeitar(requisicao.error || new Error('Não foi possível ler a memória da sessão'));
                        };
                    });
                });
            }

            function gravarSessaoIndexedDb(sessao) {
                return abrirBancoSessao().then(function (banco) {
                    return new Promise(function (resolver, rejeitar) {
                        const transacao = banco.transaction(nomeArmazenamentoSessao, 'readwrite');
                        transacao.objectStore(nomeArmazenamentoSessao).put(sessao, 'atual');
                        transacao.oncomplete = function () {
                            banco.close();
                            resolver();
                        };
                        transacao.onerror = function () {
                            banco.close();
                            rejeitar(transacao.error || new Error('Não foi possível guardar a sessão'));
                        };
                    });
                });
            }

            async function solicitarArmazenamentoPersistente() {
                if (!navigator.storage || typeof navigator.storage.persist !== 'function') {
                    return;
                }
                try {
                    await navigator.storage.persist();
                } catch (erro) {
                    return;
                }
            }

            function criarInstantaneoSessao(incluirManipuladores) {
                sincronizarEditorVisual();
                return {
                    versao: 2,
                    atualizadoEm: Date.now(),
                    documentos: documentos.map(function (documento) {
                        return {
                            id: documento.id,
                            nome: documento.nome,
                            conteudo: documento.modelo.getValue(),
                            linguagem: documento.modelo.getLanguageId(),
                            ehSemTitulo: documento.ehSemTitulo,
                            modificacoesPendentes: documento.modificacoesPendentes,
                            manipulador: incluirManipuladores ? documento.manipulador : undefined,
                            caminhoPasta: documento.caminhoPasta
                        };
                    }),
                    documentoAtualId: documentoAtual ? documentoAtual.id : undefined,
                    visualizacaoAtual: visualizacaoAtual,
                    modoPreview: modoPreview,
                    manipuladorBackupSessao: incluirManipuladores ? manipuladorBackupSessao : undefined,
                    pasta: {
                        aberta: Boolean(pastas.raiz),
                        nome: pastas.raiz ? pastas.raiz.name : undefined,
                        expandidas: Array.from(pastas.expandidas),
                        manipulador: incluirManipuladores ? pastas.raiz : undefined
                    },
                    formatadorJson: {
                        entrada: editorEntradaJson ? editorEntradaJson.getValue() : '',
                        saida: editorSaidaJson ? editorSaidaJson.getValue() : '',
                        indentacao: seletorIndentacaoJson.value
                    }
                };
            }

            function atualizarStatusBackup(mensagem, nivel) {
                const rotulos = {
                    ok: 'Backup ativo',
                    aviso: 'Backup pendente',
                    neutro: 'Salvo no navegador'
                };
                const nivelFinal = rotulos[nivel] ? nivel : 'neutro';
                statusBackup.textContent = mensagem;
                indicadorBackup.className = `sessao-indicador${nivelFinal === 'neutro' ? '' : ` ${nivelFinal}`}`;
                botaoSessao.classList.toggle('ok', nivelFinal === 'ok');
                botaoSessao.classList.toggle('aviso', nivelFinal === 'aviso');
                rotuloSessao.textContent = rotulos[nivelFinal];
                botaoSessao.title = `${rotulos[nivelFinal]}. ${mensagem}`;
                botaoConfigurarBackup.textContent = !manipuladorBackupSessao ? 'Configurar' : (backupPrecisaAutorizacao ? 'Autorizar' : 'Trocar');
            }

            function atualizarPainelSessao() {
                sessaoAbas.textContent = `${documentos.length} ${documentos.length === 1 ? 'aba aberta' : 'abas abertas'}`;
                statusNavegador.textContent = ultimoSalvamentoNavegador
                    ? `Salvo automaticamente às ${formatarHorario(ultimoSalvamentoNavegador)}`
                    : 'Salvo automaticamente';
            }

            function salvarSessaoLocalmente() {
                try {
                    localStorage.setItem(chaveSessaoLocal, JSON.stringify(criarInstantaneoSessao(false)));
                } catch (erro) {
                    return false;
                }
                ultimoSalvamentoNavegador = new Date();
                if (!painelSessao.hidden) {
                    atualizarPainelSessao();
                }
                return true;
            }

            function persistirSessaoIndexedDb() {
                const sessao = criarInstantaneoSessao(true);
                filaPersistenciaSessao = filaPersistenciaSessao
                    .then(function () {
                        return gravarSessaoIndexedDb(sessao);
                    })
                    .catch(function () {
                        salvarSessaoLocalmente();
                    });
            }

            function agendarPersistenciaSessao() {
                salvarSessaoLocalmente();
                window.clearTimeout(temporizadorSessao);
                temporizadorSessao = window.setTimeout(persistirSessaoIndexedDb, 500);
            }

            function lerSessaoLocalmente() {
                try {
                    const sessaoSalva = localStorage.getItem(chaveSessaoLocal);
                    return sessaoSalva ? JSON.parse(sessaoSalva) : undefined;
                } catch (erro) {
                    return undefined;
                }
            }

            function criarSessaoLegada() {
                let conteudoSalvo;
                let nomeSalvo;
                try {
                    conteudoSalvo = localStorage.getItem(chaveConteudo);
                    nomeSalvo = localStorage.getItem(chaveNomeArquivo) || '';
                } catch (erro) {
                    return undefined;
                }
                if (conteudoSalvo === null && !nomeSalvo) {
                    return undefined;
                }
                return {
                    versao: 1,
                    atualizadoEm: 0,
                    documentos: [{
                        id: 1,
                        nome: nomeSalvo || 'Sem título 1',
                        conteudo: conteudoSalvo || '',
                        linguagem: obterLinguagemDoArquivo(nomeSalvo),
                        ehSemTitulo: !nomeSalvo,
                        modificacoesPendentes: false
                    }],
                    documentoAtualId: 1,
                    visualizacaoAtual: 'editor'
                };
            }

            function possuiManipuladorDeArquivo(registro) {
                return Boolean(registro && registro.manipulador && typeof registro.manipulador.getFile === 'function');
            }

            function mesclarManipuladoresDasSessoes(sessaoPrincipal, sessoes) {
                if (!sessaoPrincipal) {
                    return undefined;
                }

                const manipuladoresPorId = new Map();
                let manipuladorBackup = sessaoPrincipal.manipuladorBackupSessao;
                sessoes.forEach(function (sessao) {
                    if (!manipuladorBackup && sessao.manipuladorBackupSessao) {
                        manipuladorBackup = sessao.manipuladorBackupSessao;
                    }
                    sessao.documentos.forEach(function (registro) {
                        if (registro && registro.id !== undefined && possuiManipuladorDeArquivo(registro) && !manipuladoresPorId.has(registro.id)) {
                            manipuladoresPorId.set(registro.id, registro.manipulador);
                        }
                    });
                });

                return {
                    ...sessaoPrincipal,
                    documentos: sessaoPrincipal.documentos.map(function (registro) {
                        if (possuiManipuladorDeArquivo(registro) || !manipuladoresPorId.has(registro.id)) {
                            return registro;
                        }
                        return {
                            ...registro,
                            manipulador: manipuladoresPorId.get(registro.id)
                        };
                    }),
                    manipuladorBackupSessao: manipuladorBackup,
                    pasta: mesclarPastaDasSessoes(sessaoPrincipal.pasta, sessoes)
                };
            }

            // A cópia no localStorage é a mais recente, mas não guarda o acesso à pasta; ele vem do IndexedDB.
            function mesclarPastaDasSessoes(pasta, sessoes) {
                if (!pasta || !pasta.aberta || pasta.manipulador) {
                    return pasta;
                }
                const comManipulador = sessoes.find(function (sessao) {
                    return sessao.pasta && sessao.pasta.manipulador && sessao.pasta.nome === pasta.nome;
                });
                return comManipulador ? { ...pasta, manipulador: comManipulador.pasta.manipulador } : pasta;
            }

            async function obterSessaoPersistida() {
                let sessaoIndexedDb;
                try {
                    sessaoIndexedDb = reviverSessaoServidor(await lerSessaoIndexedDb());
                } catch (erro) {
                    sessaoIndexedDb = undefined;
                }
                const sessaoLocal = lerSessaoLocalmente();
                const sessoes = [sessaoIndexedDb, sessaoLocal, criarSessaoLegada()]
                    .filter(function (sessao) {
                        return sessao && Array.isArray(sessao.documentos) && sessao.documentos.length;
                    })
                    .sort(function (sessaoA, sessaoB) {
                        return (sessaoB.atualizadoEm || 0) - (sessaoA.atualizadoEm || 0);
                    });
                return mesclarManipuladoresDasSessoes(sessoes[0], sessoes);
            }

            function obterLinguagemDoArquivo(nome) {
                const extensao = nome.includes('.') ? nome.split('.').pop().toLowerCase() : '';
                const linguagensPorExtensao = {
                    js: 'javascript',
                    mjs: 'javascript',
                    cjs: 'javascript',
                    ts: 'typescript',
                    html: 'html',
                    htm: 'html',
                    css: 'css',
                    json: 'json',
                    md: 'markdown',
                    markdown: 'markdown',
                    txt: 'plaintext'
                };
                return linguagensPorExtensao[extensao] || 'plaintext';
            }

            function obterLinguagemDisponivel(valor) {
                const existe = Array.from(linguagem.options).some(function (opcao) {
                    return opcao.value === valor;
                });
                return existe ? valor : 'plaintext';
            }

            function obterNomeSemTitulo() {
                let indice = 1;
                let nome;
                do {
                    nome = `Sem título ${indice}`;
                    indice += 1;
                } while (documentos.some(function (documento) {
                    return documento.nome === nome;
                }));
                return nome;
            }

            function atualizarRodape() {
                const emDocumento = visualizacaoAtual === 'editor';
                linguagem.hidden = !emDocumento;
                indicadorDocumento.hidden = !emDocumento;
                document.querySelectorAll('.rodape-extra').forEach(function (elemento) {
                    elemento.hidden = !emDocumento;
                });
                if (visualizacaoAtual === 'formatador-json') {
                    const textoJson = editorEntradaJson ? editorEntradaJson.getValue() : '';
                    indicadorDocumento.classList.remove('modificado');
                    statusCaracteres.textContent = `${textoJson.length} caracteres`;
                    statusCursor.textContent = '';
                    statusEol.textContent = '';
                    return;
                }
                const modelo = documentoAtual ? documentoAtual.modelo : undefined;
                indicadorDocumento.classList.toggle('modificado', Boolean(documentoAtual && documentoAtual.modificacoesPendentes));
                statusCaracteres.textContent = `${modelo ? modelo.getValueLength() : 0} caracteres`;
                statusEol.textContent = modelo && modelo.getEOL() === '\r\n' ? 'CRLF' : 'LF';
                const posicao = editor && editor.getPosition();
                statusCursor.textContent = posicao ? `Ln ${posicao.lineNumber}, Col ${posicao.column}` : '';
            }

            function atualizarEstado(mensagem) {
                estado.textContent = mensagem;
                atualizarRodape();
            }

            function atualizarCabecalho() {
                if (visualizacaoAtual === 'formatador-json') {
                    document.title = 'Formatador JSON - Editor Portable';
                    return;
                }
                if (visualizacaoAtual === 'atalhos-markdown') {
                    document.title = 'Atalhos de teclado - Editor Portable';
                    return;
                }
                const nome = documentoAtual ? documentoAtual.nome : '';
                const indicador = documentoAtual && documentoAtual.modificacoesPendentes ? '● ' : '';
                document.title = `${indicador}${nome ? `${nome} - ` : ''}Editor Portable`;
            }

            function atualizarTrilho() {
                [
                    [botaoTrilhoDocumentos, 'editor'],
                    [botaoTrilhoJson, 'formatador-json'],
                    [botaoTrilhoAtalhos, 'atalhos-markdown']
                ].forEach(function ([botao, visualizacao]) {
                    const ativo = visualizacaoAtual === visualizacao;
                    botao.classList.toggle('ativo', ativo);
                    if (ativo) {
                        botao.setAttribute('aria-current', 'page');
                    } else {
                        botao.removeAttribute('aria-current');
                    }
                });
            }

            function atualizarAbas() {
                abas.textContent = '';
                documentos.forEach(function (documento) {
                    const aba = document.createElement('div');
                    const sigla = document.createElement('span');
                    const botaoNome = document.createElement('button');
                    const botaoFechar = document.createElement('button');
                    const idLinguagem = documento.modelo.getLanguageId();
                    const ehAtual = documento === documentoAtual && visualizacaoAtual === 'editor';

                    aba.className = `aba${ehAtual ? ' ativa' : ''}${documento.modificacoesPendentes ? ' modificada' : ''}`;
                    sigla.className = `aba-linguagem ${idLinguagem}`;
                    sigla.textContent = siglasLinguagem[idLinguagem] || 'TXT';
                    sigla.setAttribute('aria-hidden', 'true');
                    botaoNome.className = 'aba-nome';
                    botaoNome.type = 'button';
                    botaoNome.textContent = documento.nome;
                    botaoNome.setAttribute('role', 'tab');
                    botaoNome.setAttribute('aria-selected', ehAtual ? 'true' : 'false');
                    botaoNome.title = documento.modificacoesPendentes ? `${documento.nome} - alterações não salvas` : documento.nome;
                    botaoFechar.className = 'fechar-aba';
                    botaoFechar.type = 'button';
                    botaoFechar.innerHTML = '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
                    botaoFechar.title = documento.modificacoesPendentes ? 'Alterações não salvas. Clique para fechar.' : `Fechar ${documento.nome}`;
                    botaoFechar.setAttribute('aria-label', documento.modificacoesPendentes
                        ? `Fechar ${documento.nome} (alterações não salvas)`
                        : `Fechar ${documento.nome}`);

                    aba.addEventListener('mousedown', function (evento) {
                        if (evento.button === 1) {
                            evento.preventDefault();
                            fecharDocumento(documento);
                        }
                    });
                    botaoNome.addEventListener('click', function () {
                        ativarDocumento(documento);
                    });
                    botaoFechar.addEventListener('click', function (evento) {
                        evento.stopPropagation();
                        fecharDocumento(documento);
                    });

                    aba.appendChild(sigla);
                    aba.appendChild(botaoNome);
                    aba.appendChild(botaoFechar);
                    abas.appendChild(aba);
                });
                const abaAtiva = abas.querySelector('.aba.ativa');
                if (abaAtiva) {
                    const esquerda = abaAtiva.offsetLeft;
                    const direita = esquerda + abaAtiva.offsetWidth;
                    if (esquerda < abas.scrollLeft) {
                        abas.scrollLeft = esquerda;
                    } else if (direita > abas.scrollLeft + abas.clientWidth) {
                        abas.scrollLeft = direita - abas.clientWidth;
                    }
                }
            }

            function atualizarInterfaceDocumento(mensagem) {
                atualizarCabecalho();
                atualizarAbas();
                atualizarTrilho();
                destacarDocumentoNaArvore();
                atualizarPreviewMarkdown();
                if (mensagem) {
                    atualizarEstado(mensagem);
                } else {
                    atualizarRodape();
                }
            }

            function marcarModificacoes(documento, pendentes) {
                if (documento.modificacoesPendentes === pendentes) {
                    return;
                }
                documento.modificacoesPendentes = pendentes;
                atualizarCabecalho();
                atualizarAbas();
                atualizarRodape();
            }

            function definirVisualizacao(visualizacao) {
                visualizacaoAtual = visualizacao;
                areaDocumentos.hidden = visualizacao !== 'editor';
                formatadorJson.classList.toggle('visivel', visualizacao === 'formatador-json');
                atalhosMarkdown.classList.toggle('visivel', visualizacao === 'atalhos-markdown');
                atualizarCabecalho();
                atualizarAbas();
                atualizarTrilho();
            }

            // Põe o cursor no texto do documento atual, pronto para digitar. No modo Visual o Monaco fica
            // escondido, então o foco vai para o Milkdown, esperando a montagem se ele ainda estiver carregando.
            function focarTexto() {
                if (visualizacaoAtual === 'editor' && editorPaineis.classList.contains('modo-visual')) {
                    if (visual.crepe && visual.documento === documentoAtual) {
                        visual.focarAoMontar = false;
                        noVisual(function (ctx, visao) { visao.focus(); });
                    } else {
                        visual.focarAoMontar = true;
                    }
                    return;
                }
                visual.focarAoMontar = false;
                editor.focus();
            }

            function mostrarEditor() {
                definirVisualizacao('editor');
                atualizarPreviewMarkdown();
            }

            function ativarFormatadorJson() {
                definirVisualizacao('formatador-json');
                if (editorEntradaJson && !editorEntradaJson.getValue().trim() && documentoAtual && documentoAtual.modelo.getLanguageId() === 'json') {
                    editorEntradaJson.setValue(documentoAtual.modelo.getValue());
                }
                atualizarEstado('Formatador JSON');
                agendarPersistenciaSessao();
                if (editorEntradaJson) {
                    editorEntradaJson.layout();
                    editorSaidaJson.layout();
                    editorEntradaJson.focus();
                }
            }

            function ativarAtalhosMarkdown() {
                definirVisualizacao('atalhos-markdown');
                atualizarEstado('Atalhos de teclado');
                agendarPersistenciaSessao();
                botaoVoltarEditorMarkdown.focus();
            }

            function definirModoPreview(modo) {
                modoPreview = ['editor', 'dividido', 'preview', 'visual'].includes(modo) ? modo : 'dividido';
                botoesModoVisualizacao.forEach(function (botao) {
                    botao.setAttribute('aria-pressed', botao.dataset.modo === modoPreview ? 'true' : 'false');
                });
            }

            function aplicarModoPreview(modo) {
                definirModoPreview(modo);
                atualizarPreviewMarkdown();
            }

            // Editor visual (Milkdown): carregado do CDN só quando o modo Visual é usado.
            // O texto do Monaco continua sendo a fonte; o visual escreve nele a cada edição.
            function carregarMilkdown() {
                if (!carregamentoMilkdown) {
                    ['lib/theme/common/style.css', 'lib/theme/frame-dark.css'].forEach(function (arquivo) {
                        const link = document.createElement('link');
                        link.rel = 'stylesheet';
                        link.href = `https://cdn.jsdelivr.net/npm/@milkdown/crepe@${versaoMilkdown}/${arquivo}`;
                        document.head.appendChild(link);
                    });
                    const base = `https://esm.sh/@milkdown/kit@${versaoMilkdown}`;
                    carregamentoMilkdown = Promise.all([
                        import(`https://esm.sh/@milkdown/crepe@${versaoMilkdown}`),
                        import(`${base}/core`),
                        import(`${base}/preset/gfm`),
                        import(`${base}/preset/commonmark`),
                        import(`${base}/utils`),
                        import(`${base}/component/link-tooltip`),
                        import(`${base}/prose/transform`),
                        import(`${base}/prose/state`)
                    ]).then(function ([moduloCrepe, moduloCore, moduloGfm, moduloCommonmark, moduloUtils, moduloLink, moduloTransform, moduloEstado]) {
                        return {
                            Crepe: moduloCrepe.Crepe,
                            core: moduloCore,
                            gfm: moduloGfm,
                            commonmark: moduloCommonmark,
                            callCommand: moduloUtils.callCommand,
                            linkTooltipAPI: moduloLink.linkTooltipAPI,
                            transform: moduloTransform,
                            estado: moduloEstado
                        };
                    }).catch(function (erro) {
                        carregamentoMilkdown = undefined;
                        throw erro;
                    });
                }
                return carregamentoMilkdown;
            }

            // Usa o estilo que o documento já tem (- ou * nas listas, _ ou * no itálico, --- ou ***),
            // para que editar no modo Visual não reescreva o arquivo inteiro.
            function detectarEstiloMarkdown(texto) {
                const contar = function (padrao) {
                    return (texto.match(padrao) || []).length;
                };
                return {
                    bullet: contar(/^\s*\*\s+\S/gm) > contar(/^\s*-\s+\S/gm) ? '*' : '-',
                    emphasis: contar(/(^|[^\w*])\*[^*\s][^*\n]*\*(?!\*)/g) > contar(/(^|[^\w_])_[^_\s][^_\n]*_(?!_)/g) ? '*' : '_',
                    rule: contar(/^\s*\*{3,}\s*$/gm) > contar(/^\s*-{3,}\s*$/gm) ? '*' : '-',
                    bulletOrdered: contar(/^\s*\d+\)\s+\S/gm) > contar(/^\s*\d+\.\s+\S/gm) ? ')' : '.'
                };
            }

            function normalizarMarkdownVisual(markdown, terminaComQuebra) {
                const linhas = markdown.replace(/\r\n/g, '\n').split('\n').map(function (linha) {
                    // O Milkdown escreve "| - |" no separador da tabela; o padrão do GitHub é "| --- |".
                    return /^\s*\|(\s*:?-+:?\s*\|)+\s*$/.test(linha)
                        ? linha.replace(/:?-+:?/g, function (celula) {
                            return celula.replace(/-+/, '---');
                        })
                        : linha;
                });
                const resultado = linhas.join('\n').replace(/\n+$/, '');
                return terminaComQuebra ? `${resultado}\n` : resultado;
            }

            function sincronizarEditorVisual() {
                if (!visual.crepe || !visual.documento || visual.documento.modelo.isDisposed()) {
                    return;
                }
                const markdown = normalizarMarkdownVisual(visual.crepe.getMarkdown(), visual.terminaComQuebra);
                if (markdown === visual.ultimoMarkdown) {
                    return;
                }
                visual.ultimoMarkdown = markdown;
                const modelo = visual.documento.modelo;
                if (modelo.getValue().replace(/\r\n/g, '\n') === markdown) {
                    return;
                }
                visual.aplicando = true;
                try {
                    modelo.pushEditOperations([], [{ range: modelo.getFullModelRange(), text: markdown }], function () {
                        return null;
                    });
                } finally {
                    visual.aplicando = false;
                }
            }

            function desmontarEditorVisual(sincronizar) {
                if (sincronizar) {
                    sincronizarEditorVisual();
                }
                visual.geracao += 1;
                if (visual.crepe) {
                    try {
                        visual.crepe.destroy();
                    } catch (erro) {
                        // O editor já pode ter sido destruído; nada a fazer.
                    }
                }
                visual.crepe = undefined;
                visual.modulos = undefined;
                visual.documento = undefined;
                editorVisual.querySelectorAll('.visual-raiz').forEach(function (raiz) {
                    raiz.remove();
                });
            }

            async function montarEditorVisual() {
                const documento = documentoAtual;
                if (visual.documento === documento) {
                    return;
                }
                desmontarEditorVisual(true);
                visual.documento = documento;
                const geracao = visual.geracao;
                carregandoVisual.hidden = false;
                try {
                    const milkdown = await carregarMilkdown();
                    if (geracao !== visual.geracao) {
                        return;
                    }
                    const texto = documento.modelo.getValue().replace(/\r\n/g, '\n');
                    const estilo = detectarEstiloMarkdown(texto);
                    const raiz = document.createElement('div');
                    raiz.className = 'visual-raiz';
                    editorVisual.appendChild(raiz);
                    const crepe = new milkdown.Crepe({
                        root: raiz,
                        defaultValue: texto,
                        // O bloco de imagem do Crepe guarda o tamanho no texto alternativo e perde a
                        // descrição original; as imagens são inseridas pelo botão "Imagem" do editor.
                        features: {
                            [milkdown.Crepe.Feature.Latex]: false,
                            [milkdown.Crepe.Feature.ImageBlock]: false
                        },
                        featureConfigs: {
                            [milkdown.Crepe.Feature.Placeholder]: { text: 'Escreva aqui, ou digite / para inserir um bloco' },
                            [milkdown.Crepe.Feature.BlockEdit]: {
                                buildMenu: function (construtor) {
                                    construtor.getGroup('advanced').addItem('imagem', {
                                        label: 'Imagem',
                                        icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/></svg>',
                                        onRun: function (ctx) {
                                            ctx.get(milkdown.core.commandsCtx).call(milkdown.commonmark.clearTextInCurrentBlockCommand.key);
                                            abrirDialogoImagem();
                                        }
                                    });
                                },
                                textGroup: {
                                    label: 'Texto',
                                    text: { label: 'Parágrafo' },
                                    h1: { label: 'Título 1' },
                                    h2: { label: 'Título 2' },
                                    h3: { label: 'Título 3' },
                                    h4: { label: 'Título 4' },
                                    h5: { label: 'Título 5' },
                                    h6: { label: 'Título 6' },
                                    quote: { label: 'Citação' },
                                    divider: { label: 'Linha horizontal' }
                                },
                                listGroup: {
                                    label: 'Listas',
                                    bulletList: { label: 'Lista com marcadores' },
                                    orderedList: { label: 'Lista numerada' },
                                    taskList: { label: 'Lista de tarefas' }
                                },
                                advancedGroup: {
                                    label: 'Avançado',
                                    image: null,
                                    codeBlock: { label: 'Bloco de código' },
                                    table: { label: 'Tabela' },
                                    math: null
                                }
                            },
                            [milkdown.Crepe.Feature.LinkTooltip]: { inputPlaceholder: 'Cole ou digite um link...' },
                            [milkdown.Crepe.Feature.CodeMirror]: {
                                searchPlaceholder: 'Buscar linguagem',
                                noResultText: 'Nenhuma linguagem encontrada',
                                copyText: 'Copiar',
                                previewLabel: 'Visualização'
                            }
                        }
                    });
                    // No Milkdown, item de lista criado no Visual nasce "espaçado": uma sublista criada com Tab
                    // ganhava uma linha em branco antes, o que deixa a lista inteira espaçada no Markdown.
                    // Itens novos nascem compactos; os lidos do arquivo mantêm o espaçamento que já tinham.
                    // Parte da versão do GFM, que acrescenta o "marcado" das listas de tarefas.
                    crepe.editor.use(milkdown.gfm.extendListItemSchemaForTask.extendSchema(function (anterior) {
                        return function (ctx) {
                            const esquema = anterior(ctx);
                            return { ...esquema, attrs: { ...esquema.attrs, spread: { ...esquema.attrs.spread, default: false } } };
                        };
                    }));
                    crepe.editor.config(function (ctx) {
                        ctx.update(milkdown.core.remarkStringifyOptionsCtx, function (anterior) {
                            return { ...anterior, bullet: estilo.bullet, bulletOrdered: estilo.bulletOrdered, emphasis: estilo.emphasis, rule: estilo.rule, strong: '*' };
                        });
                        ctx.set(milkdown.gfm.remarkGFMPlugin.options.key, { tablePipeAlign: false });
                        ctx.update(milkdown.core.remarkPluginsCtx, function (plugins) {
                            return [...plugins, { plugin: corrigirImagensSemTitulo, options: undefined }];
                        });
                        ctx.update(milkdown.core.prosePluginsCtx, function (plugins) {
                            return [...plugins, criarPluginEnvolverSelecao(milkdown), criarPluginFecharPares(milkdown)];
                        });
                    });
                    crepe.on(function (ouvinte) {
                        ouvinte.markdownUpdated(function () {
                            if (visual.crepe === crepe) {
                                sincronizarEditorVisual();
                                agendarMedicaoMapaVisual();
                            }
                        });
                    });
                    await crepe.create();
                    if (geracao !== visual.geracao) {
                        crepe.destroy();
                        raiz.remove();
                        return;
                    }
                    visual.crepe = crepe;
                    visual.modulos = milkdown;
                    visual.terminaComQuebra = /\n$/.test(texto);
                    visual.ultimoMarkdown = normalizarMarkdownVisual(crepe.getMarkdown(), visual.terminaComQuebra);
                    agendarMedicaoMapaVisual();
                    if (visual.focarAoMontar) {
                        focarTexto();
                    }
                } catch (erro) {
                    if (geracao !== visual.geracao) {
                        return;
                    }
                    visual.documento = undefined;
                    aplicarModoPreview('dividido');
                    if (visual.focarAoMontar) {
                        focarTexto();
                    }
                    atualizarEstado('Não foi possível carregar o editor visual. Verifique a conexão com a internet.');
                } finally {
                    if (geracao === visual.geracao) {
                        carregandoVisual.hidden = true;
                    }
                }
            }

            // Minimapa: no Editor e no Dividido é o do próprio Monaco. No Visual, o Milkdown não tem um,
            // então ele é desenhado aqui num canvas, com um traço para cada linha de texto da página.
            function lerPreferenciaMapa() {
                try {
                    return localStorage.getItem(chaveMapa) !== 'desligado';
                } catch (erro) {
                    return true;
                }
            }

            function aplicarMapa() {
                const ativo = mapaLigado && !telaEstreita.matches;
                botaoMapa.setAttribute('aria-pressed', mapaLigado ? 'true' : 'false');
                if (editor) {
                    editor.updateOptions({ minimap: { enabled: ativo } });
                }
                editorPaineis.classList.toggle('com-mapa', ativo);
                agendarMedicaoMapaVisual();
            }

            function alternarMapa() {
                mapaLigado = !mapaLigado;
                try {
                    localStorage.setItem(chaveMapa, mapaLigado ? 'ligado' : 'desligado');
                } catch (erro) {
                    // Sem armazenamento, a escolha vale só até recarregar a página.
                }
                aplicarMapa();
                atualizarEstado(mapaLigado ? 'Minimapa ligado' : 'Minimapa desligado');
            }

            function mapaVisualAtivo() {
                return Boolean(visual.crepe) && !areaDocumentos.hidden
                    && editorPaineis.classList.contains('modo-visual') && editorPaineis.classList.contains('com-mapa');
            }

            function agendarMedicaoMapaVisual() {
                clearTimeout(mapa.temporizador);
                mapa.temporizador = setTimeout(medirMapaVisual, 120);
            }

            // Lê a posição de cada linha de texto, bloco de código, tabela, citação e imagem.
            // As posições ficam guardadas; rolar a página só redesenha, sem medir de novo.
            function medirMapaVisual() {
                const raiz = editorVisual.querySelector('.ProseMirror');
                if (!mapaVisualAtivo() || !raiz) {
                    return;
                }
                const caixaRaiz = raiz.getBoundingClientRect();
                const topo = editorVisual.getBoundingClientRect().top - editorVisual.scrollTop;
                const formas = [];
                const adicionar = function (tipo, retangulo, cor) {
                    if (retangulo.width > 0 && retangulo.height > 0) {
                        formas.push({ tipo: tipo, x: retangulo.left - caixaRaiz.left, y: retangulo.top - topo, largura: retangulo.width, altura: retangulo.height, cor: cor });
                    }
                };
                raiz.querySelectorAll('.milkdown-code-block .cm-editor').forEach(function (elemento) {
                    adicionar('fundo', elemento.getBoundingClientRect());
                });
                raiz.querySelectorAll('th, td').forEach(function (elemento) {
                    adicionar('borda', elemento.getBoundingClientRect());
                });
                raiz.querySelectorAll('blockquote').forEach(function (elemento) {
                    adicionar('barra', elemento.getBoundingClientRect());
                });
                raiz.querySelectorAll('hr').forEach(function (elemento) {
                    adicionar('linha', elemento.getBoundingClientRect());
                });
                raiz.querySelectorAll('img[src]').forEach(function (elemento) {
                    adicionar('imagem', elemento.getBoundingClientRect());
                });
                const cores = new Map();
                const trecho = document.createRange();
                const percurso = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
                while (percurso.nextNode()) {
                    const no = percurso.currentNode;
                    const pai = no.parentElement;
                    // Botões do bloco de código e números de linha do CodeMirror não são texto do documento.
                    if (!no.textContent.trim() || !pai || pai.closest('button, .tools, .cm-gutters')) {
                        continue;
                    }
                    if (!cores.has(pai)) {
                        cores.set(pai, getComputedStyle(pai).color);
                    }
                    trecho.selectNodeContents(no);
                    for (const retangulo of trecho.getClientRects()) {
                        adicionar('texto', retangulo, cores.get(pai));
                    }
                }
                mapa.formas = formas;
                mapa.larguraConteudo = caixaRaiz.width || 1;
                desenharMapaVisual();
            }

            function desenharMapaVisual() {
                mapa.quadro = undefined;
                const largura = mapaVisual.clientWidth;
                const altura = mapaVisual.clientHeight;
                if (!mapaVisualAtivo() || !largura || !altura) {
                    return;
                }
                const densidade = window.devicePixelRatio || 1;
                if (telaMapaVisual.width !== Math.round(largura * densidade) || telaMapaVisual.height !== Math.round(altura * densidade)) {
                    telaMapaVisual.width = Math.round(largura * densidade);
                    telaMapaVisual.height = Math.round(altura * densidade);
                }
                const escala = largura / mapa.larguraConteudo;
                // Como no Sublime: se a miniatura não cabe no painel, ela rola junto com o documento.
                const alturaMiniatura = editorVisual.scrollHeight * escala;
                const rolagemMaxima = Math.max(1, editorVisual.scrollHeight - editorVisual.clientHeight);
                const deslocamento = alturaMiniatura > altura ? (editorVisual.scrollTop / rolagemMaxima) * (alturaMiniatura - altura) : 0;
                mapa.escala = escala;
                mapa.deslocamento = deslocamento;

                const contexto = telaMapaVisual.getContext('2d');
                contexto.setTransform(densidade, 0, 0, densidade, 0, 0);
                contexto.clearRect(0, 0, largura, altura);
                mapa.formas.forEach(function (forma) {
                    const x = forma.x * escala;
                    const y = forma.y * escala - deslocamento;
                    const l = forma.largura * escala;
                    const a = forma.altura * escala;
                    if (y + a < 0 || y > altura) {
                        return;
                    }
                    contexto.globalAlpha = 1;
                    if (forma.tipo === 'texto') {
                        contexto.globalAlpha = 0.6;
                        contexto.fillStyle = forma.cor;
                        contexto.fillRect(x, y + a * 0.25, Math.max(1, l), Math.max(1, a * 0.5));
                    } else if (forma.tipo === 'fundo') {
                        contexto.fillStyle = 'rgba(255, 255, 255, 0.07)';
                        contexto.fillRect(x, y, l, a);
                    } else if (forma.tipo === 'borda') {
                        contexto.strokeStyle = 'rgba(255, 255, 255, 0.14)';
                        contexto.lineWidth = 0.5;
                        contexto.strokeRect(x, y, l, a);
                    } else if (forma.tipo === 'barra') {
                        contexto.fillStyle = 'rgba(138, 184, 255, 0.6)';
                        contexto.fillRect(x, y, 1.5, a);
                    } else if (forma.tipo === 'linha') {
                        contexto.fillStyle = 'rgba(255, 255, 255, 0.3)';
                        contexto.fillRect(x, y + a / 2, l, 1);
                    } else if (forma.tipo === 'imagem') {
                        contexto.fillStyle = 'rgba(255, 255, 255, 0.12)';
                        contexto.fillRect(x, y, l, a);
                    }
                });
                contexto.globalAlpha = 1;
                janelaMapaVisual.style.top = `${editorVisual.scrollTop * escala - deslocamento}px`;
                janelaMapaVisual.style.height = `${Math.max(8, editorVisual.clientHeight * escala)}px`;
            }

            function redesenharMapaVisual() {
                if (!mapa.quadro && mapaVisualAtivo()) {
                    mapa.quadro = requestAnimationFrame(desenharMapaVisual);
                }
            }

            // Clicar fora da janela centraliza aquele ponto; arrastar move a janela junto com o mouse.
            function iniciarArrastoMapaVisual(evento) {
                if (evento.button !== 0 || !mapaVisualAtivo()) {
                    return;
                }
                evento.preventDefault();
                const y = evento.clientY - mapaVisual.getBoundingClientRect().top;
                const topoJanela = editorVisual.scrollTop * mapa.escala - mapa.deslocamento;
                const alturaJanela = editorVisual.clientHeight * mapa.escala;
                if (y < topoJanela || y > topoJanela + alturaJanela) {
                    editorVisual.scrollTop = (y + mapa.deslocamento) / mapa.escala - editorVisual.clientHeight / 2;
                    desenharMapaVisual();
                }
                // Quanto a janela anda no mapa para cada pixel rolado no documento.
                const rolagemMaxima = Math.max(1, editorVisual.scrollHeight - editorVisual.clientHeight);
                const excesso = Math.max(0, editorVisual.scrollHeight * mapa.escala - mapaVisual.clientHeight);
                const fator = mapa.escala - excesso / rolagemMaxima;
                mapa.arrasto = { y: y, rolagem: editorVisual.scrollTop, fator: fator > 0.0001 ? fator : mapa.escala };
                mapaVisual.setPointerCapture(evento.pointerId);
            }

            function moverArrastoMapaVisual(evento) {
                if (!mapa.arrasto) {
                    return;
                }
                const y = evento.clientY - mapaVisual.getBoundingClientRect().top;
                editorVisual.scrollTop = mapa.arrasto.rolagem + (y - mapa.arrasto.y) / mapa.arrasto.fator;
            }

            function terminarArrastoMapaVisual() {
                mapa.arrasto = undefined;
            }

            function lerComoDataUrl(blob) {
                return new Promise(function (resolver, rejeitar) {
                    const leitor = new FileReader();
                    leitor.onload = function () {
                        resolver(leitor.result);
                    };
                    leitor.onerror = function () {
                        rejeitar(leitor.error || new Error('Não foi possível ler a imagem.'));
                    };
                    leitor.readAsDataURL(blob);
                });
            }

            function comprimirImagem(bitmap, largura, altura) {
                const tela = document.createElement('canvas');
                tela.width = largura;
                tela.height = altura;
                tela.getContext('2d').drawImage(bitmap, 0, 0, largura, altura);
                return new Promise(function (resolver) {
                    tela.toBlob(resolver, 'image/webp', 0.82);
                });
            }

            // Sem servidor, a imagem enviada fica dentro do próprio Markdown (data URI).
            // Antes, é reduzida para no máximo 1600 px e comprimida, para o arquivo não crescer demais.
            async function embutirImagem(arquivo) {
                const ladoMaximo = 1600;
                const tamanhoMaximoOriginal = 15 * 1024 * 1024;
                try {
                    if (!arquivo || !/^image\//.test(arquivo.type)) {
                        throw new Error('O arquivo escolhido não é uma imagem.');
                    }
                    if (arquivo.size > tamanhoMaximoOriginal) {
                        throw new Error('A imagem tem mais de 15 MB.');
                    }
                    let resultado = arquivo;
                    // SVG e GIF (que pode ser animado) entram sem conversão.
                    if (!/^image\/(svg\+xml|gif)$/.test(arquivo.type)) {
                        const bitmap = await createImageBitmap(arquivo);
                        const escala = Math.min(1, ladoMaximo / Math.max(bitmap.width, bitmap.height));
                        const largura = Math.max(1, Math.round(bitmap.width * escala));
                        const altura = Math.max(1, Math.round(bitmap.height * escala));
                        const comprimida = await comprimirImagem(bitmap, largura, altura);
                        if (bitmap.close) {
                            bitmap.close();
                        }
                        if (comprimida && (escala < 1 || comprimida.size < arquivo.size)) {
                            resultado = comprimida;
                        }
                    }
                    return await lerComoDataUrl(resultado);
                } catch (erro) {
                    atualizarEstado(`Não foi possível inserir a imagem: ${erro && erro.message ? erro.message : 'erro desconhecido'}`);
                    return '';
                }
            }

            // Como no VS Code: com texto selecionado, digitar aspas ou parênteses envolve a seleção
            // em vez de apagá-la. Em Markdown, também *, _, ~ e <.
            const paresDeEnvolver = { '"': '"', "'": "'", '(': ')', '[': ']', '{': '}', '`': '`' };
            const paresDeEnvolverMarkdown = { '*': '*', '_': '_', '~': '~', '<': '>' };
            const paresDeEnvolverVisual = { '"': '"', "'": "'", '(': ')', '[': ']', '{': '}' };

            function envolverSelecaoNoEditor(evento) {
                const tecla = evento.browserEvent.key;
                if (evento.browserEvent.ctrlKey || evento.browserEvent.metaKey || evento.browserEvent.altKey) {
                    return;
                }
                const fecha = paresDeEnvolver[tecla] || (estaEmMarkdown() ? paresDeEnvolverMarkdown[tecla] : undefined);
                const selecoes = editor.getSelections() || [];
                if (!fecha || !selecoes.length || selecoes.some(function (selecao) { return selecao.isEmpty(); })) {
                    return;
                }
                evento.preventDefault();
                evento.stopPropagation();
                const modelo = editor.getModel();
                const edicoes = selecoes.map(function (selecao) {
                    return { range: selecao, text: `${tecla}${modelo.getValueInRange(selecao)}${fecha}`, forceMoveMarkers: true };
                });
                editor.pushUndoStop();
                // Mantém selecionado o texto de dentro, para poder envolver de novo (ex.: ** em volta).
                editor.executeEdits('envolver-selecao', edicoes, function (inversas) {
                    return inversas.map(function (inversa) {
                        const intervalo = inversa.range;
                        return new monaco.Selection(intervalo.startLineNumber, intervalo.startColumn + 1, intervalo.endLineNumber, intervalo.endColumn - 1);
                    });
                });
                editor.pushUndoStop();
            }

            function criarPluginEnvolverSelecao(milkdown) {
                return new milkdown.estado.Plugin({
                    props: {
                        handleTextInput: function (visao, de, ate, texto) {
                            const fecha = paresDeEnvolverVisual[texto];
                            if (!fecha || de === ate) {
                                return false;
                            }
                            // O duplo clique no Windows inclui o espaço seguinte; ele fica de fora.
                            const selecionado = visao.state.doc.textBetween(de, ate, '\n', '\n');
                            const aparadoFim = selecionado.length - selecionado.trimEnd().length;
                            const aparadoInicio = selecionado.length - selecionado.trimStart().length;
                            if (aparadoInicio + aparadoFim < selecionado.length) {
                                de += aparadoInicio;
                                ate -= aparadoFim;
                            }
                            const transacao = visao.state.tr.insertText(fecha, ate).insertText(texto, de);
                            transacao.setSelection(milkdown.estado.TextSelection.create(transacao.doc, de + 1, ate + 1));
                            visao.dispatch(transacao);
                            return true;
                        }
                    }
                });
            }

            // Como no modo Editor: digitar (, [ ou { já insere o fechamento, com o cursor no meio. Só fecha
            // quando depois do cursor vem espaço, fim da linha ou pontuação (no meio de uma palavra, não).
            // Digitar o fechamento em cima de um inserido automaticamente só avança o cursor, e Backspace
            // entre um par vazio apaga os dois.
            function criarPluginFecharPares(milkdown) {
                const pares = { '(': ')', '[': ']', '{': '}' };
                const fechaAntesDe = /^$|^[\s)\]}.,;:!?]/;
                const chave = new milkdown.estado.PluginKey('fechar-pares');
                // Posições dos fechamentos inseridos automaticamente, acompanhando as edições.
                const fechamentos = function (estado) {
                    return chave.getState(estado) || [];
                };
                return new milkdown.estado.Plugin({
                    key: chave,
                    state: {
                        init: function () {
                            return [];
                        },
                        apply: function (transacao, posicoes) {
                            const novas = transacao.getMeta(chave);
                            if (novas) {
                                return novas;
                            }
                            if (!transacao.docChanged) {
                                return posicoes;
                            }
                            return posicoes.map(function (posicao) {
                                return transacao.mapping.map(posicao);
                            });
                        }
                    },
                    props: {
                        handleTextInput: function (visao, de, ate, texto) {
                            const estado = visao.state;
                            // Depois de um espaço no fim da linha, o navegador informa "trocou o espaço por
                            // ' ('" em vez de "digitou '('". O começo (o espaço, já normalizado) é reaplicado
                            // como veio, e só o último caractere conta como digitado.
                            const prefixo = texto.slice(0, -1);
                            const tecla = texto.slice(-1);
                            if (de !== ate && prefixo.replace(/ /g, ' ') !== estado.doc.textBetween(de, ate).replace(/ /g, ' ')) {
                                return false;
                            }
                            if (de === ate && prefixo) {
                                return false;
                            }
                            const posicoes = fechamentos(estado);
                            const depois = estado.doc.textBetween(ate, Math.min(ate + 1, estado.doc.content.size));
                            if (Object.values(pares).includes(tecla) && posicoes.includes(ate) && depois === tecla) {
                                const transacao = estado.tr.insertText(prefixo, de, ate);
                                const cursor = transacao.mapping.map(ate) + 1;
                                transacao.setSelection(milkdown.estado.TextSelection.create(transacao.doc, cursor));
                                transacao.setMeta(chave, posicoes.filter(function (posicao) {
                                    return posicao !== ate;
                                }).map(function (posicao) {
                                    return transacao.mapping.map(posicao);
                                }));
                                visao.dispatch(transacao);
                                return true;
                            }
                            const fecha = pares[tecla];
                            if (!fecha || !fechaAntesDe.test(depois) || estado.selection.$from.parent.type.spec.code) {
                                return false;
                            }
                            const transacao = estado.tr.insertText(prefixo + tecla + fecha, de, ate);
                            const cursor = de + prefixo.length + 1;
                            transacao.setSelection(milkdown.estado.TextSelection.create(transacao.doc, cursor));
                            transacao.setMeta(chave, posicoes.map(function (posicao) {
                                return transacao.mapping.map(posicao);
                            }).concat(cursor));
                            visao.dispatch(transacao);
                            return true;
                        },
                        handleKeyDown: function (visao, evento) {
                            const estado = visao.state;
                            const selecao = estado.selection;
                            if (evento.key !== 'Backspace' || !selecao.empty || selecao.from < 1) {
                                return false;
                            }
                            const de = selecao.from;
                            const posicoes = fechamentos(estado);
                            const antes = estado.doc.textBetween(de - 1, de);
                            const depois = estado.doc.textBetween(de, Math.min(de + 1, estado.doc.content.size));
                            if (!pares[antes] || pares[antes] !== depois || !posicoes.includes(de)) {
                                return false;
                            }
                            const transacao = estado.tr.delete(de - 1, de + 1);
                            transacao.setMeta(chave, posicoes.filter(function (posicao) {
                                return posicao !== de;
                            }).map(function (posicao) {
                                return transacao.mapping.map(posicao);
                            }));
                            visao.dispatch(transacao);
                            return true;
                        }
                    }
                });
            }

            // Defeito do Milkdown: imagem sem título (o caso mais comum, ![alt](url)) chega com
            // title = null e é descartada em silêncio. Este plugin troca null por texto vazio.
            function corrigirImagensSemTitulo() {
                return function (arvore) {
                    const visitar = function (no) {
                        if (no.type === 'image' || no.type === 'imageReference') {
                            no.title = no.title || '';
                            no.alt = no.alt || '';
                        }
                        (no.children || []).forEach(visitar);
                    };
                    visitar(arvore);
                };
            }

            // Executa uma função com o contexto do Milkdown e a visão do ProseMirror.
            function noVisual(funcao) {
                if (!visual.crepe || !visual.modulos) {
                    return undefined;
                }
                let resultado;
                visual.crepe.editor.action(function (ctx) {
                    resultado = funcao(ctx, ctx.get(visual.modulos.core.editorViewCtx), visual.modulos);
                });
                return resultado;
            }

            function comandoVisual(comando, parametro) {
                return noVisual(function (ctx, visao, m) {
                    m.callCommand(comando.key, parametro)(ctx);
                    visao.focus();
                });
            }

            // O duplo clique no Windows seleciona a palavra com o espaço seguinte.
            // Para marcações que preservam espaços (código, tachado), ignora os espaços das pontas.
            function aparaSelecaoVisual() {
                noVisual(function (ctx, visao, m) {
                    const { from, to, empty } = visao.state.selection;
                    if (empty) {
                        return;
                    }
                    const texto = visao.state.doc.textBetween(from, to, '\n', '\n');
                    const inicio = from + (texto.length - texto.trimStart().length);
                    const fim = to - (texto.length - texto.trimEnd().length);
                    if (fim > inicio && (inicio !== from || fim !== to)) {
                        const Selecao = visao.state.selection.constructor;
                        visao.dispatch(visao.state.tr.setSelection(Selecao.create(visao.state.doc, inicio, fim)));
                    }
                });
            }

            // Tipos dos blocos que envolvem o cursor (do mais externo para o mais interno).
            function blocosNoCursor(visao) {
                const posicao = visao.state.selection.$from;
                const blocos = [];
                for (let profundidade = 1; profundidade <= posicao.depth; profundidade += 1) {
                    blocos.push(posicao.node(profundidade));
                }
                return blocos;
            }

            function alternarTituloVisual(nivel) {
                noVisual(function (ctx, visao, m) {
                    const bloco = visao.state.selection.$from.parent;
                    const jaE = bloco.type.name === 'heading' && bloco.attrs.level === nivel;
                    m.callCommand(jaE ? m.commonmark.turnIntoTextCommand.key : m.commonmark.wrapInHeadingCommand.key, jaE ? undefined : nivel)(ctx);
                    visao.focus();
                });
            }

            function alternarListaVisual(tipo) {
                noVisual(function (ctx, visao, m) {
                    const blocos = blocosNoCursor(visao);
                    const item = blocos.filter(function (no) { return no.type.name === 'list_item'; }).pop();
                    const lista = blocos.filter(function (no) { return /_list$/.test(no.type.name); }).pop();
                    const ehTarefa = Boolean(item && item.attrs.checked !== null && item.attrs.checked !== undefined);
                    const atual = !lista ? '' : (lista.type.name === 'ordered_list' ? 'numerada' : (ehTarefa ? 'tarefas' : 'marcadores'));
                    if (atual === tipo) {
                        m.callCommand(m.commonmark.liftListItemCommand.key)(ctx);
                        visao.focus();
                        return;
                    }
                    if (!lista) {
                        m.callCommand(tipo === 'numerada' ? m.commonmark.wrapInOrderedListCommand.key : m.commonmark.wrapInBulletListCommand.key)(ctx);
                    }
                    if (tipo === 'tarefas' || atual === 'tarefas') {
                        const estado = visao.state;
                        const posicao = estado.selection.$from;
                        for (let profundidade = posicao.depth; profundidade > 0; profundidade -= 1) {
                            if (posicao.node(profundidade).type.name === 'list_item') {
                                const no = posicao.node(profundidade);
                                visao.dispatch(estado.tr.setNodeMarkup(posicao.before(profundidade), undefined, { ...no.attrs, checked: tipo === 'tarefas' ? false : null }));
                                break;
                            }
                        }
                    }
                    visao.focus();
                });
            }

            function alternarCitacaoVisual() {
                noVisual(function (ctx, visao, m) {
                    const dentro = blocosNoCursor(visao).some(function (no) { return no.type.name === 'blockquote'; });
                    if (!dentro) {
                        m.callCommand(m.commonmark.wrapInBlockquoteCommand.key)(ctx);
                    } else {
                        const intervalo = visao.state.selection.$from.blockRange();
                        const destino = intervalo && m.transform.liftTarget(intervalo);
                        if (destino !== null && destino !== undefined) {
                            visao.dispatch(visao.state.tr.lift(intervalo, destino));
                        }
                    }
                    visao.focus();
                });
            }

            function criarLinkVisual() {
                noVisual(function (ctx, visao, m) {
                    const { from, to } = visao.state.selection;
                    if (from === to) {
                        atualizarEstado('Selecione o texto que vai virar link.');
                        return;
                    }
                    ctx.get(m.linkTooltipAPI.key).addLink(from, to);
                });
            }

            // Atalhos gerais valem em qualquer lugar da página, não só com o cursor no editor.
            // Sem isso, com o foco num botão ou numa área vazia, o navegador abria "Salvar página como".
            function tratarAtalhosGerais(evento) {
                if (!(evento.ctrlKey || evento.metaKey)) {
                    return;
                }
                const tecla = evento.key.toLowerCase();
                let acao;
                if (tecla === 's' && !evento.altKey) {
                    acao = evento.shiftKey ? salvarComoArquivo : atalhoSalvar;
                } else if (tecla === 'o' && !evento.shiftKey && !evento.altKey) {
                    acao = abrirArquivo;
                } else if (evento.code === 'KeyN' && evento.altKey && !evento.shiftKey) {
                    acao = criarNovoConteudo;
                } else if (evento.code === 'KeyJ' && evento.altKey && !evento.shiftKey) {
                    acao = ativarFormatadorJson;
                }
                if (!acao) {
                    return;
                }
                evento.preventDefault();
                evento.stopPropagation();
                // Com um diálogo aberto, só impede a ação do navegador.
                if (dialogoImagem.open || dialogoConfirmacao.open) {
                    return;
                }
                acao();
            }

            // Os mesmos atalhos do editor de texto, traduzidos para comandos do Milkdown.
            function tratarAtalhosDoVisual(evento) {
                const comando = evento.ctrlKey || evento.metaKey;
                if (!comando && !(evento.altKey && evento.shiftKey && evento.code === 'Digit5')) {
                    return;
                }
                const tecla = evento.key.toLowerCase();
                const digito = /^Digit([1-9])$/.test(evento.code) ? Number(evento.code.slice(5)) : 0;
                const m = visual.modulos;
                let acao;
                if (!m) {
                    return;
                } else if ((tecla === 'x' && evento.shiftKey) || (digito === 5 && evento.altKey && evento.shiftKey && !comando)) {
                    acao = function () { aparaSelecaoVisual(); comandoVisual(m.gfm.toggleStrikethroughCommand); };
                } else if (evento.code === 'Backquote' && !evento.shiftKey) {
                    acao = function () { aparaSelecaoVisual(); comandoVisual(m.commonmark.toggleInlineCodeCommand); };
                } else if (tecla === 'k' && !evento.shiftKey && !evento.altKey) {
                    acao = function () { aparaSelecaoVisual(); criarLinkVisual(); };
                } else if (digito >= 1 && digito <= 6 && !evento.altKey && (!evento.shiftKey || digito <= 6)) {
                    // Ctrl+1 a 6 (ou Ctrl+Shift+1 a 6, que os navegadores não reservam).
                    acao = function () { alternarTituloVisual(digito); };
                } else if (evento.shiftKey && digito === 7) {
                    acao = function () { alternarListaVisual('numerada'); };
                } else if (evento.shiftKey && digito === 8) {
                    acao = function () { alternarListaVisual('marcadores'); };
                } else if (evento.shiftKey && digito === 9) {
                    acao = function () { alternarListaVisual('tarefas'); };
                } else if (tecla === 'q' && evento.shiftKey) {
                    acao = alternarCitacaoVisual;
                }
                if (acao) {
                    evento.preventDefault();
                    evento.stopPropagation();
                    acao();
                }
            }

            // Diálogo "Inserir imagem": por link ou por arquivo, nos modos Editor e Visual.
            function abrirDialogoImagem() {
                formularioImagem.reset();
                erroImagem.hidden = true;
                dialogoImagem.showModal();
                campoLinkImagem.focus();
            }

            function inserirImagem(src, descricao) {
                const alt = descricao.replace(/[\[\]]/g, '').trim();
                if (modoPreview === 'visual' && visual.crepe && visual.documento === documentoAtual) {
                    comandoVisual(visual.modulos.commonmark.insertImageCommand, { src: src, alt: alt, title: '' });
                    sincronizarEditorVisual();
                } else {
                    const selecao = editor.getSelection();
                    editor.pushUndoStop();
                    editor.executeEdits('inserir-imagem', [{ range: selecao, text: `![${alt}](${src})`, forceMoveMarkers: true }]);
                    editor.pushUndoStop();
                    editor.focus();
                }
                // A mensagem vem depois da inserção, para não ser trocada por "Editando".
                const tamanho = Math.round(src.length / 1024);
                if (!/^data:/.test(src)) {
                    atualizarEstado('Imagem inserida');
                } else if (tamanho > 700) {
                    atualizarEstado(`Imagem inserida no documento (${tamanho} KB). Imagens grandes deixam o arquivo pesado.`);
                } else {
                    atualizarEstado(`Imagem inserida no documento (${tamanho} KB).`);
                }
            }

            async function confirmarDialogoImagem(evento) {
                if (evento.submitter && evento.submitter.value === 'cancelar') {
                    return;
                }
                evento.preventDefault();
                const link = campoLinkImagem.value.trim().replace(/\s/g, '%20');
                const arquivo = campoArquivoImagem.files[0];
                const mostrarErro = function (mensagem) {
                    erroImagem.textContent = mensagem;
                    erroImagem.hidden = false;
                };
                if (!link && !arquivo) {
                    mostrarErro('Cole o link de uma imagem ou escolha um arquivo.');
                    return;
                }
                let src = link;
                if (arquivo) {
                    botaoConfirmarImagem.disabled = true;
                    src = await embutirImagem(arquivo);
                    botaoConfirmarImagem.disabled = false;
                    if (!src) {
                        mostrarErro(estado.textContent);
                        return;
                    }
                }
                dialogoImagem.close('inserir');
                inserirImagem(src, campoDescricaoImagem.value);
            }

            function atualizarPreviewMarkdown() {
                const ehMarkdown = Boolean(documentoAtual) && documentoAtual.modelo.getLanguageId() === 'markdown';
                const modo = ehMarkdown ? modoPreview : 'editor';
                barraMarkdown.hidden = !ehMarkdown;
                ferramentasMarkdown.hidden = modo === 'visual';
                editorPaineis.classList.toggle('modo-dividido', modo === 'dividido');
                editorPaineis.classList.toggle('modo-preview', modo === 'preview');
                editorPaineis.classList.toggle('modo-visual', modo === 'visual');
                if (modo === 'visual' && visualizacaoAtual === 'editor') {
                    montarEditorVisual();
                    return;
                }
                if (visual.documento) {
                    desmontarEditorVisual(true);
                }
                if (!ehMarkdown || modo === 'editor' || visualizacaoAtual !== 'editor') {
                    return;
                }

                const conteudo = documentoAtual.modelo.getValue();
                if (!conteudo.trim()) {
                    previewConteudo.innerHTML = '<p id="preview-vazio">Comece a escrever Markdown para visualizar o resultado aqui.</p>';
                    return;
                }

                if (!window.marked || typeof window.marked.parse !== 'function' || !window.DOMPurify) {
                    previewConteudo.textContent = conteudo;
                    return;
                }

                try {
                    const html = window.marked.parse(conteudo, { gfm: true, breaks: true });
                    previewConteudo.innerHTML = window.DOMPurify.sanitize(html);
                    previewConteudo.querySelectorAll('a[href]').forEach(function (link) {
                        link.target = '_blank';
                        link.rel = 'noopener noreferrer';
                    });
                } catch (erro) {
                    previewConteudo.textContent = conteudo;
                }
            }

            function voltarAoEditorMarkdown() {
                mostrarEditor();
                atualizarInterfaceDocumento(documentoAtual && documentoAtual.modificacoesPendentes ? 'Alterações não salvas' : 'Pronto');
                agendarPersistenciaSessao();
                focarTexto();
            }

            function obterIndentacaoJson() {
                return seletorIndentacaoJson.value === 'tab' ? '\t' : Number(seletorIndentacaoJson.value);
            }

            function localizarErroJson(erro, texto) {
                const mensagem = erro && erro.message ? erro.message : '';
                const linhaColuna = mensagem.match(/line (\d+) column (\d+)/i);
                if (linhaColuna) {
                    return { lineNumber: Number(linhaColuna[1]), column: Number(linhaColuna[2]) };
                }
                const posicao = mensagem.match(/position (\d+)/i);
                if (posicao) {
                    return editorEntradaJson.getModel().getPositionAt(Number(posicao[1]));
                }
                if (/unexpected end/i.test(mensagem)) {
                    return editorEntradaJson.getModel().getPositionAt(texto.length);
                }
                return undefined;
            }

            function definirResultadoJson(valor) {
                editorSaidaJson.setValue(valor);
                vazioJson.hidden = Boolean(valor);
                botaoCopiarJson.disabled = !valor;
                botaoJsonNovaAba.disabled = !valor;
            }

            function formatarJson(compacto, silencioso) {
                if (!editorEntradaJson) {
                    return false;
                }
                if (typeof compacto === 'boolean') {
                    jsonCompacto = compacto;
                }
                const texto = editorEntradaJson.getValue();
                posicaoErroJson = undefined;
                erroJson.hidden = true;

                if (!texto.trim()) {
                    definirResultadoJson('');
                    situacaoJson.textContent = '';
                    situacaoJson.className = '';
                    if (!silencioso) {
                        atualizarEstado('Aguardando JSON');
                    }
                    return false;
                }

                try {
                    const valor = JSON.parse(texto);
                    definirResultadoJson(JSON.stringify(valor, null, jsonCompacto ? 0 : obterIndentacaoJson()));
                    situacaoJson.textContent = jsonCompacto ? 'Válido · compactado' : 'Válido';
                    situacaoJson.className = 'ok';
                    agendarPersistenciaSessao();
                    if (!silencioso) {
                        atualizarEstado(jsonCompacto ? 'JSON compactado' : 'JSON formatado');
                    }
                    return true;
                } catch (erro) {
                    posicaoErroJson = localizarErroJson(erro, texto);
                    definirResultadoJson('');
                    situacaoJson.textContent = '1 erro';
                    situacaoJson.className = 'erro';
                    const mensagemErro = erro.message
                        .replace(/\s*\(line \d+ column \d+\)/i, '')
                        .replace(/\s*in JSON at position \d+/i, '');
                    erroJsonTexto.textContent = posicaoErroJson
                        ? `Linha ${posicaoErroJson.lineNumber}, coluna ${posicaoErroJson.column}: ${mensagemErro}`
                        : `JSON inválido: ${erro.message}`;
                    botaoIrErroJson.hidden = !posicaoErroJson;
                    erroJson.hidden = false;
                    agendarPersistenciaSessao();
                    if (!silencioso || visualizacaoAtual === 'formatador-json') {
                        atualizarEstado('JSON inválido');
                    }
                    return false;
                }
            }

            function irParaErroJson() {
                if (!posicaoErroJson) {
                    return;
                }
                editorEntradaJson.setPosition(posicaoErroJson);
                editorEntradaJson.revealPositionInCenter(posicaoErroJson);
                editorEntradaJson.focus();
            }

            async function copiarResultadoJson() {
                const resultado = editorSaidaJson.getValue();
                if (!resultado) {
                    return;
                }

                try {
                    if (navigator.clipboard && window.isSecureContext) {
                        await navigator.clipboard.writeText(resultado);
                    } else {
                        const areaTemporaria = document.createElement('textarea');
                        areaTemporaria.value = resultado;
                        document.body.appendChild(areaTemporaria);
                        areaTemporaria.select();
                        document.execCommand('copy');
                        areaTemporaria.remove();
                    }
                    atualizarEstado('Resultado copiado');
                } catch (erro) {
                    atualizarEstado('Não foi possível copiar o resultado');
                }
            }

            function abrirResultadoJsonEmNovaAba() {
                const resultado = editorSaidaJson.getValue();
                if (!resultado) {
                    return;
                }
                const documento = criarDocumento(obterNomeSemTitulo(), resultado, undefined, true, 'json');
                documento.modificacoesPendentes = true;
                documentos.push(documento);
                ativarDocumento(documento, 'JSON aberto em nova aba');
                agendarPersistenciaSessao();
            }

            function usarDocumentoAtualNoJson() {
                if (!documentoAtual) {
                    return;
                }
                editorEntradaJson.setValue(documentoAtual.modelo.getValue());
                formatarJson();
                agendarPersistenciaSessao();
                editorEntradaJson.focus();
            }

            function agendarRascunho(documento) {
                window.clearTimeout(documento.temporizadorSalvamento);
                documento.temporizadorSalvamento = window.setTimeout(function () {
                    agendarPersistenciaSessao();
                }, 600);
            }

            function criarDocumento(nome, conteudo, manipulador, ehSemTitulo, linguagemInicial, idInicial) {
                const nomeDocumento = nome || obterNomeSemTitulo();
                const linguagemDocumento = obterLinguagemDisponivel(linguagemInicial || obterLinguagemDoArquivo(nomeDocumento));
                const idDocumento = Number.isInteger(idInicial) && !documentos.some(function (documento) {
                    return documento.id === idInicial;
                }) ? idInicial : proximoIdDocumento;
                const modelo = monaco.editor.createModel(
                    conteudo,
                    linguagemDocumento,
                    monaco.Uri.parse(`inmemory://editor/documento-${idDocumento}`)
                );
                const documento = {
                    id: idDocumento,
                    nome: nomeDocumento,
                    manipulador: manipulador,
                    modelo: modelo,
                    ehSemTitulo: Boolean(ehSemTitulo),
                    modificacoesPendentes: false,
                    temporizadorSalvamento: undefined
                };
                proximoIdDocumento = Math.max(proximoIdDocumento, idDocumento + 1);
                modelo.onDidChangeContent(function () {
                    // Texto alterado por fora do modo Visual (ex.: importação): recarrega o visual.
                    if (documento === visual.documento && visual.crepe && !visual.aplicando) {
                        desmontarEditorVisual(false);
                    }
                    marcarModificacoes(documento, true);
                    agendarRascunho(documento);
                    if (documento === documentoAtual) {
                        atualizarEstado('Editando');
                        atualizarPreviewMarkdown();
                    }
                });
                return documento;
            }

            function ativarDocumento(documento, mensagem) {
                mostrarEditor();
                if (documento === documentoAtual) {
                    atualizarInterfaceDocumento(mensagem);
                    agendarPersistenciaSessao();
                    focarTexto();
                    return;
                }
                documentoAtual = documento;
                editor.setModel(documento.modelo);
                linguagem.value = obterLinguagemDisponivel(documento.modelo.getLanguageId());
                atualizarPreviewMarkdown();
                atualizarInterfaceDocumento(mensagem || (documento.modificacoesPendentes ? 'Alterações não salvas' : 'Pronto'));
                agendarPersistenciaSessao();
                focarTexto();
            }

            async function carregarArquivo(arquivo, manipulador) {
                try {
                    const conteudo = await arquivo.text();
                    const documento = criarDocumento(arquivo.name, conteudo, manipulador, false);
                    documentos.push(documento);
                    ativarDocumento(documento, 'Arquivo aberto');
                    agendarPersistenciaSessao();
                    // Um arquivo de dentro da pasta aberta fica destacado na árvore.
                    if (manipulador && pastas.permitida) {
                        associarDocumentoPasta(documento).then(destacarDocumentoNaArvore);
                    }
                } catch (erro) {
                    atualizarEstado('Não foi possível abrir o arquivo');
                }
            }

            async function abrirArquivo() {
                try {
                    if (typeof window.showOpenFilePicker === 'function') {
                        const [manipulador] = await window.showOpenFilePicker({ multiple: false });
                        const arquivo = await manipulador.getFile();
                        await carregarArquivo(arquivo, manipulador);
                        return;
                    }
                } catch (erro) {
                    if (erro && erro.name === 'AbortError') {
                        return;
                    }
                }
                seletorArquivo.value = '';
                seletorArquivo.click();
            }

            function baixarArquivo(documento, nome) {
                const blob = new Blob([documento.modelo.getValue()], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = nome;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.setTimeout(function () {
                    URL.revokeObjectURL(url);
                }, 1000);
            }

            function baixarTexto(conteudo, nome, tipo) {
                const blob = new Blob([conteudo], { type: tipo });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = nome;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.setTimeout(function () {
                    URL.revokeObjectURL(url);
                }, 1000);
            }

            async function gravarSessaoNoArquivo(manipulador, solicitarPermissao) {
                if (typeof manipulador.queryPermission === 'function') {
                    let permissao = await manipulador.queryPermission({ mode: 'readwrite' });
                    if (permissao !== 'granted' && solicitarPermissao && typeof manipulador.requestPermission === 'function') {
                        permissao = await manipulador.requestPermission({ mode: 'readwrite' });
                    }
                    if (permissao !== 'granted') {
                        return false;
                    }
                }
                const gravavel = await manipulador.createWritable();
                await gravavel.write(JSON.stringify(criarInstantaneoSessao(false), null, 2));
                await gravavel.close();
                return true;
            }

            function descreverBackupAtivo(data) {
                const nome = manipuladorBackupSessao && manipuladorBackupSessao.name ? manipuladorBackupSessao.name : 'arquivo escolhido';
                const horario = data ? ` · último às ${formatarHorario(data)}` : '';
                return `${nome} · a cada 30 s${horario}`;
            }

            async function configurarBackupAutomatico() {
                if (typeof window.showSaveFilePicker !== 'function') {
                    atualizarStatusBackup('Este navegador não permite backup em arquivo. A sessão fica salva só no navegador; use "Exportar cópia".', 'neutro');
                    atualizarEstado('Backup em arquivo indisponível neste navegador');
                    return false;
                }

                try {
                    const manipulador = await window.showSaveFilePicker({
                        suggestedName: 'meu-editor-sessao.json',
                        types: [{
                            description: 'Sessão do editor',
                            accept: { 'application/json': ['.json'] }
                        }]
                    });
                    if (!await gravarSessaoNoArquivo(manipulador, true)) {
                        atualizarStatusBackup('Permissão para o arquivo de backup negada.', 'aviso');
                        return false;
                    }
                    manipuladorBackupSessao = manipulador;
                    backupPrecisaAutorizacao = false;
                    atualizarStatusBackup(descreverBackupAtivo(new Date()), 'ok');
                    agendarPersistenciaSessao();
                    atualizarEstado('Backup automático configurado');
                    return true;
                } catch (erro) {
                    if (erro && erro.name === 'AbortError') {
                        return undefined;
                    }
                    atualizarStatusBackup('Não foi possível configurar o arquivo de backup.', 'aviso');
                    atualizarEstado(`Falha no backup: ${erro && erro.message ? erro.message : 'erro desconhecido'}`);
                    return false;
                }
            }

            async function acionarBackupEmArquivo() {
                if (manipuladorBackupSessao && backupPrecisaAutorizacao) {
                    try {
                        if (await gravarSessaoNoArquivo(manipuladorBackupSessao, true)) {
                            backupPrecisaAutorizacao = false;
                            atualizarStatusBackup(descreverBackupAtivo(new Date()), 'ok');
                            atualizarEstado('Backup em arquivo autorizado');
                            return;
                        }
                    } catch (erro) {
                        manipuladorBackupSessao = undefined;
                    }
                }
                await configurarBackupAutomatico();
            }

            function exportarSessao() {
                const sessao = criarInstantaneoSessao(false);
                baixarTexto(JSON.stringify(sessao, null, 2), 'meu-editor-sessao.json', 'application/json;charset=utf-8');
                atualizarEstado('Cópia da sessão baixada');
            }

            async function exportarSessaoAutomaticamente() {
                if (backupAutomaticoEmAndamento) {
                    return;
                }
                backupAutomaticoEmAndamento = true;
                try {
                    salvarSessaoLocalmente();
                    persistirSessaoIndexedDb();
                    if (manipuladorBackupSessao) {
                        const gravou = await gravarSessaoNoArquivo(manipuladorBackupSessao, false);
                        backupPrecisaAutorizacao = !gravou;
                        if (gravou) {
                            atualizarStatusBackup(descreverBackupAtivo(new Date()), 'ok');
                        } else {
                            atualizarStatusBackup('O navegador pediu nova autorização para gravar o arquivo de backup. A sessão continua salva no navegador.', 'aviso');
                        }
                    }
                } catch (erro) {
                    atualizarStatusBackup('Backup em arquivo indisponível. A sessão continua salva no navegador.', 'aviso');
                } finally {
                    backupAutomaticoEmAndamento = false;
                }
            }

            function iniciarBackupAutomatico() {
                window.clearInterval(temporizadorBackupAutomatico);
                temporizadorBackupAutomatico = window.setInterval(exportarSessaoAutomaticamente, 30000);
                exportarSessaoAutomaticamente();
            }

            function possuiAlteracoesPendentes() {
                return documentos.some(function (documento) {
                    return documento.modificacoesPendentes;
                });
            }

            function validarSessaoImportada(sessao) {
                return sessao && Array.isArray(sessao.documentos) && sessao.documentos.length > 0 && sessao.documentos.every(function (documento) {
                    return documento && typeof documento.nome === 'string' && typeof documento.conteudo === 'string';
                });
            }

            function aplicarSessao(sessao) {
                desmontarEditorVisual(false);
                editor.setModel(null);
                documentos.forEach(function (documento) {
                    window.clearTimeout(documento.temporizadorSalvamento);
                    documento.modelo.dispose();
                });
                documentos = [];
                documentoAtual = undefined;
                proximoIdDocumento = 1;
                restaurarDocumentos(sessao);
                linguagem.value = obterLinguagemDisponivel(documentoAtual.modelo.getLanguageId());
                editor.setModel(documentoAtual.modelo);
                restaurarEstadoFormatador(sessao);
                aplicarModoPreview(sessao.modoPreview);
                if (sessao.visualizacaoAtual === 'formatador-json') {
                    ativarFormatadorJson();
                } else if (sessao.visualizacaoAtual === 'atalhos-markdown') {
                    ativarAtalhosMarkdown();
                } else {
                    mostrarEditor();
                    atualizarInterfaceDocumento('Sessão importada');
                }
                agendarPersistenciaSessao();
                focarTexto();
            }

            async function importarSessao(arquivo) {
                try {
                    const sessao = JSON.parse(await arquivo.text());
                    if (!validarSessaoImportada(sessao)) {
                        throw new Error('O arquivo não contém uma sessão válida.');
                    }
                    if (possuiAlteracoesPendentes() && !await confirmar('Existem alterações não salvas. Substituir a sessão atual pela importada?', 'Substituir')) {
                        return;
                    }
                    aplicarSessao(sessao);
                } catch (erro) {
                    atualizarEstado(`Falha ao importar sessão: ${erro.message}`);
                }
            }

            async function gravarNoManipulador(manipulador, conteudo) {
                if (typeof manipulador.queryPermission === 'function') {
                    let permissao = await manipulador.queryPermission({ mode: 'readwrite' });
                    if (permissao !== 'granted' && typeof manipulador.requestPermission === 'function') {
                        permissao = await manipulador.requestPermission({ mode: 'readwrite' });
                    }
                    if (permissao !== 'granted') {
                        return false;
                    }
                }
                const gravavel = await manipulador.createWritable();
                await gravavel.write(conteudo);
                await gravavel.close();
                return true;
            }

            function marcarDocumentoSalvo(documento, mensagem) {
                documento.modificacoesPendentes = false;
                agendarPersistenciaSessao();
                atualizarInterfaceDocumento(mensagem);
            }

            function obterNomeSugerido(documento) {
                if (!documento.ehSemTitulo) {
                    return documento.nome;
                }
                const extensoes = {
                    javascript: 'js',
                    typescript: 'ts',
                    html: 'html',
                    css: 'css',
                    json: 'json',
                    markdown: 'md',
                    plaintext: 'txt'
                };
                return `novo-arquivo.${extensoes[documento.modelo.getLanguageId()] || 'txt'}`;
            }

            function baixarDocumento(documento, nome) {
                baixarArquivo(documento, nome);
                documento.nome = nome;
                documento.ehSemTitulo = false;
                marcarDocumentoSalvo(documento, `Cópia baixada: ${nome}`);
            }

            function pedirNomeDownload(documento) {
                const nome = window.prompt('Nome do arquivo para baixar:', obterNomeSugerido(documento));
                return nome ? nome.trim() : '';
            }

            function salvarNoNavegador() {
                salvarSessaoLocalmente();
                persistirSessaoIndexedDb();
                atualizarEstado('Salvo no navegador. Para ter uma cópia em arquivo, use "Baixar".');
            }

            function atalhoSalvar() {
                sincronizarEditorVisual();
                if (gravacaoDiretaDisponivel || usandoPastaDoServidor() || (documentoAtual && documentoAtual.manipulador)) {
                    return salvarArquivo();
                }
                salvarNoNavegador();
            }

            async function salvarComoArquivo() {
                sincronizarEditorVisual();
                const documento = documentoAtual;
                if (!documento) {
                    return;
                }
                try {
                    if (usandoPastaDoServidor()) {
                        await salvarNoServidorComo(documento);
                        return;
                    }
                    if (gravacaoDiretaDisponivel) {
                        const nomeSugerido = obterNomeSugerido(documento);
                        const manipulador = await window.showSaveFilePicker({
                            suggestedName: nomeSugerido
                        });
                        if (!await gravarNoManipulador(manipulador, documento.modelo.getValue())) {
                            atualizarEstado('Permissão para salvar negada');
                            return;
                        }
                        documento.nome = manipulador.name || nomeSugerido;
                        documento.manipulador = manipulador;
                        documento.ehSemTitulo = false;
                        marcarDocumentoSalvo(documento, 'Arquivo salvo');
                        // Salvo dentro da pasta aberta: aparece na árvore.
                        if (pastas.permitida) {
                            associarDocumentoPasta(documento).then(atualizarArvorePastas);
                        }
                        return;
                    }

                    const nome = pedirNomeDownload(documento);
                    if (!nome) {
                        return;
                    }
                    baixarDocumento(documento, nome);
                } catch (erro) {
                    if (erro && erro.name === 'AbortError') {
                        return;
                    }
                    atualizarEstado(`Falha ao salvar: ${erro && erro.message ? erro.message : 'erro desconhecido'}`);
                }
            }

            async function salvarArquivo() {
                sincronizarEditorVisual();
                const documento = documentoAtual;
                if (!documento) {
                    return;
                }
                try {
                    if (documento.manipulador) {
                        if (!await gravarNoManipulador(documento.manipulador, documento.modelo.getValue())) {
                            atualizarEstado('Permissão para salvar negada');
                            return;
                        }
                        marcarDocumentoSalvo(documento, 'Arquivo salvo');
                        return;
                    }
                    if (usandoPastaDoServidor()) {
                        await salvarNoServidorComo(documento);
                        return;
                    }
                    if (!gravacaoDiretaDisponivel) {
                        const nome = documento.ehSemTitulo ? pedirNomeDownload(documento) : documento.nome;
                        if (nome) {
                            baixarDocumento(documento, nome);
                        }
                        return;
                    }
                    await salvarComoArquivo();
                } catch (erro) {
                    if (erro && erro.name === 'AbortError') {
                        return;
                    }
                    if (erro && erro.name === 'ConflitoServidor') {
                        await resolverConflitoServidor(documento);
                        return;
                    }
                    atualizarEstado(`Falha ao salvar: ${erro && erro.message ? erro.message : 'erro desconhecido'}`);
                }
            }

            // O arquivo mudou no servidor (por outro aparelho) depois de aberto: pergunta antes de gravar por cima.
            async function resolverConflitoServidor(documento) {
                const gravarPorCima = await confirmar(`${documento.nome} foi alterado em outro aparelho depois que você abriu. Gravar a sua versão por cima? A versão do servidor fica guardada em .editor/copias.`, 'Gravar por cima');
                if (!gravarPorCima) {
                    atualizarEstado('Não salvo: o arquivo foi alterado em outro aparelho');
                    return;
                }
                documento.manipulador.etag = undefined;
                try {
                    await gravarNoManipulador(documento.manipulador, documento.modelo.getValue());
                    marcarDocumentoSalvo(documento, 'Arquivo salvo');
                } catch (erro) {
                    atualizarEstado(`Falha ao salvar: ${erro && erro.message ? erro.message : 'erro desconhecido'}`);
                }
            }

            // Documento novo começa em Markdown, no modo Visual, pronto para escrever.
            function criarNovoConteudo() {
                const documento = criarDocumento(obterNomeSemTitulo(), '', undefined, true, 'markdown');
                documentos.push(documento);
                definirModoPreview('visual');
                ativarDocumento(documento, 'Novo arquivo');
                agendarPersistenciaSessao();
            }

            async function fecharDocumento(documento) {
                if (documento.modificacoesPendentes && !await confirmar(`${documento.nome} tem alterações não salvas. Fechar mesmo assim?`, 'Fechar sem salvar')) {
                    return;
                }
                if (!documentos.includes(documento)) {
                    return;
                }
                if (visual.documento === documento) {
                    desmontarEditorVisual(false);
                }
                const indice = documentos.indexOf(documento);
                const eraAtual = documento === documentoAtual;
                const proximoDocumento = eraAtual ? (documentos[indice + 1] || documentos[indice - 1]) : undefined;

                window.clearTimeout(documento.temporizadorSalvamento);
                if (eraAtual && proximoDocumento) {
                    documentoAtual = proximoDocumento;
                    editor.setModel(proximoDocumento.modelo);
                }
                if (eraAtual && !proximoDocumento) {
                    editor.setModel(null);
                }
                documentos.splice(indice, 1);
                documento.modelo.dispose();

                if (documentos.length === 0) {
                    const novoDocumento = criarDocumento(obterNomeSemTitulo(), '', undefined, true, 'markdown');
                    documentos.push(novoDocumento);
                    definirModoPreview('visual');
                    documentoAtual = novoDocumento;
                    editor.setModel(novoDocumento.modelo);
                } else if (!eraAtual) {
                    atualizarInterfaceDocumento();
                    agendarPersistenciaSessao();
                    return;
                }
                linguagem.value = obterLinguagemDisponivel(documentoAtual.modelo.getLanguageId());
                atualizarInterfaceDocumento('Aba fechada');
                agendarPersistenciaSessao();
                focarTexto();
            }

            function restaurarDocumentos(sessao) {
                const registros = sessao && Array.isArray(sessao.documentos) ? sessao.documentos : [];
                if (!registros.length) {
                    const documentoInicial = criarDocumento(
                        obterNomeSemTitulo(),
                        conteudoInicial,
                        undefined,
                        true,
                        linguagem.value
                    );
                    documentos.push(documentoInicial);
                    documentoAtual = documentoInicial;
                    return;
                }

                registros.forEach(function (registro) {
                    const documento = criarDocumento(
                        registro.nome || obterNomeSemTitulo(),
                        typeof registro.conteudo === 'string' ? registro.conteudo : '',
                        registro.manipulador,
                        Boolean(registro.ehSemTitulo),
                        registro.linguagem,
                        registro.id
                    );
                    documento.modificacoesPendentes = Boolean(registro.modificacoesPendentes);
                    if (registro.manipulador && typeof registro.caminhoPasta === 'string') {
                        documento.caminhoPasta = registro.caminhoPasta;
                    }
                    documentos.push(documento);
                });

                documentoAtual = documentos.find(function (documento) {
                    return documento.id === sessao.documentoAtualId;
                }) || documentos[0];
            }

            function restaurarEstadoFormatador(sessao) {
                if (!sessao || !sessao.formatadorJson) {
                    return;
                }
                if (['2', '4', 'tab'].includes(sessao.formatadorJson.indentacao)) {
                    seletorIndentacaoJson.value = sessao.formatadorJson.indentacao;
                }
                editorEntradaJson.setValue(sessao.formatadorJson.entrada || '');
                formatarJson(false, true);
            }

            function estaEmMarkdown() {
                return Boolean(editor && documentoAtual && documentoAtual.modelo.getLanguageId() === 'markdown');
            }

            function avisarAtalhoMarkdownIndisponivel() {
                atualizarEstado('Selecione a linguagem Markdown para usar este atalho');
            }

            function obterSelecoesOrdenadas(modelo) {
                return (editor.getSelections() || []).slice().sort(function (selecaoA, selecaoB) {
                    return modelo.getOffsetAt(selecaoA.getStartPosition()) - modelo.getOffsetAt(selecaoB.getStartPosition());
                });
            }

            function executarEdicoesMarkdown(edicoes, posicoes, mensagem) {
                editor.pushUndoStop();
                editor.executeEdits('atalho-markdown', edicoes);
                editor.pushUndoStop();
                editor.setSelections(posicoes.map(function (posicao) {
                    const inicio = editor.getModel().getPositionAt(posicao.inicio);
                    const fim = editor.getModel().getPositionAt(posicao.fim);
                    return new monaco.Selection(inicio.lineNumber, inicio.column, fim.lineNumber, fim.column);
                }));
                atualizarEstado(mensagem);
            }

            function aplicarMarcacaoMarkdown(prefixo, sufixo, mensagem) {
                if (!estaEmMarkdown()) {
                    avisarAtalhoMarkdownIndisponivel();
                    return;
                }

                const modelo = editor.getModel();
                const selecoes = obterSelecoesOrdenadas(modelo);
                const edicoes = [];
                const posicoes = [];
                let deslocamento = 0;

                selecoes.forEach(function (selecao) {
                    const inicio = modelo.getOffsetAt(selecao.getStartPosition());
                    const fim = modelo.getOffsetAt(selecao.getEndPosition());
                    const texto = modelo.getValueInRange(selecao);
                    const estaMarcado = texto.length >= prefixo.length + sufixo.length
                        && texto.startsWith(prefixo)
                        && texto.endsWith(sufixo);
                    const novoTexto = estaMarcado
                        ? texto.slice(prefixo.length, texto.length - sufixo.length)
                        : `${prefixo}${texto}${sufixo}`;
                    const inicioFinal = inicio + deslocamento;
                    const fimFinal = inicioFinal + novoTexto.length;

                    edicoes.push({ range: selecao, text: novoTexto, forceMoveMarkers: true });
                    posicoes.push({
                        inicio: texto ? inicioFinal : inicioFinal + prefixo.length,
                        fim: texto ? fimFinal : inicioFinal + prefixo.length
                    });
                    deslocamento += novoTexto.length - (fim - inicio);
                });

                executarEdicoesMarkdown(edicoes, posicoes, mensagem);
            }

            function aplicarLinkMarkdown() {
                if (!estaEmMarkdown()) {
                    avisarAtalhoMarkdownIndisponivel();
                    return;
                }

                const modelo = editor.getModel();
                const selecoes = obterSelecoesOrdenadas(modelo);
                const edicoes = [];
                const posicoes = [];
                let deslocamento = 0;

                selecoes.forEach(function (selecao) {
                    const inicio = modelo.getOffsetAt(selecao.getStartPosition());
                    const fim = modelo.getOffsetAt(selecao.getEndPosition());
                    const texto = modelo.getValueInRange(selecao);
                    const novoTexto = texto ? `[${texto}](url)` : '[](url)';
                    const inicioFinal = inicio + deslocamento;
                    const inicioUrl = inicioFinal + texto.length + 3;

                    edicoes.push({ range: selecao, text: novoTexto, forceMoveMarkers: true });
                    posicoes.push({ inicio: inicioUrl, fim: inicioUrl + 3 });
                    deslocamento += novoTexto.length - (fim - inicio);
                });

                executarEdicoesMarkdown(edicoes, posicoes, 'Link Markdown inserido');
            }

            function obterLinhasSelecionadas(modelo) {
                const linhas = new Set();
                (editor.getSelections() || []).forEach(function (selecao) {
                    const inicio = selecao.getStartPosition().lineNumber;
                    const fim = selecao.getEndPosition().lineNumber;
                    for (let linha = inicio; linha <= fim; linha += 1) {
                        linhas.add(linha);
                    }
                });
                return Array.from(linhas).sort(function (linhaA, linhaB) {
                    return linhaA - linhaB;
                });
            }

            function editarLinhasMarkdown(transformador, mensagem) {
                if (!estaEmMarkdown()) {
                    avisarAtalhoMarkdownIndisponivel();
                    return;
                }

                const modelo = editor.getModel();
                const edicoes = [];
                obterLinhasSelecionadas(modelo).forEach(function (numeroLinha) {
                    const conteudoAtual = modelo.getLineContent(numeroLinha);
                    const novoConteudo = transformador(conteudoAtual);
                    if (novoConteudo !== conteudoAtual) {
                        edicoes.push({
                            range: new monaco.Range(numeroLinha, 1, numeroLinha, modelo.getLineMaxColumn(numeroLinha)),
                            text: novoConteudo,
                            forceMoveMarkers: true
                        });
                    }
                });

                if (!edicoes.length) {
                    atualizarEstado('Nenhuma linha alterada');
                    return;
                }
                editor.pushUndoStop();
                editor.executeEdits('atalho-markdown', edicoes);
                editor.pushUndoStop();
                atualizarEstado(mensagem);
            }

            function obterIndentacaoLinha(linha) {
                return (linha.match(/^\s*/) || [''])[0];
            }

            function transformarCabecalhoMarkdown(linha, nivel) {
                const cabecalho = linha.match(/^(\s*)#{1,6}\s+/);
                if (cabecalho) {
                    const indentacao = cabecalho[1];
                    const conteudo = linha.slice(cabecalho[0].length);
                    const prefixo = `${indentacao}${'#'.repeat(nivel)} `;
                    return cabecalho[0] === prefixo ? `${indentacao}${conteudo}` : `${prefixo}${conteudo}`;
                }
                const indentacao = obterIndentacaoLinha(linha);
                return `${indentacao}${'#'.repeat(nivel)} ${linha.slice(indentacao.length)}`;
            }

            function transformarListaMarcadoresMarkdown(linha) {
                const marcador = linha.match(/^(\s*)[-*+]\s+/);
                if (marcador) {
                    return `${marcador[1]}${linha.slice(marcador[0].length)}`;
                }
                const indentacao = obterIndentacaoLinha(linha);
                return `${indentacao}- ${linha.slice(indentacao.length)}`;
            }

            function transformarListaNumeradaMarkdown(linha) {
                const marcador = linha.match(/^(\s*)\d+[.)]\s+/);
                if (marcador) {
                    return `${marcador[1]}${linha.slice(marcador[0].length)}`;
                }
                const indentacao = obterIndentacaoLinha(linha);
                return `${indentacao}1. ${linha.slice(indentacao.length)}`;
            }

            function transformarListaTarefasMarkdown(linha) {
                const tarefa = linha.match(/^(\s*)[-*+]\s+\[[ xX]\]\s+/);
                if (tarefa) {
                    return `${tarefa[1]}${linha.slice(tarefa[0].length)}`;
                }
                const item = linha.match(/^(\s*)[-*+]\s+/);
                if (item) {
                    return `${item[1]}- [ ] ${linha.slice(item[0].length)}`;
                }
                const indentacao = obterIndentacaoLinha(linha);
                return `${indentacao}- [ ] ${linha.slice(indentacao.length)}`;
            }

            function transformarCitacaoMarkdown(linha) {
                const citacao = linha.match(/^(\s*)>\s?/);
                if (citacao) {
                    return `${citacao[1]}${linha.slice(citacao[0].length)}`;
                }
                const indentacao = obterIndentacaoLinha(linha);
                return `${indentacao}> ${linha.slice(indentacao.length)}`;
            }

            // Insere "---" separado por linhas em branco. Sem a linha em branco acima,
            // o Markdown transformaria o texto anterior num título em vez de criar a linha.
            function inserirLinhaHorizontalMarkdown() {
                if (!estaEmMarkdown()) {
                    avisarAtalhoMarkdownIndisponivel();
                    return;
                }
                const modelo = editor.getModel();
                const linha = editor.getPosition().lineNumber;
                const atual = modelo.getLineContent(linha);
                const anterior = linha > 1 ? modelo.getLineContent(linha - 1) : '';
                const proxima = linha < modelo.getLineCount() ? modelo.getLineContent(linha + 1) : '';
                const fimLinha = modelo.getLineMaxColumn(linha);
                const quebra = modelo.getEOL();
                const ultimaLinha = linha === modelo.getLineCount();
                const espacoDepois = ultimaLinha || proxima.trim() ? quebra : '';
                const edicao = atual.trim()
                    ? { range: new monaco.Range(linha, fimLinha, linha, fimLinha), text: `${quebra}${quebra}---${espacoDepois}` }
                    : { range: new monaco.Range(linha, 1, linha, fimLinha), text: `${anterior.trim() ? quebra : ''}---${espacoDepois}` };
                editor.pushUndoStop();
                editor.executeEdits('atalho-markdown', [{ ...edicao, forceMoveMarkers: true }]);
                editor.pushUndoStop();
                atualizarEstado('Linha horizontal inserida');
            }

            function aplicarCabecalhoMarkdown(nivel) {
                editarLinhasMarkdown(function (linha) {
                    return transformarCabecalhoMarkdown(linha, nivel);
                }, `Título H${nivel} aplicado`);
            }

            function registrarAtalhosMarkdown() {
                const precondicaoMarkdown = 'editorTextFocus && editorLangId == markdown';
                editor.addAction({
                    id: 'markdown-negrito',
                    label: 'Markdown: Negrito',
                    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB],
                    precondition: precondicaoMarkdown,
                    run: function () {
                        aplicarMarcacaoMarkdown('**', '**', 'Negrito aplicado');
                    }
                });
                editor.addAction({
                    id: 'markdown-italico',
                    label: 'Markdown: Itálico',
                    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI],
                    precondition: precondicaoMarkdown,
                    run: function () {
                        aplicarMarcacaoMarkdown('*', '*', 'Itálico aplicado');
                    }
                });
                editor.addAction({
                    id: 'markdown-tachado',
                    label: 'Markdown: Tachado',
                    keybindings: [
                        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyX,
                        monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.Digit5
                    ],
                    precondition: precondicaoMarkdown,
                    run: function () {
                        aplicarMarcacaoMarkdown('~~', '~~', 'Tachado aplicado');
                    }
                });
                editor.addAction({
                    id: 'markdown-codigo-inline',
                    label: 'Markdown: Código inline',
                    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Backquote],
                    precondition: precondicaoMarkdown,
                    run: function () {
                        aplicarMarcacaoMarkdown('`', '`', 'Código inline aplicado');
                    }
                });
                editor.addAction({
                    id: 'markdown-link',
                    label: 'Markdown: Inserir link',
                    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK],
                    precondition: precondicaoMarkdown,
                    run: aplicarLinkMarkdown
                });

                [monaco.KeyCode.Digit1, monaco.KeyCode.Digit2, monaco.KeyCode.Digit3, monaco.KeyCode.Digit4, monaco.KeyCode.Digit5, monaco.KeyCode.Digit6].forEach(function (tecla, indice) {
                    const nivel = indice + 1;
                    editor.addAction({
                        id: `markdown-titulo-${nivel}`,
                        label: `Markdown: Título H${nivel}`,
                        // Ctrl+Shift+número como alternativa: Firefox e Chrome usam Ctrl+número para trocar de aba.
                        keybindings: [monaco.KeyMod.CtrlCmd | tecla, monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | tecla],
                        precondition: precondicaoMarkdown,
                        run: function () {
                            aplicarCabecalhoMarkdown(nivel);
                        }
                    });
                });
                editor.addAction({
                    id: 'markdown-lista-numerada',
                    label: 'Markdown: Lista numerada',
                    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Digit7],
                    precondition: precondicaoMarkdown,
                    run: function () {
                        editarLinhasMarkdown(transformarListaNumeradaMarkdown, 'Lista numerada alternada');
                    }
                });
                editor.addAction({
                    id: 'markdown-lista-marcadores',
                    label: 'Markdown: Lista com marcadores',
                    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Digit8],
                    precondition: precondicaoMarkdown,
                    run: function () {
                        editarLinhasMarkdown(transformarListaMarcadoresMarkdown, 'Lista com marcadores alternada');
                    }
                });
                editor.addAction({
                    id: 'markdown-lista-tarefas',
                    label: 'Markdown: Lista de tarefas',
                    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Digit9],
                    precondition: precondicaoMarkdown,
                    run: function () {
                        editarLinhasMarkdown(transformarListaTarefasMarkdown, 'Lista de tarefas alternada');
                    }
                });
                editor.addAction({
                    id: 'markdown-citacao',
                    label: 'Markdown: Citação',
                    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyQ],
                    precondition: precondicaoMarkdown,
                    run: function () {
                        editarLinhasMarkdown(transformarCitacaoMarkdown, 'Citação alternada');
                    }
                });
            }

            // Versão homelab: o servidor (servidor/servidor.js) oferece uma pasta dele em /api. As classes
            // abaixo imitam as pastas e os arquivos do navegador (File System Access API), para o painel de
            // pastas usar o servidor sem mudar. Só guardam dados simples, para caberem no IndexedDB.
            function erroDoServidor(status, mensagem) {
                const nomes = { 401: 'NotAllowedError', 404: 'NotFoundError', 409: 'InvalidModificationError', 412: 'ConflitoServidor' };
                const erro = new Error(mensagem || `o servidor respondeu ${status}`);
                erro.name = nomes[status] || 'ErroServidor';
                erro.status = status;
                return erro;
            }

            async function pedirAoServidor(metodo, rota, parametros, opcoes) {
                const consulta = parametros ? `?${new URLSearchParams(parametros)}` : '';
                let resposta;
                try {
                    resposta = await fetch(`/api/${rota}${consulta}`, {
                        method: metodo,
                        credentials: 'same-origin',
                        cache: 'no-store',
                        ...opcoes
                    });
                } catch (erro) {
                    throw erroDoServidor(0, 'o servidor não respondeu. Confira se o container está ligado.');
                }
                if (!resposta.ok) {
                    let mensagem;
                    try {
                        mensagem = (await resposta.json()).erro;
                    } catch (erro) {
                        mensagem = undefined;
                    }
                    if (resposta.status === 401 && servidorPastas) {
                        servidorPastas.autenticado = false;
                    }
                    throw erroDoServidor(resposta.status, mensagem);
                }
                return resposta;
            }

            function permissaoServidor() {
                return servidorPastas && (!servidorPastas.senha || servidorPastas.autenticado) ? 'granted' : 'prompt';
            }

            class ArquivoServidor {
                constructor(caminho, nome) {
                    this.servidor = true;
                    this.kind = 'file';
                    this.caminho = caminho;
                    this.name = nome;
                    // Versão do arquivo lida do servidor; gravar por cima de outra versão dá conflito.
                    this.etag = undefined;
                }

                async getFile() {
                    const resposta = await pedirAoServidor('GET', 'arquivo', { caminho: this.caminho });
                    this.etag = resposta.headers.get('ETag') || undefined;
                    return new File([await resposta.blob()], this.name);
                }

                async createWritable() {
                    const arquivo = this;
                    const partes = [];
                    return {
                        write: async function (dados) {
                            partes.push(dados);
                        },
                        close: async function () {
                            const cabecalhos = arquivo.etag ? { 'If-Match': arquivo.etag } : {};
                            const resposta = await pedirAoServidor('PUT', 'arquivo', { caminho: arquivo.caminho }, {
                                headers: cabecalhos,
                                body: new Blob(partes)
                            });
                            arquivo.etag = resposta.headers.get('ETag') || undefined;
                        }
                    };
                }

                async move(novoNome) {
                    const destino = juntarCaminhoPasta(paiDoCaminhoPasta(this.caminho), novoNome);
                    await pedirAoServidor('POST', 'mover', undefined, {
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ de: this.caminho, para: destino })
                    });
                    this.caminho = destino;
                    this.name = novoNome;
                }

                async isSameEntry(outro) {
                    return Boolean(outro && outro.servidor && outro.kind === this.kind && outro.caminho === this.caminho);
                }

                async queryPermission() {
                    return permissaoServidor();
                }

                async requestPermission() {
                    return permissaoServidor();
                }
            }

            class PastaServidor {
                constructor(caminho, nome) {
                    this.servidor = true;
                    this.kind = 'directory';
                    this.caminho = caminho;
                    this.name = nome;
                }

                async *entries() {
                    const resposta = await pedirAoServidor('GET', 'listar', { caminho: this.caminho });
                    for (const item of (await resposta.json()).itens) {
                        const caminho = juntarCaminhoPasta(this.caminho, item.nome);
                        yield [item.nome, item.tipo === 'directory' ? new PastaServidor(caminho, item.nome) : new ArquivoServidor(caminho, item.nome)];
                    }
                }

                async tipoDoFilho(nome) {
                    try {
                        return (await (await pedirAoServidor('GET', 'info', { caminho: juntarCaminhoPasta(this.caminho, nome) })).json()).tipo;
                    } catch (erro) {
                        if (erro.status === 404) {
                            return undefined;
                        }
                        throw erro;
                    }
                }

                async getFileHandle(nome, opcoes) {
                    const caminho = juntarCaminhoPasta(this.caminho, nome);
                    const tipo = await this.tipoDoFilho(nome);
                    if (tipo === 'directory') {
                        throw new DOMException(`"${nome}" é uma pasta.`, 'TypeMismatchError');
                    }
                    const arquivo = new ArquivoServidor(caminho, nome);
                    if (!tipo && !(opcoes && opcoes.create)) {
                        throw new DOMException(`"${nome}" não existe.`, 'NotFoundError');
                    }
                    if (!tipo) {
                        const resposta = await pedirAoServidor('PUT', 'arquivo', { caminho: caminho }, { headers: { 'If-None-Match': '*' }, body: '' });
                        arquivo.etag = resposta.headers.get('ETag') || undefined;
                    }
                    return arquivo;
                }

                async getDirectoryHandle(nome, opcoes) {
                    const caminho = juntarCaminhoPasta(this.caminho, nome);
                    const tipo = await this.tipoDoFilho(nome);
                    if (tipo === 'file') {
                        throw new DOMException(`"${nome}" é um arquivo.`, 'TypeMismatchError');
                    }
                    if (!tipo && !(opcoes && opcoes.create)) {
                        throw new DOMException(`"${nome}" não existe.`, 'NotFoundError');
                    }
                    if (!tipo) {
                        await pedirAoServidor('POST', 'pasta', { caminho: caminho });
                    }
                    return new PastaServidor(caminho, nome);
                }

                // No servidor, excluir não apaga: o item vai para a lixeira da pasta (.editor/lixeira).
                async removeEntry(nome) {
                    await pedirAoServidor('DELETE', 'item', { caminho: juntarCaminhoPasta(this.caminho, nome) });
                }

                async resolve(outro) {
                    if (!outro || !outro.servidor) {
                        return null;
                    }
                    if (!this.caminho) {
                        return outro.caminho.split('/');
                    }
                    return outro.caminho.startsWith(`${this.caminho}/`) ? outro.caminho.slice(this.caminho.length + 1).split('/') : null;
                }

                async isSameEntry(outro) {
                    return Boolean(outro && outro.servidor && outro.kind === this.kind && outro.caminho === this.caminho);
                }

                async queryPermission() {
                    return permissaoServidor();
                }

                async requestPermission() {
                    return permissaoServidor();
                }
            }

            // O IndexedDB guarda só os dados; ao ler a sessão, os objetos voltam a ter as funções.
            function reviverManipuladorServidor(manipulador) {
                if (!manipulador || !manipulador.servidor || manipulador instanceof ArquivoServidor || manipulador instanceof PastaServidor) {
                    return manipulador;
                }
                const revivido = manipulador.kind === 'directory'
                    ? new PastaServidor(manipulador.caminho, manipulador.name)
                    : new ArquivoServidor(manipulador.caminho, manipulador.name);
                if (manipulador.etag) {
                    revivido.etag = manipulador.etag;
                }
                return revivido;
            }

            function reviverSessaoServidor(sessao) {
                if (!sessao || !Array.isArray(sessao.documentos)) {
                    return sessao;
                }
                sessao.documentos.forEach(function (registro) {
                    if (registro) {
                        registro.manipulador = reviverManipuladorServidor(registro.manipulador);
                    }
                });
                if (sessao.pasta) {
                    sessao.pasta.manipulador = reviverManipuladorServidor(sessao.pasta.manipulador);
                }
                return sessao;
            }

            // Na versão online (Cloudflare) /api não existe; no homelab, responde com o nome da pasta.
            async function detectarServidorPastas() {
                const controle = typeof AbortController === 'function' ? new AbortController() : undefined;
                const temporizador = window.setTimeout(function () {
                    if (controle) {
                        controle.abort();
                    }
                }, 3000);
                try {
                    const resposta = await fetch('/api/estado', { cache: 'no-store', credentials: 'same-origin', signal: controle && controle.signal });
                    const tipo = resposta.headers.get('Content-Type') || '';
                    if (!resposta.ok || !tipo.includes('application/json')) {
                        return undefined;
                    }
                    const dados = await resposta.json();
                    return dados && dados.versao === 1 ? { nome: dados.nome, senha: Boolean(dados.senha), autenticado: Boolean(dados.autenticado) } : undefined;
                } catch (erro) {
                    return undefined;
                } finally {
                    window.clearTimeout(temporizador);
                }
            }

            function podeAbrirPastas() {
                return Boolean(servidorPastas) || aberturaPastaDisponivel;
            }

            function usandoPastaDoServidor() {
                return Boolean(pastas.raiz && pastas.raiz.servidor && pastas.permitida);
            }

            async function entrarNoServidor(evento) {
                evento.preventDefault();
                const campo = document.getElementById('pastas-senha-campo');
                try {
                    await pedirAoServidor('POST', 'entrar', undefined, {
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ senha: campo.value })
                    });
                } catch (erro) {
                    campo.select();
                    mostrarErroPasta(erro.status === 401 ? 'Senha incorreta.' : `Não foi possível entrar: ${erro.message}`);
                    return;
                }
                campo.value = '';
                servidorPastas.autenticado = true;
                await permitirAcessoPasta();
            }

            // No Zen o editor normalmente só baixa cópias; no homelab, salvar grava na pasta do servidor.
            function configurarModoServidor() {
                if (!servidorPastas || gravacaoDiretaDisponivel) {
                    return;
                }
                botaoSalvar.querySelector('.rotulo').textContent = 'Salvar';
                botaoSalvar.querySelector('.icone').innerHTML = '<path d="M5 3h11l3 3v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M7 3v5h8V3"/><path d="M7 21v-7h10v7"/>';
                botaoSalvar.title = 'Salvar na pasta do servidor (Ctrl+S)';
                botaoSalvarComo.title = 'Salvar como, na pasta do servidor (Ctrl+Shift+S)';
                botaoSalvarComo.setAttribute('aria-label', 'Salvar como');
                document.body.classList.remove('sem-gravacao-direta');
                avisoArquivos.hidden = true;
            }

            // Documento novo (ou "Salvar como") no homelab: pergunta o nome e grava na pasta escolhida na
            // árvore, ou na pasta do servidor.
            async function salvarNoServidorComo(documento) {
                const escolhido = pastas.escolhido && pastas.focado ? pastas.nos.get(pastas.focado) : undefined;
                const pasta = !escolhido ? '' : (escolhido.tipo === 'directory' ? escolhido.caminho : paiDoCaminhoPasta(escolhido.caminho));
                const nome = (window.prompt(`Nome do arquivo (na pasta ${pasta || pastas.raiz.name} do servidor):`, obterNomeSugerido(documento)) || '').trim();
                if (!nome) {
                    return;
                }
                await lerFilhosPasta(pasta);
                const erroNome = validarNomePasta(nome, { pasta: pasta });
                if (erroNome) {
                    atualizarEstado(erroNome);
                    return;
                }
                const manipulador = await pastas.nos.get(pasta).manipulador.getFileHandle(nome, { create: true });
                await gravarNoManipulador(manipulador, documento.modelo.getValue());
                documento.nome = nome;
                documento.manipulador = manipulador;
                documento.ehSemTitulo = false;
                documento.caminhoPasta = juntarCaminhoPasta(pasta, nome);
                if (pasta) {
                    pastas.expandidas.add(pasta);
                }
                marcarDocumentoSalvo(documento, 'Arquivo salvo no servidor');
                await atualizarArvorePastas();
            }

            // Painel de pastas (Edge e Chrome): uma pasta do computador numa árvore à esquerda, para abrir,
            // criar, renomear e excluir arquivos. Cada pasta é lida só quando é expandida, para não travar
            // com pastas grandes.
            function lerPreferenciasPastas() {
                try {
                    const salvas = JSON.parse(localStorage.getItem(chavePainelPastas) || '{}');
                    return {
                        painelAberto: salvas.aberto === true,
                        largura: Number.isFinite(salvas.largura) ? limitarLarguraPastas(salvas.largura) : 240
                    };
                } catch (erro) {
                    return { painelAberto: false, largura: 240 };
                }
            }

            function gravarPreferenciasPastas() {
                try {
                    localStorage.setItem(chavePainelPastas, JSON.stringify({ aberto: pastas.painelAberto, largura: pastas.largura }));
                } catch (erro) {
                    return;
                }
            }

            function limitarLarguraPastas(largura) {
                return Math.round(Math.min(Math.max(largura, 160), 480));
            }

            function aplicarPainelPastas() {
                painelPastas.hidden = !pastas.painelAberto;
                alcaPainelPastas.hidden = !pastas.painelAberto;
                botaoTrilhoPastas.setAttribute('aria-pressed', pastas.painelAberto ? 'true' : 'false');
                painelPastas.style.width = `${pastas.largura}px`;
                alcaPainelPastas.setAttribute('aria-valuenow', String(pastas.largura));
                renderizarArvorePastas();
            }

            function alternarPainelPastas(abrir) {
                pastas.painelAberto = typeof abrir === 'boolean' ? abrir : !pastas.painelAberto;
                gravarPreferenciasPastas();
                aplicarPainelPastas();
                if (pastas.painelAberto) {
                    focarPainelPastas();
                    return;
                }
                fecharMenuPastas(false);
                if (visualizacaoAtual === 'editor') {
                    focarTexto();
                } else {
                    botaoTrilhoPastas.focus();
                }
            }

            function focarPainelPastas() {
                if (!arvorePastas.hidden && arvorePastas.querySelector('[role="treeitem"]')) {
                    focarItemArvorePastas(pastas.focado);
                    return;
                }
                const botao = [document.getElementById('pastas-senha-campo'), botaoAbrirPasta(), document.getElementById('pastas-permitir'), document.getElementById('pastas-novo-arquivo')].find(function (elemento) {
                    return !elemento.closest('[hidden]');
                });
                (botao || botaoTrilhoPastas).focus();
            }

            function botaoAbrirPasta() {
                return document.getElementById('pastas-abrir');
            }

            function juntarCaminhoPasta(pai, nome) {
                return pai ? `${pai}/${nome}` : nome;
            }

            function paiDoCaminhoPasta(caminho) {
                const indice = caminho.lastIndexOf('/');
                return indice < 0 ? '' : caminho.slice(0, indice);
            }

            function estaDentroDoCaminhoPasta(caminho, base) {
                return caminho === base || caminho.startsWith(`${base}/`);
            }

            function ehArquivoBinario(nome) {
                const extensao = nome.includes('.') ? nome.split('.').pop().toLowerCase() : '';
                return extensoesBinarias.includes(extensao);
            }

            function mostrarErroPasta(mensagem) {
                erroPastas.textContent = mensagem || '';
                erroPastas.hidden = !mensagem;
                if (mensagem) {
                    atualizarEstado(mensagem);
                }
            }

            function tratarErroPasta(erro, mensagem) {
                if (erro && (erro.name === 'NotAllowedError' || erro.name === 'SecurityError')) {
                    pastas.permitida = false;
                    renderizarArvorePastas();
                }
                const detalhe = erro && erro.name === 'NotFoundError'
                    ? 'o item não existe mais. Clique em Atualizar.'
                    : (erro && erro.message ? erro.message : 'erro desconhecido');
                mostrarErroPasta(`${mensagem}: ${detalhe}`);
            }

            function compararItensPasta(itemA, itemB) {
                if (itemA.tipo !== itemB.tipo) {
                    return itemA.tipo === 'directory' ? -1 : 1;
                }
                return itemA.nome.localeCompare(itemB.nome, 'pt-BR', { numeric: true, sensitivity: 'base' });
            }

            function removerNosPasta(caminho) {
                Array.from(pastas.nos.keys()).forEach(function (chave) {
                    if (estaDentroDoCaminhoPasta(chave, caminho)) {
                        pastas.nos.delete(chave);
                    }
                });
                Array.from(pastas.expandidas).forEach(function (chave) {
                    if (estaDentroDoCaminhoPasta(chave, caminho)) {
                        pastas.expandidas.delete(chave);
                    }
                });
            }

            async function lerFilhosPasta(caminho) {
                const no = pastas.nos.get(caminho);
                const itens = [];
                for await (const [nome, manipulador] of no.manipulador.entries()) {
                    if (manipulador.kind === 'directory' && pastasIgnoradas.includes(nome)) {
                        continue;
                    }
                    itens.push({ nome: nome, tipo: manipulador.kind, manipulador: manipulador });
                }
                itens.sort(compararItensPasta);
                const caminhos = itens.map(function (item) {
                    return juntarCaminhoPasta(caminho, item.nome);
                });
                (no.filhos || []).forEach(function (filho) {
                    if (!caminhos.includes(filho)) {
                        removerNosPasta(filho);
                    }
                });
                itens.forEach(function (item, indice) {
                    const existente = pastas.nos.get(caminhos[indice]);
                    if (existente && existente.tipo === item.tipo) {
                        existente.manipulador = item.manipulador;
                        return;
                    }
                    if (existente) {
                        removerNosPasta(caminhos[indice]);
                    }
                    pastas.nos.set(caminhos[indice], {
                        caminho: caminhos[indice],
                        nome: item.nome,
                        tipo: item.tipo,
                        manipulador: item.manipulador,
                        filhos: undefined
                    });
                });
                no.filhos = caminhos;
            }

            // Relê a pasta aberta e as pastas expandidas, para mostrar o que mudou no computador.
            async function atualizarArvorePastas() {
                if (!pastas.raiz || !pastas.permitida) {
                    return;
                }
                try {
                    await lerFilhosPasta('');
                    const expandidas = Array.from(pastas.expandidas).sort(function (caminhoA, caminhoB) {
                        return caminhoA.split('/').length - caminhoB.split('/').length;
                    });
                    for (const caminho of expandidas) {
                        const no = pastas.nos.get(caminho);
                        if (!no || no.tipo !== 'directory') {
                            pastas.expandidas.delete(caminho);
                            continue;
                        }
                        await lerFilhosPasta(caminho);
                    }
                } catch (erro) {
                    tratarErroPasta(erro, 'Não foi possível ler a pasta');
                }
                renderizarArvorePastas();
            }

            async function verificarPermissaoPasta(manipulador, pedir) {
                if (typeof manipulador.queryPermission !== 'function') {
                    return true;
                }
                let permissao = await manipulador.queryPermission({ mode: 'readwrite' });
                if (permissao !== 'granted' && pedir && typeof manipulador.requestPermission === 'function') {
                    permissao = await manipulador.requestPermission({ mode: 'readwrite' });
                }
                return permissao === 'granted';
            }

            // Descobre quais abas abertas são arquivos de dentro da pasta, para destacá-las na árvore.
            async function associarDocumentoPasta(documento) {
                let caminho;
                if (pastas.raiz && documento.manipulador && typeof pastas.raiz.resolve === 'function') {
                    try {
                        const partes = await pastas.raiz.resolve(documento.manipulador);
                        caminho = partes && partes.length ? partes.join('/') : undefined;
                    } catch (erro) {
                        caminho = undefined;
                    }
                }
                documento.caminhoPasta = caminho;
            }

            async function associarDocumentosPasta() {
                for (const documento of documentos) {
                    await associarDocumentoPasta(documento);
                }
                destacarDocumentoNaArvore();
                agendarPersistenciaSessao();
            }

            async function usarPastaRaiz(manipulador, expandidas, pedirPermissao) {
                pastas.raiz = manipulador;
                pastas.nos = new Map([['', { caminho: '', nome: manipulador.name, tipo: 'directory', manipulador: manipulador, filhos: undefined }]]);
                pastas.expandidas = new Set(expandidas || []);
                pastas.focado = undefined;
                pastas.escolhido = false;
                pastas.edicao = undefined;
                mostrarErroPasta('');
                try {
                    pastas.permitida = await verificarPermissaoPasta(manipulador, pedirPermissao);
                } catch (erro) {
                    pastas.permitida = false;
                }
                renderizarArvorePastas();
                agendarPersistenciaSessao();
                if (pastas.permitida) {
                    await atualizarArvorePastas();
                    await associarDocumentosPasta();
                }
            }

            async function escolherPasta() {
                if (servidorPastas) {
                    // No homelab, a pasta é sempre a do servidor.
                    if (!pastas.painelAberto) {
                        alternarPainelPastas(true);
                    }
                    await usarPastaRaiz(new PastaServidor('', servidorPastas.nome), [], false);
                    if (pastas.permitida) {
                        atualizarEstado(`Pasta aberta: ${servidorPastas.nome}`);
                    }
                    focarPainelPastas();
                    return;
                }
                if (!aberturaPastaDisponivel) {
                    return;
                }
                let manipulador;
                try {
                    manipulador = await window.showDirectoryPicker({ id: 'editor-portable', mode: 'readwrite' });
                } catch (erro) {
                    if (!erro || erro.name !== 'AbortError') {
                        tratarErroPasta(erro, 'Não foi possível abrir a pasta');
                    }
                    return;
                }
                if (!pastas.painelAberto) {
                    alternarPainelPastas(true);
                }
                await usarPastaRaiz(manipulador, [], true);
                if (!pastas.permitida) {
                    mostrarErroPasta('O navegador não liberou o acesso à pasta.');
                    return;
                }
                atualizarEstado(`Pasta aberta: ${manipulador.name}`);
                focarPainelPastas();
            }

            // Depois de recarregar a página, o navegador só devolve o acesso com um clique da pessoa.
            async function permitirAcessoPasta() {
                if (!pastas.raiz) {
                    return;
                }
                try {
                    pastas.permitida = await verificarPermissaoPasta(pastas.raiz, true);
                } catch (erro) {
                    pastas.permitida = false;
                }
                if (!pastas.permitida) {
                    renderizarArvorePastas();
                    mostrarErroPasta('O navegador não liberou o acesso à pasta.');
                    return;
                }
                mostrarErroPasta('');
                await atualizarArvorePastas();
                await associarDocumentosPasta();
                atualizarEstado(`Pasta aberta: ${pastas.raiz.name}`);
                focarPainelPastas();
            }

            function restaurarPastaDaSessao(sessao) {
                const pasta = sessao && sessao.pasta;
                if (servidorPastas) {
                    // No homelab a pasta do servidor abre sozinha, a não ser que a pessoa tenha fechado.
                    if (!pasta || pasta.aberta) {
                        const expandidas = pasta && pasta.manipulador && pasta.manipulador.servidor && Array.isArray(pasta.expandidas) ? pasta.expandidas : [];
                        usarPastaRaiz(new PastaServidor('', servidorPastas.nome), expandidas, false);
                    }
                    return;
                }
                if (!aberturaPastaDisponivel || !pasta || !pasta.aberta || !pasta.manipulador || pasta.manipulador.kind !== 'directory' || pasta.manipulador.servidor) {
                    return;
                }
                usarPastaRaiz(pasta.manipulador, Array.isArray(pasta.expandidas) ? pasta.expandidas : [], false);
            }

            // Fecha só o painel: os arquivos continuam no computador e as abas continuam abertas.
            function fecharPastaRaiz() {
                pastas.raiz = undefined;
                pastas.permitida = false;
                pastas.nos = new Map();
                pastas.expandidas = new Set();
                pastas.focado = undefined;
                pastas.escolhido = false;
                pastas.edicao = undefined;
                documentos.forEach(function (documento) {
                    documento.caminhoPasta = undefined;
                });
                fecharMenuPastas(false);
                mostrarErroPasta('');
                renderizarArvorePastas();
                agendarPersistenciaSessao();
                atualizarEstado('Pasta fechada');
                botaoAbrirPasta().focus();
            }

            function criarIconeArvorePastas(no, expandida) {
                const icone = document.createElement('span');
                icone.className = 'arvore-icone';
                icone.setAttribute('aria-hidden', 'true');
                if (no.tipo === 'directory') {
                    icone.classList.add('pasta');
                    icone.innerHTML = expandida ? iconesPastas.pastaAberta : iconesPastas.pasta;
                    return icone;
                }
                const linguagemArquivo = obterLinguagemDoArquivo(no.nome);
                if (linguagemArquivo !== 'plaintext' || /\.txt$/i.test(no.nome)) {
                    icone.classList.add('aba-linguagem', linguagemArquivo);
                    icone.textContent = siglasLinguagem[linguagemArquivo];
                } else {
                    icone.innerHTML = iconesPastas.arquivo;
                }
                return icone;
            }

            function criarEntradaArvorePastas(edicao) {
                const entrada = document.createElement('input');
                const rotulos = {
                    'novo-arquivo': 'Nome do novo arquivo',
                    'nova-pasta': 'Nome da nova pasta',
                    renomear: 'Novo nome'
                };
                entrada.className = 'arvore-entrada';
                entrada.type = 'text';
                entrada.value = edicao.valor;
                entrada.spellcheck = false;
                entrada.autocomplete = 'off';
                entrada.setAttribute('aria-label', rotulos[edicao.tipo]);
                entrada.addEventListener('keydown', function (evento) {
                    evento.stopPropagation();
                    if (evento.key === 'Enter') {
                        evento.preventDefault();
                        confirmarEdicaoPasta(entrada.value);
                    } else if (evento.key === 'Escape') {
                        evento.preventDefault();
                        cancelarEdicaoPasta();
                    }
                });
                entrada.addEventListener('input', function () {
                    edicao.valor = entrada.value;
                    const erro = validarNomePasta(entrada.value, edicao);
                    entrada.setAttribute('aria-invalid', erro ? 'true' : 'false');
                    mostrarErroPasta(erro && entrada.value.trim() ? erro : '');
                });
                // Clicar fora confirma, como no VS Code; com um nome inválido, desiste.
                entrada.addEventListener('blur', function () {
                    if (pastas.edicao !== edicao || edicao.confirmando || !entrada.isConnected) {
                        return;
                    }
                    if (validarNomePasta(entrada.value, edicao) || (edicao.tipo === 'renomear' && entrada.value.trim() === edicao.nomeAtual)) {
                        cancelarEdicaoPasta(true);
                    } else {
                        confirmarEdicaoPasta(entrada.value);
                    }
                });
                entrada.addEventListener('click', function (evento) {
                    evento.stopPropagation();
                });
                return entrada;
            }

            function criarLinhaArvorePastas(nivel) {
                const linha = document.createElement('div');
                linha.className = 'arvore-linha';
                linha.style.paddingLeft = `${4 + (nivel - 1) * 14}px`;
                return linha;
            }

            function montarItensArvorePastas(lista, caminhoPasta, nivel) {
                const no = pastas.nos.get(caminhoPasta);
                const edicao = pastas.edicao;
                if (edicao && edicao.tipo !== 'renomear' && edicao.pasta === caminhoPasta) {
                    const itemNovo = document.createElement('li');
                    const linhaNova = criarLinhaArvorePastas(nivel);
                    const seta = document.createElement('span');
                    seta.className = 'arvore-seta';
                    itemNovo.setAttribute('role', 'none');
                    itemNovo.className = 'arvore-item arvore-novo';
                    linhaNova.appendChild(seta);
                    linhaNova.appendChild(criarIconeArvorePastas({ tipo: edicao.tipo === 'nova-pasta' ? 'directory' : 'file', nome: edicao.valor }, false));
                    linhaNova.appendChild(criarEntradaArvorePastas(edicao));
                    itemNovo.appendChild(linhaNova);
                    lista.appendChild(itemNovo);
                } else if (no.filhos && !no.filhos.length) {
                    const vazio = document.createElement('li');
                    vazio.setAttribute('role', 'none');
                    vazio.className = 'arvore-vazia';
                    vazio.style.paddingLeft = `${4 + (nivel - 1) * 14 + 46}px`;
                    vazio.textContent = 'Pasta vazia';
                    lista.appendChild(vazio);
                }
                (no.filhos || []).forEach(function (caminho) {
                    const filho = pastas.nos.get(caminho);
                    if (!filho) {
                        return;
                    }
                    const ehPasta = filho.tipo === 'directory';
                    const expandida = ehPasta && pastas.expandidas.has(caminho);
                    const item = document.createElement('li');
                    const linha = criarLinhaArvorePastas(nivel);
                    const seta = document.createElement('span');
                    item.setAttribute('role', 'treeitem');
                    item.setAttribute('aria-level', String(nivel));
                    item.setAttribute('aria-selected', 'false');
                    item.className = `arvore-item ${ehPasta ? 'eh-pasta' : 'eh-arquivo'}`;
                    item.dataset.caminho = caminho;
                    item.tabIndex = -1;
                    if (ehPasta) {
                        item.setAttribute('aria-expanded', expandida ? 'true' : 'false');
                    }
                    seta.className = 'arvore-seta';
                    seta.setAttribute('aria-hidden', 'true');
                    if (ehPasta) {
                        seta.innerHTML = iconesPastas.seta;
                    }
                    linha.appendChild(seta);
                    linha.appendChild(criarIconeArvorePastas(filho, expandida));
                    if (edicao && edicao.tipo === 'renomear' && edicao.caminho === caminho) {
                        linha.appendChild(criarEntradaArvorePastas(edicao));
                    } else {
                        const nome = document.createElement('span');
                        const botaoMais = document.createElement('button');
                        nome.className = 'arvore-nome';
                        nome.textContent = filho.nome;
                        linha.title = caminho;
                        botaoMais.className = 'arvore-mais';
                        botaoMais.type = 'button';
                        botaoMais.tabIndex = -1;
                        botaoMais.innerHTML = iconesPastas.mais;
                        botaoMais.title = 'Ações';
                        botaoMais.setAttribute('aria-label', `Ações de ${filho.nome}`);
                        linha.appendChild(nome);
                        linha.appendChild(botaoMais);
                    }
                    item.appendChild(linha);
                    lista.appendChild(item);
                    if (expandida && filho.filhos) {
                        const grupo = document.createElement('ul');
                        grupo.setAttribute('role', 'group');
                        item.appendChild(grupo);
                        montarItensArvorePastas(grupo, caminho, nivel + 1);
                    }
                });
            }

            function renderizarArvorePastas() {
                const comPasta = Boolean(pastas.raiz);
                const tinhaFoco = painelPastas.contains(document.activeElement) && document.activeElement !== erroPastas;
                const pedeSenha = comPasta && !pastas.permitida && Boolean(pastas.raiz.servidor);
                semSuportePastas.hidden = podeAbrirPastas();
                vazioPastas.hidden = !podeAbrirPastas() || comPasta;
                botaoAbrirPasta().textContent = servidorPastas ? 'Abrir a pasta do servidor' : 'Abrir pasta';
                permissaoPastas.hidden = !comPasta || pastas.permitida || pedeSenha;
                senhaPastas.hidden = !pedeSenha;
                arvorePastas.hidden = !comPasta || !pastas.permitida;
                acoesPastas.hidden = !comPasta;
                acoesPastas.querySelectorAll('button:not(#pastas-fechar)').forEach(function (botao) {
                    botao.disabled = !pastas.permitida;
                });
                tituloPastas.textContent = comPasta ? pastas.raiz.name : 'Pastas';
                tituloPastas.title = comPasta ? `Pasta aberta: ${pastas.raiz.name}` : '';
                if (comPasta && !pastas.permitida) {
                    textoPermissaoPastas.textContent = `Para mostrar os arquivos de "${pastas.raiz.name}", o navegador precisa da sua confirmação.`;
                }
                arvorePastas.textContent = '';
                if (!comPasta || !pastas.permitida || !pastas.nos.get('').filhos) {
                    return;
                }
                montarItensArvorePastas(arvorePastas, '', 1);
                const visiveis = itensVisiveisArvorePastas();
                if (!visiveis.includes(pastas.focado)) {
                    pastas.focado = visiveis[0];
                }
                arvorePastas.querySelectorAll('[role="treeitem"]').forEach(function (item) {
                    item.tabIndex = item.dataset.caminho === pastas.focado ? 0 : -1;
                });
                destacarDocumentoNaArvore();
                const entrada = arvorePastas.querySelector('.arvore-entrada');
                if (entrada) {
                    entrada.focus();
                } else if (tinhaFoco && pastas.focado !== undefined) {
                    focarItemArvorePastas(pastas.focado);
                }
            }

            function destacarDocumentoNaArvore() {
                const caminho = documentoAtual ? documentoAtual.caminhoPasta : undefined;
                arvorePastas.querySelectorAll('[role="treeitem"]').forEach(function (item) {
                    const atual = caminho !== undefined && item.dataset.caminho === caminho;
                    item.classList.toggle('atual', atual);
                    item.setAttribute('aria-selected', atual ? 'true' : 'false');
                });
            }

            function itensVisiveisArvorePastas() {
                return Array.from(arvorePastas.querySelectorAll('[role="treeitem"]')).map(function (item) {
                    return item.dataset.caminho;
                });
            }

            function itemArvorePastas(caminho) {
                return Array.from(arvorePastas.querySelectorAll('[role="treeitem"]')).find(function (item) {
                    return item.dataset.caminho === caminho;
                });
            }

            function focarItemArvorePastas(caminho) {
                const visiveis = itensVisiveisArvorePastas();
                const alvo = visiveis.includes(caminho) ? caminho : visiveis[0];
                pastas.focado = alvo;
                arvorePastas.querySelectorAll('[role="treeitem"]').forEach(function (item) {
                    item.tabIndex = item.dataset.caminho === alvo ? 0 : -1;
                });
                const item = itemArvorePastas(alvo);
                if (item) {
                    item.focus();
                } else {
                    focarPainelPastas();
                }
            }

            async function alternarPastaArvore(caminho, expandir) {
                const no = pastas.nos.get(caminho);
                if (!no || no.tipo !== 'directory') {
                    return;
                }
                const deveExpandir = typeof expandir === 'boolean' ? expandir : !pastas.expandidas.has(caminho);
                pastas.focado = caminho;
                if (deveExpandir) {
                    pastas.expandidas.add(caminho);
                    try {
                        await lerFilhosPasta(caminho);
                    } catch (erro) {
                        pastas.expandidas.delete(caminho);
                        tratarErroPasta(erro, `Não foi possível ler "${no.nome}"`);
                    }
                } else {
                    pastas.expandidas.delete(caminho);
                }
                renderizarArvorePastas();
                agendarPersistenciaSessao();
            }

            function recolherPastasArvore() {
                pastas.expandidas.clear();
                const visiveis = (pastas.nos.get('') || {}).filhos || [];
                if (!visiveis.includes(pastas.focado)) {
                    pastas.focado = pastas.focado ? pastas.focado.split('/')[0] : undefined;
                }
                renderizarArvorePastas();
                agendarPersistenciaSessao();
                focarItemArvorePastas(pastas.focado);
            }

            async function abrirArquivoDaPasta(caminho) {
                const no = pastas.nos.get(caminho);
                if (!no || no.tipo !== 'file') {
                    return;
                }
                pastas.focado = caminho;
                if (ehArquivoBinario(no.nome)) {
                    mostrarErroPasta(`"${no.nome}" não é um arquivo de texto e não abre no editor.`);
                    return;
                }
                let documento = documentos.find(function (item) {
                    return item.caminhoPasta === caminho;
                });
                if (!documento) {
                    for (const item of documentos) {
                        if (!item.manipulador || typeof item.manipulador.isSameEntry !== 'function') {
                            continue;
                        }
                        try {
                            if (await item.manipulador.isSameEntry(no.manipulador)) {
                                documento = item;
                                item.caminhoPasta = caminho;
                                break;
                            }
                        } catch (erro) {
                            continue;
                        }
                    }
                }
                if (documento) {
                    mostrarErroPasta('');
                    ativarDocumento(documento);
                    return;
                }
                let conteudo;
                try {
                    conteudo = await (await no.manipulador.getFile()).text();
                } catch (erro) {
                    tratarErroPasta(erro, `Não foi possível abrir "${no.nome}"`);
                    return;
                }
                // Dois cliques rápidos não abrem o arquivo duas vezes.
                documento = documentos.find(function (item) {
                    return item.caminhoPasta === caminho;
                });
                if (!documento) {
                    documento = criarDocumento(no.nome, conteudo, no.manipulador, false);
                    documento.caminhoPasta = caminho;
                    documentos.push(documento);
                }
                mostrarErroPasta('');
                ativarDocumento(documento, 'Arquivo aberto');
            }

            async function existeItemNaPasta(manipuladorPasta, nome) {
                for (const metodo of ['getFileHandle', 'getDirectoryHandle']) {
                    try {
                        await manipuladorPasta[metodo](nome);
                        return true;
                    } catch (erro) {
                        if (erro && erro.name === 'TypeMismatchError') {
                            return true;
                        }
                    }
                }
                return false;
            }

            function obterNomeLivrePasta(pasta, nomeBase) {
                const no = pastas.nos.get(pasta);
                const usados = new Set((no.filhos || []).map(function (caminho) {
                    return pastas.nos.get(caminho).nome.toLowerCase();
                }));
                const ponto = nomeBase.lastIndexOf('.');
                const raiz = ponto > 0 ? nomeBase.slice(0, ponto) : nomeBase;
                const extensao = ponto > 0 ? nomeBase.slice(ponto) : '';
                let nome = nomeBase;
                for (let indice = 2; usados.has(nome.toLowerCase()); indice += 1) {
                    nome = `${raiz}-${indice}${extensao}`;
                }
                return nome;
            }

            // As regras do Windows, que são as mais restritas, valem em qualquer sistema.
            function validarNomePasta(valor, edicao) {
                const nome = valor.trim();
                if (!nome) {
                    return 'Digite um nome.';
                }
                if (/[\\/:*?"<>|]/.test(nome)) {
                    return 'O nome não pode ter \\ / : * ? " < > |';
                }
                if (nome === '.' || nome === '..' || nome.endsWith('.')) {
                    return 'O nome não pode terminar com ponto.';
                }
                if (/^(con|prn|aux|nul|com\d|lpt\d)(\..*)?$/i.test(nome)) {
                    return 'Esse nome é reservado pelo Windows.';
                }
                const no = pastas.nos.get(edicao.pasta);
                const repetido = (no && no.filhos ? no.filhos : []).some(function (caminho) {
                    const nomeExistente = pastas.nos.get(caminho).nome;
                    return nomeExistente.toLowerCase() === nome.toLowerCase() && nomeExistente !== edicao.nomeAtual;
                });
                return repetido ? `Já existe "${nome}" nesta pasta.` : '';
            }

            async function iniciarEdicaoPasta(tipo, caminho) {
                if (!pastas.permitida) {
                    return;
                }
                fecharMenuPastas(false);
                // O modo Visual que ainda está carregando não pode tirar o foco do campo do nome.
                visual.focarAoMontar = false;
                if (tipo === 'renomear') {
                    const no = pastas.nos.get(caminho);
                    if (!no || !caminho) {
                        return;
                    }
                    pastas.edicao = { tipo: tipo, caminho: caminho, pasta: paiDoCaminhoPasta(caminho), nomeAtual: no.nome, valor: no.nome };
                } else {
                    // Num arquivo, cria ao lado dele; numa pasta, dentro dela.
                    const alvo = pastas.nos.get(caminho || '');
                    const pasta = !alvo ? '' : (alvo.tipo === 'directory' ? alvo.caminho : paiDoCaminhoPasta(alvo.caminho));
                    // Uma pasta já lida mostra o campo na hora (no servidor, ler de novo leva um instante);
                    // se o nome já existir no disco, a criação avisa.
                    if (!pastas.nos.get(pasta).filhos) {
                        try {
                            await lerFilhosPasta(pasta);
                        } catch (erro) {
                            tratarErroPasta(erro, 'Não foi possível ler a pasta');
                            return;
                        }
                    }
                    if (pasta) {
                        pastas.expandidas.add(pasta);
                    }
                    pastas.edicao = { tipo: tipo, pasta: pasta, valor: obterNomeLivrePasta(pasta, tipo === 'nova-pasta' ? 'nova-pasta' : 'novo-arquivo.md') };
                }
                mostrarErroPasta('');
                renderizarArvorePastas();
                const entrada = arvorePastas.querySelector('.arvore-entrada');
                if (entrada) {
                    const ponto = entrada.value.lastIndexOf('.');
                    const ehArquivo = tipo === 'novo-arquivo' || (tipo === 'renomear' && pastas.nos.get(caminho).tipo === 'file');
                    entrada.focus();
                    entrada.setSelectionRange(0, ehArquivo && ponto > 0 ? ponto : entrada.value.length);
                }
            }

            function cancelarEdicaoPasta(semFoco) {
                const edicao = pastas.edicao;
                if (!edicao) {
                    return;
                }
                pastas.edicao = undefined;
                mostrarErroPasta('');
                renderizarArvorePastas();
                if (!semFoco) {
                    focarItemArvorePastas(edicao.caminho || pastas.focado);
                }
            }

            async function confirmarEdicaoPasta(valor) {
                const edicao = pastas.edicao;
                if (!edicao || edicao.confirmando) {
                    return;
                }
                const nome = valor.trim();
                if (edicao.tipo === 'renomear' && nome === edicao.nomeAtual) {
                    cancelarEdicaoPasta();
                    return;
                }
                const erroNome = validarNomePasta(nome, edicao);
                if (erroNome) {
                    const entrada = arvorePastas.querySelector('.arvore-entrada');
                    if (entrada) {
                        entrada.setAttribute('aria-invalid', 'true');
                    }
                    mostrarErroPasta(erroNome);
                    return;
                }
                edicao.confirmando = true;
                const mensagens = {
                    'novo-arquivo': 'Não foi possível criar o arquivo',
                    'nova-pasta': 'Não foi possível criar a pasta',
                    renomear: 'Não foi possível renomear'
                };
                let caminhoNovo;
                try {
                    if (edicao.tipo === 'novo-arquivo') {
                        caminhoNovo = await criarItemNaPasta(edicao.pasta, nome, 'file');
                    } else if (edicao.tipo === 'nova-pasta') {
                        caminhoNovo = await criarItemNaPasta(edicao.pasta, nome, 'directory');
                    } else {
                        caminhoNovo = await renomearItemPasta(edicao.caminho, nome);
                    }
                } catch (erro) {
                    pastas.edicao = undefined;
                    renderizarArvorePastas();
                    tratarErroPasta(erro, mensagens[edicao.tipo]);
                    focarItemArvorePastas(edicao.caminho || pastas.focado);
                    return;
                }
                pastas.edicao = undefined;
                pastas.focado = caminhoNovo;
                await atualizarArvorePastas();
                agendarPersistenciaSessao();
                if (edicao.tipo === 'novo-arquivo') {
                    // Arquivo novo abre pronto para escrever; em Markdown, no modo Visual, como o botão Novo.
                    if (obterLinguagemDoArquivo(nome) === 'markdown') {
                        definirModoPreview('visual');
                    }
                    await abrirArquivoDaPasta(caminhoNovo);
                    atualizarEstado(`Arquivo criado: ${nome}`);
                    return;
                }
                focarItemArvorePastas(caminhoNovo);
                atualizarEstado(edicao.tipo === 'nova-pasta' ? `Pasta criada: ${nome}` : `Renomeado para ${nome}`);
            }

            async function criarItemNaPasta(pasta, nome, tipo) {
                const manipuladorPasta = pastas.nos.get(pasta).manipulador;
                if (await existeItemNaPasta(manipuladorPasta, nome)) {
                    throw new DOMException(`já existe "${nome}" nesta pasta.`, 'InvalidModificationError');
                }
                if (tipo === 'directory') {
                    await manipuladorPasta.getDirectoryHandle(nome, { create: true });
                } else {
                    await manipuladorPasta.getFileHandle(nome, { create: true });
                }
                if (pasta) {
                    pastas.expandidas.add(pasta);
                }
                return juntarCaminhoPasta(pasta, nome);
            }

            async function copiarArquivoParaPasta(origem, destino, nome) {
                const arquivo = await origem.getFile();
                const novo = await destino.getFileHandle(nome, { create: true });
                const gravavel = await novo.createWritable();
                await gravavel.write(arquivo);
                await gravavel.close();
            }

            async function copiarPastaParaPasta(origem, destino, nome) {
                const nova = await destino.getDirectoryHandle(nome, { create: true });
                for await (const [nomeFilho, filho] of origem.entries()) {
                    if (filho.kind === 'directory') {
                        await copiarPastaParaPasta(filho, nova, nomeFilho);
                    } else {
                        await copiarArquivoParaPasta(filho, nova, nomeFilho);
                    }
                }
            }

            async function obterManipuladorArquivoPasta(caminho) {
                const partes = caminho.split('/');
                let atual = pastas.raiz;
                for (const parte of partes.slice(0, -1)) {
                    atual = await atual.getDirectoryHandle(parte);
                }
                return atual.getFileHandle(partes[partes.length - 1]);
            }

            // Nem todo navegador renomeia direto (move). Nesse caso, copia com o nome novo e apaga o antigo.
            async function renomearItemPasta(caminho, novoNome) {
                const no = pastas.nos.get(caminho);
                const pasta = paiDoCaminhoPasta(caminho);
                const manipuladorPai = pastas.nos.get(pasta).manipulador;
                const soMaiusculas = no.nome.toLowerCase() === novoNome.toLowerCase();
                if (!soMaiusculas && await existeItemNaPasta(manipuladorPai, novoNome)) {
                    throw new DOMException(`já existe "${novoNome}" nesta pasta.`, 'InvalidModificationError');
                }
                let moveu = false;
                if (typeof no.manipulador.move === 'function') {
                    try {
                        await no.manipulador.move(novoNome);
                        moveu = true;
                    } catch (erro) {
                        if (soMaiusculas || (erro && erro.name === 'NotAllowedError')) {
                            throw erro;
                        }
                    }
                }
                if (!moveu) {
                    if (soMaiusculas) {
                        throw new DOMException('este navegador não troca só maiúsculas e minúsculas. Renomeie para outro nome e depois para o nome final.', 'NotSupportedError');
                    }
                    if (no.tipo === 'directory') {
                        await copiarPastaParaPasta(no.manipulador, manipuladorPai, novoNome);
                    } else {
                        await copiarArquivoParaPasta(no.manipulador, manipuladorPai, novoNome);
                    }
                    await manipuladorPai.removeEntry(no.nome, { recursive: no.tipo === 'directory' });
                }
                const caminhoNovo = juntarCaminhoPasta(pasta, novoNome);
                const expandidas = Array.from(pastas.expandidas).filter(function (item) {
                    return estaDentroDoCaminhoPasta(item, caminho);
                }).map(function (item) {
                    return caminhoNovo + item.slice(caminho.length);
                });
                removerNosPasta(caminho);
                expandidas.forEach(function (item) {
                    pastas.expandidas.add(item);
                });
                await lerFilhosPasta(pasta);
                await renomearDocumentosDaPasta(caminho, caminhoNovo);
                return caminhoNovo;
            }

            // As abas dos arquivos renomeados acompanham o nome novo (e a linguagem, se a extensão mudou).
            async function renomearDocumentosDaPasta(caminhoAntigo, caminhoNovo) {
                for (const documento of documentos) {
                    if (!documento.caminhoPasta || !estaDentroDoCaminhoPasta(documento.caminhoPasta, caminhoAntigo)) {
                        continue;
                    }
                    const caminhoDocumento = caminhoNovo + documento.caminhoPasta.slice(caminhoAntigo.length);
                    const anterior = documento.manipulador;
                    try {
                        documento.manipulador = await obterManipuladorArquivoPasta(caminhoDocumento);
                        // No servidor, a versão lida continua valendo para detectar conflitos.
                        if (anterior && anterior.etag && documento.manipulador.servidor) {
                            documento.manipulador.etag = anterior.etag;
                        }
                    } catch (erro) {
                        documento.manipulador = undefined;
                    }
                    documento.caminhoPasta = caminhoDocumento;
                    const nomeNovo = caminhoDocumento.split('/').pop();
                    if (nomeNovo === documento.nome) {
                        continue;
                    }
                    const linguagemAntiga = obterLinguagemDisponivel(obterLinguagemDoArquivo(documento.nome));
                    const linguagemNova = obterLinguagemDisponivel(obterLinguagemDoArquivo(nomeNovo));
                    documento.nome = nomeNovo;
                    if (linguagemNova !== linguagemAntiga && documento.modelo.getLanguageId() === linguagemAntiga) {
                        monaco.editor.setModelLanguage(documento.modelo, linguagemNova);
                        if (documento === documentoAtual) {
                            linguagem.value = linguagemNova;
                        }
                    }
                }
                atualizarInterfaceDocumento();
                agendarPersistenciaSessao();
            }

            // Excluir pela API do navegador é definitivo (não vai para a Lixeira), por isso sempre pergunta.
            async function excluirItemPasta(caminho) {
                fecharMenuPastas(false);
                const no = pastas.nos.get(caminho);
                if (!no || !caminho || !pastas.permitida) {
                    return;
                }
                const ehPasta = no.tipo === 'directory';
                const vaiParaLixeira = Boolean(pastas.raiz.servidor);
                const abertos = documentos.filter(function (documento) {
                    return documento.caminhoPasta && estaDentroDoCaminhoPasta(documento.caminhoPasta, caminho);
                });
                const comAlteracoes = abertos.filter(function (documento) {
                    return documento.modificacoesPendentes;
                });
                let mensagem = ehPasta
                    ? `Excluir a pasta "${no.nome}" e tudo o que está dentro dela?`
                    : `Excluir "${no.nome}"?`;
                if (vaiParaLixeira) {
                    mensagem += ` ${ehPasta ? 'Ela vai' : 'O arquivo vai'} para a lixeira do servidor (.editor/lixeira) e fica lá por 30 dias.`;
                } else {
                    mensagem += ehPasta ? ' Ela é apagada do computador e não vai para a Lixeira.' : ' O arquivo é apagado do computador e não vai para a Lixeira.';
                }
                if (comAlteracoes.length) {
                    const nomes = comAlteracoes.map(function (documento) {
                        return documento.nome;
                    }).join(', ');
                    mensagem += ` Atenção: ${nomes} ${comAlteracoes.length === 1 ? 'está aberto' : 'estão abertos'} com alterações não salvas. A aba continua aberta com o texto, mas sem arquivo.`;
                }
                if (!await confirmar(mensagem, 'Excluir')) {
                    focarItemArvorePastas(caminho);
                    return;
                }
                const visiveis = itensVisiveisArvorePastas().filter(function (item) {
                    return item === caminho || !estaDentroDoCaminhoPasta(item, caminho);
                });
                const indice = visiveis.indexOf(caminho);
                const proximo = visiveis[indice + 1] || visiveis[indice - 1];
                try {
                    await pastas.nos.get(paiDoCaminhoPasta(caminho)).manipulador.removeEntry(no.nome, { recursive: ehPasta });
                } catch (erro) {
                    tratarErroPasta(erro, `Não foi possível excluir "${no.nome}"`);
                    return;
                }
                for (const documento of abertos) {
                    if (documento.modificacoesPendentes) {
                        documento.manipulador = undefined;
                        documento.caminhoPasta = undefined;
                    } else {
                        await fecharDocumento(documento);
                    }
                }
                removerNosPasta(caminho);
                pastas.focado = proximo;
                await atualizarArvorePastas();
                atualizarInterfaceDocumento();
                agendarPersistenciaSessao();
                atualizarEstado(ehPasta ? `Pasta excluída: ${no.nome}` : `Arquivo excluído: ${no.nome}`);
                focarItemArvorePastas(proximo);
            }

            function abrirMenuPastas(caminho, x, y) {
                if (!pastas.permitida) {
                    return;
                }
                pastas.menu = caminho;
                if (caminho) {
                    pastas.focado = caminho;
                }
                menuPastas.querySelectorAll('[data-acao="renomear"], [data-acao="excluir"]').forEach(function (botao) {
                    botao.hidden = !caminho;
                });
                menuPastas.hidden = false;
                menuPastas.style.left = `${Math.max(4, Math.min(x, window.innerWidth - menuPastas.offsetWidth - 4))}px`;
                menuPastas.style.top = `${Math.max(4, Math.min(y, window.innerHeight - menuPastas.offsetHeight - 4))}px`;
                menuPastas.querySelector('button:not([hidden])').focus();
            }

            function fecharMenuPastas(devolverFoco) {
                if (menuPastas.hidden) {
                    return;
                }
                const caminho = pastas.menu;
                menuPastas.hidden = true;
                pastas.menu = undefined;
                if (devolverFoco) {
                    focarItemArvorePastas(caminho || pastas.focado);
                }
            }

            function abrirMenuPastasNoItem(caminho) {
                const item = itemArvorePastas(caminho);
                const retangulo = (item ? item.querySelector('.arvore-linha') : arvorePastas).getBoundingClientRect();
                abrirMenuPastas(caminho, retangulo.left + 24, retangulo.bottom);
            }

            function tratarTecladoArvorePastas(evento) {
                const item = evento.target.closest('[role="treeitem"]');
                if (!item || evento.target.closest('.arvore-entrada')) {
                    return;
                }
                const caminho = item.dataset.caminho;
                const no = pastas.nos.get(caminho);
                const visiveis = itensVisiveisArvorePastas();
                const indice = visiveis.indexOf(caminho);
                const ehPasta = no && no.tipo === 'directory';
                const expandida = pastas.expandidas.has(caminho);
                if (evento.key === 'ArrowDown') {
                    focarItemArvorePastas(visiveis[Math.min(indice + 1, visiveis.length - 1)]);
                } else if (evento.key === 'ArrowUp') {
                    focarItemArvorePastas(visiveis[Math.max(indice - 1, 0)]);
                } else if (evento.key === 'Home') {
                    focarItemArvorePastas(visiveis[0]);
                } else if (evento.key === 'End') {
                    focarItemArvorePastas(visiveis[visiveis.length - 1]);
                } else if (evento.key === 'ArrowRight') {
                    if (ehPasta && !expandida) {
                        alternarPastaArvore(caminho, true);
                    } else if (ehPasta && no.filhos && no.filhos.length) {
                        focarItemArvorePastas(no.filhos[0]);
                    }
                } else if (evento.key === 'ArrowLeft') {
                    if (ehPasta && expandida) {
                        alternarPastaArvore(caminho, false);
                    } else if (paiDoCaminhoPasta(caminho)) {
                        focarItemArvorePastas(paiDoCaminhoPasta(caminho));
                    }
                } else if (evento.key === 'Enter' || evento.key === ' ') {
                    if (ehPasta) {
                        alternarPastaArvore(caminho);
                    } else {
                        abrirArquivoDaPasta(caminho);
                    }
                } else if (evento.key === 'F2') {
                    iniciarEdicaoPasta('renomear', caminho);
                } else if (evento.key === 'Delete') {
                    excluirItemPasta(caminho);
                } else if (evento.key === 'ContextMenu' || (evento.key === 'F10' && evento.shiftKey)) {
                    abrirMenuPastasNoItem(caminho);
                } else {
                    return;
                }
                pastas.escolhido = true;
                evento.preventDefault();
                evento.stopPropagation();
            }

            function tratarTecladoMenuPastas(evento) {
                const botoes = Array.from(menuPastas.querySelectorAll('button:not([hidden])'));
                const indice = botoes.indexOf(document.activeElement);
                if (evento.key === 'Escape') {
                    fecharMenuPastas(true);
                } else if (evento.key === 'ArrowDown') {
                    botoes[(indice + 1) % botoes.length].focus();
                } else if (evento.key === 'ArrowUp') {
                    botoes[(indice - 1 + botoes.length) % botoes.length].focus();
                } else if (evento.key === 'Tab') {
                    fecharMenuPastas(true);
                } else {
                    return;
                }
                evento.preventDefault();
                evento.stopPropagation();
            }

            function executarAcaoMenuPastas(acao) {
                const caminho = pastas.menu;
                fecharMenuPastas(false);
                if (acao === 'novo-arquivo' || acao === 'nova-pasta') {
                    iniciarEdicaoPasta(acao, caminho);
                } else if (acao === 'renomear') {
                    iniciarEdicaoPasta('renomear', caminho);
                } else if (acao === 'excluir') {
                    excluirItemPasta(caminho);
                }
            }

            function iniciarArrastoAlcaPastas(evento) {
                if (evento.button !== 0) {
                    return;
                }
                evento.preventDefault();
                alcaPainelPastas.setPointerCapture(evento.pointerId);
                alcaPainelPastas.classList.add('arrastando');
                pastas.arrasto = { x: evento.clientX, largura: pastas.largura };
            }

            function moverArrastoAlcaPastas(evento) {
                if (!pastas.arrasto) {
                    return;
                }
                pastas.largura = limitarLarguraPastas(pastas.arrasto.largura + evento.clientX - pastas.arrasto.x);
                painelPastas.style.width = `${pastas.largura}px`;
                alcaPainelPastas.setAttribute('aria-valuenow', String(pastas.largura));
            }

            function terminarArrastoAlcaPastas() {
                if (!pastas.arrasto) {
                    return;
                }
                pastas.arrasto = undefined;
                alcaPainelPastas.classList.remove('arrastando');
                gravarPreferenciasPastas();
            }

            function registrarPainelPastas() {
                botaoTrilhoPastas.addEventListener('click', function () {
                    alternarPainelPastas();
                });
                botaoAbrirPasta().addEventListener('click', escolherPasta);
                document.getElementById('pastas-abrir-outra').addEventListener('click', escolherPasta);
                document.getElementById('pastas-permitir').addEventListener('click', permitirAcessoPasta);
                senhaPastas.addEventListener('submit', entrarNoServidor);
                document.getElementById('pastas-novo-arquivo').addEventListener('click', function () {
                    iniciarEdicaoPasta('novo-arquivo', pastas.escolhido ? pastas.focado : '');
                });
                document.getElementById('pastas-nova-pasta').addEventListener('click', function () {
                    iniciarEdicaoPasta('nova-pasta', pastas.escolhido ? pastas.focado : '');
                });
                document.getElementById('pastas-atualizar').addEventListener('click', async function () {
                    await atualizarArvorePastas();
                    if (erroPastas.hidden) {
                        atualizarEstado('Pasta atualizada');
                    }
                });
                document.getElementById('pastas-recolher').addEventListener('click', recolherPastasArvore);
                document.getElementById('pastas-fechar').addEventListener('click', fecharPastaRaiz);
                arvorePastas.addEventListener('keydown', tratarTecladoArvorePastas);
                arvorePastas.addEventListener('click', function (evento) {
                    const item = evento.target.closest('[role="treeitem"]');
                    if (!item || evento.target.closest('.arvore-entrada')) {
                        return;
                    }
                    const caminho = item.dataset.caminho;
                    pastas.escolhido = true;
                    if (evento.target.closest('.arvore-mais')) {
                        const retangulo = evento.target.closest('.arvore-mais').getBoundingClientRect();
                        abrirMenuPastas(caminho, retangulo.left, retangulo.bottom);
                        return;
                    }
                    if (pastas.nos.get(caminho) && pastas.nos.get(caminho).tipo === 'directory') {
                        alternarPastaArvore(caminho);
                    } else {
                        abrirArquivoDaPasta(caminho);
                    }
                });
                // Botão direito num item abre as ações dele; no espaço vazio, as da pasta aberta.
                document.getElementById('pastas-conteudo').addEventListener('contextmenu', function (evento) {
                    if (!pastas.permitida || evento.target.closest('.arvore-entrada')) {
                        return;
                    }
                    evento.preventDefault();
                    const item = evento.target.closest('[role="treeitem"]');
                    abrirMenuPastas(item ? item.dataset.caminho : '', evento.clientX, evento.clientY);
                });
                menuPastas.addEventListener('click', function (evento) {
                    const botao = evento.target.closest('[data-acao]');
                    if (botao) {
                        executarAcaoMenuPastas(botao.dataset.acao);
                    }
                });
                menuPastas.addEventListener('keydown', tratarTecladoMenuPastas);
                document.addEventListener('pointerdown', function (evento) {
                    if (!menuPastas.hidden && !menuPastas.contains(evento.target)) {
                        fecharMenuPastas(false);
                    }
                }, true);
                alcaPainelPastas.addEventListener('pointerdown', iniciarArrastoAlcaPastas);
                alcaPainelPastas.addEventListener('pointermove', moverArrastoAlcaPastas);
                alcaPainelPastas.addEventListener('pointerup', terminarArrastoAlcaPastas);
                alcaPainelPastas.addEventListener('pointercancel', terminarArrastoAlcaPastas);
                alcaPainelPastas.addEventListener('keydown', function (evento) {
                    const passo = { ArrowLeft: -16, ArrowRight: 16 }[evento.key];
                    if (!passo) {
                        return;
                    }
                    evento.preventDefault();
                    pastas.largura = limitarLarguraPastas(pastas.largura + passo);
                    aplicarPainelPastas();
                    gravarPreferenciasPastas();
                });
                aplicarPainelPastas();
            }

            function mostrarAvisoArquivos() {
                let jaDispensado = false;
                try {
                    jaDispensado = localStorage.getItem(chaveAvisoArquivos) === 'dispensado';
                } catch (erro) {
                    jaDispensado = false;
                }
                avisoArquivos.hidden = jaDispensado;
                botaoFecharAvisoArquivos.addEventListener('click', function () {
                    avisoArquivos.hidden = true;
                    try {
                        localStorage.setItem(chaveAvisoArquivos, 'dispensado');
                    } catch (erro) {
                        return;
                    }
                });
            }

            function configurarModoArquivos() {
                if (gravacaoDiretaDisponivel) {
                    return;
                }
                const explicacao = 'Este navegador não grava direto no arquivo: baixa uma cópia';
                botaoSalvar.querySelector('.rotulo').textContent = 'Baixar';
                botaoSalvar.querySelector('.icone').innerHTML = '<path d="M12 4v11"/><path d="M7 10l5 5 5-5"/><path d="M5 20h14"/>';
                botaoSalvar.title = `${explicacao}.`;
                botaoSalvarComo.title = 'Baixar com outro nome (Ctrl+Shift+S)';
                botaoSalvarComo.setAttribute('aria-label', 'Baixar com outro nome');
                document.body.classList.add('sem-gravacao-direta');
                mostrarAvisoArquivos();
            }

            configurarModoArquivos();

            // O Monaco cancela por dentro tarefas da aba anterior (realce, links) quando se troca de aba
            // rápido, e o cancelamento aparece como erro não tratado. É esperado e não afeta nada.
            window.addEventListener('unhandledrejection', function (evento) {
                if (evento.reason && evento.reason.name === 'Canceled') {
                    evento.preventDefault();
                }
            });

            if (typeof require !== 'function') {
                mostrarFalha('Não foi possível carregar o Monaco.\nVerifique a conexão com a internet e recarregue a página.');
                return;
            }

            window.MonacoEnvironment = {
                getWorkerUrl: function () {
                    const caminhoRaizMonaco = caminhoBaseMonaco.substring(0, caminhoBaseMonaco.lastIndexOf('/vs'));
                    const codigoWorker = `self.MonacoEnvironment = { baseUrl: '${caminhoRaizMonaco}/' }; importScripts('${caminhoBaseMonaco}/base/worker/workerMain.js');`;
                    return `data:text/javascript;charset=utf-8,${encodeURIComponent(codigoWorker)}`;
                }
            };

            require.config({ paths: { vs: caminhoBaseMonaco } });
            require(['vs/editor/editor.main'], async function () {
                const [sessao, servidor] = await Promise.all([obterSessaoPersistida(), detectarServidorPastas()]);
                servidorPastas = servidor;
                configurarModoServidor();
                manipuladorBackupSessao = sessao && sessao.manipuladorBackupSessao;
                if (manipuladorBackupSessao) {
                    atualizarStatusBackup('Backup em arquivo configurado; verificando permissão.', 'neutro');
                } else if (typeof window.showSaveFilePicker !== 'function') {
                    atualizarStatusBackup('Este navegador não permite backup automático em arquivo. Use "Exportar cópia" para guardar a sessão.', 'neutro');
                    botaoConfigurarBackup.hidden = true;
                }
                monaco.editor.defineTheme('editor-portable', {
                    base: 'vs-dark',
                    inherit: true,
                    rules: [],
                    colors: {
                        'editor.background': '#16181c',
                        'editor.lineHighlightBackground': '#1f232a',
                        'editorLineNumber.foreground': '#565d68',
                        'editorLineNumber.activeForeground': '#c9ced6',
                        'editorWidget.background': '#1f2329',
                        'editorWidget.border': '#353b45',
                        'quickInput.background': '#1f2329'
                    }
                });
                restaurarDocumentos(sessao);
                linguagem.value = obterLinguagemDisponivel(documentoAtual.modelo.getLanguageId());
                editor = window.editor = monaco.editor.create(container, {
                    model: documentoAtual.modelo,
                    language: linguagem.value,
                    theme: 'editor-portable',
                    automaticLayout: true,
                    minimap: { enabled: mapaLigado && !telaEstreita.matches, showSlider: 'always' },
                    fontSize: 14,
                    tabSize: 2,
                    wordWrap: 'on',
                    padding: { top: 12, bottom: 12 }
                });
                const opcoesEditorJson = {
                    language: 'json',
                    theme: 'editor-portable',
                    automaticLayout: true,
                    minimap: { enabled: false },
                    fontSize: 13,
                    tabSize: 2,
                    scrollBeyondLastLine: false,
                    padding: { top: 10, bottom: 10 }
                };
                editorEntradaJson = monaco.editor.create(elementoEntradaJson, {
                    ...opcoesEditorJson,
                    model: monaco.editor.createModel('', 'json', monaco.Uri.parse('inmemory://editor/json-entrada.json'))
                });
                editorSaidaJson = monaco.editor.create(elementoSaidaJson, {
                    ...opcoesEditorJson,
                    readOnly: true,
                    model: monaco.editor.createModel('', 'json', monaco.Uri.parse('inmemory://editor/json-saida.json'))
                });
                aplicarModoPreview(sessao && sessao.modoPreview);
                restaurarEstadoFormatador(sessao);
                if (sessao && sessao.visualizacaoAtual === 'formatador-json') {
                    ativarFormatadorJson();
                } else if (sessao && sessao.visualizacaoAtual === 'atalhos-markdown') {
                    ativarAtalhosMarkdown();
                } else {
                    atualizarInterfaceDocumento();
                }
                solicitarArmazenamentoPersistente();

                editor.addAction({
                    id: 'salvar-arquivo',
                    label: 'Salvar arquivo',
                    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
                    run: atalhoSalvar
                });
                editor.addAction({
                    id: 'salvar-como-arquivo',
                    label: 'Salvar arquivo como',
                    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyS],
                    run: salvarComoArquivo
                });
                editor.addAction({
                    id: 'abrir-arquivo',
                    label: 'Abrir arquivo',
                    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyO],
                    run: abrirArquivo
                });
                editor.addAction({
                    id: 'mostrar-painel-pastas',
                    label: 'Pastas: mostrar ou esconder o painel',
                    run: function () {
                        alternarPainelPastas();
                    }
                });
                if (podeAbrirPastas()) {
                    editor.addAction({
                        id: 'abrir-pasta',
                        label: 'Pastas: abrir pasta',
                        run: escolherPasta
                    });
                }
                editor.addAction({
                    id: 'novo-conteudo',
                    label: 'Criar novo documento',
                    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KeyN],
                    run: criarNovoConteudo
                });
                editor.addAction({
                    id: 'abrir-formatador-json',
                    label: 'Abrir formatador JSON',
                    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KeyJ],
                    run: ativarFormatadorJson
                });
                editor.addAction({
                    id: 'abrir-atalhos',
                    label: 'Mostrar atalhos de teclado',
                    run: ativarAtalhosMarkdown
                });
                editor.addAction({
                    id: 'abrir-painel-sessao',
                    label: 'Sessão e backup',
                    run: function () {
                        alternarPainelSessao(true);
                    }
                });
                editor.addAction({
                    id: 'exportar-sessao',
                    label: 'Exportar cópia da sessão',
                    run: exportarSessao
                });
                [['editor', 'só editor'], ['dividido', 'editor e preview'], ['preview', 'só preview']].forEach(function ([modo, rotulo]) {
                    editor.addAction({
                        id: `modo-preview-${modo}`,
                        label: `Markdown: visualizar ${rotulo}`,
                        precondition: 'editorLangId == markdown',
                        run: function () {
                            aplicarModoPreview(modo);
                            agendarPersistenciaSessao();
                        }
                    });
                });
                registrarAtalhosMarkdown();

                const acoesMarkdown = {
                    negrito: function () { aplicarMarcacaoMarkdown('**', '**', 'Negrito aplicado'); },
                    italico: function () { aplicarMarcacaoMarkdown('*', '*', 'Itálico aplicado'); },
                    tachado: function () { aplicarMarcacaoMarkdown('~~', '~~', 'Tachado aplicado'); },
                    codigo: function () { aplicarMarcacaoMarkdown('`', '`', 'Código inline aplicado'); },
                    link: aplicarLinkMarkdown,
                    h1: function () { aplicarCabecalhoMarkdown(1); },
                    h2: function () { aplicarCabecalhoMarkdown(2); },
                    h3: function () { aplicarCabecalhoMarkdown(3); },
                    lista: function () { editarLinhasMarkdown(transformarListaMarcadoresMarkdown, 'Lista com marcadores alternada'); },
                    numerada: function () { editarLinhasMarkdown(transformarListaNumeradaMarkdown, 'Lista numerada alternada'); },
                    tarefas: function () { editarLinhasMarkdown(transformarListaTarefasMarkdown, 'Lista de tarefas alternada'); },
                    citacao: function () { editarLinhasMarkdown(transformarCitacaoMarkdown, 'Citação alternada'); },
                    linha: inserirLinhaHorizontalMarkdown
                };
                barraMarkdown.querySelectorAll('[data-md]').forEach(function (botao) {
                    botao.addEventListener('mousedown', function (evento) {
                        evento.preventDefault();
                    });
                    botao.addEventListener('click', function () {
                        if (modoPreview === 'preview') {
                            aplicarModoPreview('dividido');
                        }
                        editor.focus();
                        acoesMarkdown[botao.dataset.md]();
                    });
                });
                window.addEventListener('keydown', tratarAtalhosGerais, true);
                editorVisual.addEventListener('keydown', tratarAtalhosDoVisual, true);
                // A alça do Milkdown inteira (inclusive o +) pode ser arrastada e leva o parágrafo junto.
                // O + continua abrindo o menu de blocos; só o arrasto é bloqueado.
                editorVisual.addEventListener('dragstart', function (evento) {
                    if (evento.target instanceof Element && evento.target.closest('.milkdown-block-handle')) {
                        evento.preventDefault();
                    }
                }, true);
                registrarPainelPastas();
                restaurarPastaDaSessao(sessao);
                aplicarMapa();
                botaoMapa.addEventListener('click', alternarMapa);
                telaEstreita.addEventListener('change', aplicarMapa);
                editorVisual.addEventListener('scroll', redesenharMapaVisual);
                // Imagens mudam a altura da página quando terminam de carregar.
                editorVisual.addEventListener('load', agendarMedicaoMapaVisual, true);
                const observadorTamanhoMapa = new ResizeObserver(agendarMedicaoMapaVisual);
                observadorTamanhoMapa.observe(mapaVisual);
                observadorTamanhoMapa.observe(editorVisual);
                mapaVisual.addEventListener('pointerdown', iniciarArrastoMapaVisual);
                mapaVisual.addEventListener('pointermove', moverArrastoMapaVisual);
                mapaVisual.addEventListener('pointerup', terminarArrastoMapaVisual);
                mapaVisual.addEventListener('pointercancel', terminarArrastoMapaVisual);
                botaoInserirImagem.addEventListener('click', abrirDialogoImagem);
                formularioImagem.addEventListener('submit', confirmarDialogoImagem);
                dialogoImagem.addEventListener('close', function () {
                    if (dialogoImagem.returnValue !== 'inserir') {
                        if (modoPreview === 'visual' && visual.crepe) {
                            noVisual(function (ctx, visao) { visao.focus(); });
                        } else {
                            editor.focus();
                        }
                    }
                });
                botoesModoVisualizacao.forEach(function (botao) {
                    botao.addEventListener('click', function () {
                        aplicarModoPreview(botao.dataset.modo);
                        agendarPersistenciaSessao();
                        if (modoPreview !== 'preview') {
                            focarTexto();
                        }
                    });
                });

                editor.onDidChangeCursorPosition(atualizarRodape);
                editor.onKeyDown(envolverSelecaoNoEditor);
                // O verificador de JavaScript pode terminar uma análise depois que a aba já mudou de
                // linguagem (comum logo após abrir o editor, enquanto ele ainda carrega) e marcar o texto
                // inteiro como erro. Cada verificador marca com o nome da sua linguagem; as marcas de
                // outra linguagem são descartadas.
                monaco.editor.onDidChangeMarkers(function (recursos) {
                    recursos.forEach(function (recurso) {
                        const modelo = monaco.editor.getModel(recurso);
                        if (!modelo) {
                            return;
                        }
                        const donos = new Set(monaco.editor.getModelMarkers({ resource: recurso }).map(function (marca) {
                            return marca.owner;
                        }));
                        donos.forEach(function (dono) {
                            if (dono !== modelo.getLanguageId()) {
                                monaco.editor.setModelMarkers(modelo, dono, []);
                            }
                        });
                    });
                });
                linguagem.addEventListener('change', function () {
                    if (!documentoAtual) {
                        return;
                    }
                    monaco.editor.setModelLanguage(documentoAtual.modelo, linguagem.value);
                    atualizarInterfaceDocumento('Linguagem alterada');
                    agendarPersistenciaSessao();
                    focarTexto();
                });

                function alternarPainelSessao(abrir) {
                    const deveAbrir = typeof abrir === 'boolean' ? abrir : painelSessao.hidden;
                    painelSessao.hidden = !deveAbrir;
                    botaoSessao.setAttribute('aria-expanded', deveAbrir ? 'true' : 'false');
                    if (deveAbrir) {
                        atualizarPainelSessao();
                        botaoConfigurarBackup.focus();
                    }
                }

                botaoSessao.addEventListener('click', function (evento) {
                    evento.stopPropagation();
                    alternarPainelSessao();
                });
                painelSessao.addEventListener('click', function (evento) {
                    evento.stopPropagation();
                });
                document.addEventListener('click', function () {
                    if (!painelSessao.hidden) {
                        alternarPainelSessao(false);
                    }
                });
                document.addEventListener('keydown', function (evento) {
                    if (evento.key === 'Escape' && !painelSessao.hidden) {
                        alternarPainelSessao(false);
                        botaoSessao.focus();
                    }
                });

                botaoAbrirPaleta.addEventListener('click', function () {
                    if (visualizacaoAtual !== 'editor') {
                        mostrarEditor();
                    }
                    editor.focus();
                    editor.trigger('botao-paleta', 'editor.action.quickCommand', null);
                });
                botaoAbrir.addEventListener('click', abrirArquivo);
                botaoNovo.addEventListener('click', criarNovoConteudo);
                botaoNovaAba.addEventListener('click', criarNovoConteudo);
                botaoSalvar.addEventListener('click', salvarArquivo);
                botaoSalvarComo.addEventListener('click', salvarComoArquivo);
                botaoExportarSessao.addEventListener('click', exportarSessao);
                botaoImportarSessao.addEventListener('click', function () {
                    seletorSessao.value = '';
                    seletorSessao.click();
                });
                botaoConfigurarBackup.addEventListener('click', acionarBackupEmArquivo);
                botaoTrilhoDocumentos.addEventListener('click', voltarAoEditorMarkdown);
                botaoTrilhoJson.addEventListener('click', ativarFormatadorJson);
                botaoTrilhoAtalhos.addEventListener('click', ativarAtalhosMarkdown);
                botaoVoltarEditorMarkdown.addEventListener('click', voltarAoEditorMarkdown);
                botaoUsarJsonAtual.addEventListener('click', usarDocumentoAtualNoJson);
                botaoFormatarJson.addEventListener('click', function () {
                    formatarJson(false);
                });
                botaoCompactarJson.addEventListener('click', function () {
                    formatarJson(true);
                });
                botaoCopiarJson.addEventListener('click', copiarResultadoJson);
                botaoJsonNovaAba.addEventListener('click', abrirResultadoJsonEmNovaAba);
                botaoIrErroJson.addEventListener('click', irParaErroJson);
                seletorIndentacaoJson.addEventListener('change', function () {
                    formatarJson(false);
                    agendarPersistenciaSessao();
                });
                editorEntradaJson.onDidChangeModelContent(function () {
                    window.clearTimeout(temporizadorJson);
                    temporizadorJson = window.setTimeout(function () {
                        formatarJson(undefined, true);
                    }, 400);
                    if (visualizacaoAtual === 'formatador-json') {
                        atualizarRodape();
                    }
                    agendarPersistenciaSessao();
                });
                seletorArquivo.addEventListener('change', function (evento) {
                    const [arquivo] = evento.target.files;
                    if (arquivo) {
                        carregarArquivo(arquivo);
                    }
                });
                seletorSessao.addEventListener('change', function (evento) {
                    const [arquivo] = evento.target.files;
                    if (arquivo) {
                        importarSessao(arquivo);
                    }
                });
                iniciarBackupAutomatico();
                // O Firefox nem sempre dispara "beforeunload" ao recarregar ou fechar;
                // "pagehide" e "visibilitychange" garantem o último salvamento.
                window.addEventListener('pagehide', function () {
                    salvarSessaoLocalmente();
                });
                document.addEventListener('visibilitychange', function () {
                    if (document.visibilityState === 'hidden') {
                        salvarSessaoLocalmente();
                        persistirSessaoIndexedDb();
                    }
                });
                window.addEventListener('beforeunload', function (evento) {
                    salvarSessaoLocalmente();
                    if (documentos.some(function (documento) {
                        return documento.modificacoesPendentes;
                    })) {
                        evento.preventDefault();
                        evento.returnValue = '';
                    }
                });
                atualizarEstado(sessao ? `Sessão restaurada · ${documentos.length} ${documentos.length === 1 ? 'aba' : 'abas'}` : 'Pronto');
                if (visualizacaoAtual === 'editor') {
                    focarTexto();
                }
            }, function (erro) {
                mostrarFalha(`Não foi possível carregar o Monaco.\n${erro && erro.message ? erro.message : 'Verifique a conexão com a internet.'}`);
            });
        }());
