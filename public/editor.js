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
                terminaComQuebra: false,
                ultimoMarkdown: undefined
            };
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
                            editor.focus();
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
                            manipulador: incluirManipuladores ? documento.manipulador : undefined
                        };
                    }),
                    documentoAtualId: documentoAtual ? documentoAtual.id : undefined,
                    visualizacaoAtual: visualizacaoAtual,
                    modoPreview: modoPreview,
                    manipuladorBackupSessao: incluirManipuladores ? manipuladorBackupSessao : undefined,
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
                    manipuladorBackupSessao: manipuladorBackup
                };
            }

            async function obterSessaoPersistida() {
                let sessaoIndexedDb;
                try {
                    sessaoIndexedDb = await lerSessaoIndexedDb();
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

            function aplicarModoPreview(modo) {
                modoPreview = ['editor', 'dividido', 'preview', 'visual'].includes(modo) ? modo : 'dividido';
                botoesModoVisualizacao.forEach(function (botao) {
                    botao.setAttribute('aria-pressed', botao.dataset.modo === modoPreview ? 'true' : 'false');
                });
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
                        import(`${base}/prose/transform`)
                    ]).then(function ([moduloCrepe, moduloCore, moduloGfm, moduloCommonmark, moduloUtils, moduloLink, moduloTransform]) {
                        return {
                            Crepe: moduloCrepe.Crepe,
                            core: moduloCore,
                            gfm: moduloGfm,
                            commonmark: moduloCommonmark,
                            callCommand: moduloUtils.callCommand,
                            linkTooltipAPI: moduloLink.linkTooltipAPI,
                            transform: moduloTransform
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
                    rule: contar(/^\s*\*{3,}\s*$/gm) > contar(/^\s*-{3,}\s*$/gm) ? '*' : '-'
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
                    crepe.editor.config(function (ctx) {
                        ctx.update(milkdown.core.remarkStringifyOptionsCtx, function (anterior) {
                            return { ...anterior, bullet: estilo.bullet, emphasis: estilo.emphasis, rule: estilo.rule, strong: '*' };
                        });
                        ctx.set(milkdown.gfm.remarkGFMPlugin.options.key, { tablePipeAlign: false });
                        ctx.update(milkdown.core.remarkPluginsCtx, function (plugins) {
                            return [...plugins, { plugin: corrigirImagensSemTitulo, options: undefined }];
                        });
                    });
                    crepe.on(function (ouvinte) {
                        ouvinte.markdownUpdated(function () {
                            if (visual.crepe === crepe) {
                                sincronizarEditorVisual();
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
                } catch (erro) {
                    if (geracao !== visual.geracao) {
                        return;
                    }
                    visual.documento = undefined;
                    aplicarModoPreview('dividido');
                    atualizarEstado('Não foi possível carregar o editor visual. Verifique a conexão com a internet.');
                } finally {
                    if (geracao === visual.geracao) {
                        carregandoVisual.hidden = true;
                    }
                }
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
                if (tecla === 's' && comando) {
                    acao = evento.shiftKey ? salvarComoArquivo : atalhoSalvar;
                } else if (tecla === 'o' && !evento.shiftKey && !evento.altKey) {
                    acao = abrirArquivo;
                } else if (tecla === 'n' && evento.altKey) {
                    acao = criarNovoConteudo;
                } else if (!m) {
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
                editor.focus();
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
                    editor.focus();
                    return;
                }
                documentoAtual = documento;
                editor.setModel(documento.modelo);
                linguagem.value = obterLinguagemDisponivel(documento.modelo.getLanguageId());
                atualizarPreviewMarkdown();
                atualizarInterfaceDocumento(mensagem || (documento.modificacoesPendentes ? 'Alterações não salvas' : 'Pronto'));
                agendarPersistenciaSessao();
                editor.focus();
            }

            async function carregarArquivo(arquivo, manipulador) {
                try {
                    const conteudo = await arquivo.text();
                    const documento = criarDocumento(arquivo.name, conteudo, manipulador, false);
                    documentos.push(documento);
                    ativarDocumento(documento, 'Arquivo aberto');
                    agendarPersistenciaSessao();
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
                editor.focus();
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
                if (gravacaoDiretaDisponivel || (documentoAtual && documentoAtual.manipulador)) {
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
                    atualizarEstado(`Falha ao salvar: ${erro && erro.message ? erro.message : 'erro desconhecido'}`);
                }
            }

            function criarNovoConteudo() {
                const linguagemInicial = documentoAtual ? documentoAtual.modelo.getLanguageId() : 'plaintext';
                const documento = criarDocumento(obterNomeSemTitulo(), '', undefined, true, linguagemInicial);
                documentos.push(documento);
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
                    const novoDocumento = criarDocumento(obterNomeSemTitulo(), '', undefined, true, 'plaintext');
                    documentos.push(novoDocumento);
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
                editor.focus();
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
                const sessao = await obterSessaoPersistida();
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
                    minimap: { enabled: false },
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
                editorVisual.addEventListener('keydown', tratarAtalhosDoVisual, true);
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
                        if (modoPreview !== 'preview' && modoPreview !== 'visual') {
                            editor.focus();
                        }
                    });
                });

                editor.onDidChangeCursorPosition(atualizarRodape);
                linguagem.addEventListener('change', function () {
                    if (!documentoAtual) {
                        return;
                    }
                    monaco.editor.setModelLanguage(documentoAtual.modelo, linguagem.value);
                    atualizarInterfaceDocumento('Linguagem alterada');
                    agendarPersistenciaSessao();
                    editor.focus();
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
                    editor.focus();
                }
            }, function (erro) {
                mostrarFalha(`Não foi possível carregar o Monaco.\n${erro && erro.message ? erro.message : 'Verifique a conexão com a internet.'}`);
            });
        }());
