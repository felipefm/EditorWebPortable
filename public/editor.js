(function () {
            const caminhoBaseMonaco = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs';
            const chaveConteudo = 'meu-editor-web-conteudo';
            const chaveNomeArquivo = 'meu-editor-web-nome-arquivo';
            const chaveSessaoLocal = 'meu-editor-web-sessao-v2';
            const nomeBancoSessao = 'meu-editor-web';
            const nomeArmazenamentoSessao = 'sessao';
            const conteudoInicial = '// Digite seu texto ou código aqui...\n// O conteúdo é salvo neste navegador.';
            const estado = document.getElementById('estado');
            const arquivoAtualElemento = document.getElementById('arquivo-atual');
            const rodape = document.getElementById('rodape');
            const falha = document.getElementById('falha');
            const editorPaineis = document.getElementById('editor-paineis');
            const container = document.getElementById('container');
            const previewMarkdown = document.getElementById('preview-markdown');
            const previewStatus = document.getElementById('preview-status');
            const previewConteudo = document.getElementById('preview-conteudo');
            const abas = document.getElementById('abas');
            const linguagem = document.getElementById('linguagem');
            const botaoAbrir = document.getElementById('abrir');
            const botaoNovo = document.getElementById('novo');
            const botaoSalvar = document.getElementById('salvar');
            const botaoSalvarComo = document.getElementById('salvar-como');
            const seletorArquivo = document.getElementById('seletor-arquivo');
            const acoesArquivo = document.getElementById('acoes-arquivo');
            const botaoAbrirFormatadorJson = document.getElementById('abrir-formatador-json');
            const botaoUsarJsonAtual = document.getElementById('usar-json-atual');
            const botaoFormatarJson = document.getElementById('formatar-json');
            const botaoCompactarJson = document.getElementById('compactar-json');
            const botaoCopiarJson = document.getElementById('copiar-json');
            const seletorIndentacaoJson = document.getElementById('indentacao-json');
            const formatadorJson = document.getElementById('formatador-json');
            const entradaJson = document.getElementById('json-entrada');
            const saidaJson = document.getElementById('json-saida');
            const mensagemJson = document.getElementById('json-mensagem');
            const botaoExportarSessao = document.getElementById('exportar-sessao');
            const botaoImportarSessao = document.getElementById('importar-sessao');
            const botaoConfigurarBackup = document.getElementById('configurar-backup');
            const statusBackup = document.getElementById('status-backup');
            const seletorSessao = document.getElementById('seletor-sessao');
            const menuOpcoes = document.getElementById('menu-opcoes');
            const botaoAbrirAtalhosMarkdown = document.getElementById('abrir-atalhos-markdown');
            const botaoVoltarEditorMarkdown = document.getElementById('voltar-editor-markdown');
            const atalhosMarkdown = document.getElementById('atalhos-markdown');
            let editor;
            let documentos = [];
            let documentoAtual;
            let proximoIdDocumento = 1;
            let visualizacaoAtual = 'editor';
            let temporizadorSessao;
            let temporizadorBackupAutomatico;
            let manipuladorBackupSessao;
            let backupAutomaticoEmAndamento = false;
            let filaPersistenciaSessao = Promise.resolve();

            function mostrarFalha(mensagem) {
                estado.textContent = 'Falha ao carregar';
                falha.textContent = mensagem;
                falha.style.display = 'block';
                editorPaineis.style.display = 'none';
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
                    manipuladorBackupSessao: incluirManipuladores ? manipuladorBackupSessao : undefined,
                    formatadorJson: {
                        entrada: entradaJson.value,
                        saida: saidaJson.value,
                        indentacao: seletorIndentacaoJson.value
                    }
                };
            }

            function atualizarStatusBackup(mensagem) {
                statusBackup.textContent = mensagem;
            }

            function salvarSessaoLocalmente() {
                try {
                    localStorage.setItem(chaveSessaoLocal, JSON.stringify(criarInstantaneoSessao(false)));
                } catch (erro) {
                    return false;
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

            function atualizarEstado(mensagem) {
                const quantidadeCaracteres = visualizacaoAtual === 'formatador-json'
                    ? entradaJson.value.length
                    : (documentoAtual ? documentoAtual.modelo.getValue().length : 0);
                estado.textContent = mensagem;
                rodape.textContent = `${mensagem} | ${quantidadeCaracteres} caracteres`;
            }

            function atualizarCabecalho() {
                if (visualizacaoAtual === 'formatador-json') {
                    arquivoAtualElemento.textContent = 'Formatador JSON';
                    arquivoAtualElemento.title = 'Ferramenta de formatação JSON';
                    document.title = 'Formatador JSON - Meu Editor Web Portable';
                    return;
                }
                if (visualizacaoAtual === 'atalhos-markdown') {
                    arquivoAtualElemento.textContent = 'Atalhos de Markdown';
                    arquivoAtualElemento.title = 'Referência de atalhos de Markdown';
                    document.title = 'Atalhos de Markdown - Meu Editor Web Portable';
                    return;
                }
                const nome = documentoAtual ? documentoAtual.nome : '';
                const indicador = documentoAtual && documentoAtual.modificacoesPendentes ? ' *' : '';
                const nomeVisivel = nome || 'Sem arquivo';
                arquivoAtualElemento.textContent = `${nomeVisivel}${indicador}`;
                arquivoAtualElemento.title = indicador ? `${nomeVisivel} - alterações não salvas` : nomeVisivel;
                document.title = `${indicador ? '* ' : ''}${nome ? `${nome} - ` : ''}Meu Editor Web Portable`;
            }

            function atualizarAbas() {
                abas.textContent = '';
                documentos.forEach(function (documento) {
                    const aba = document.createElement('div');
                    const botaoNome = document.createElement('button');
                    const botaoFechar = document.createElement('button');
                    const nome = `${documento.nome}${documento.modificacoesPendentes ? ' *' : ''}`;

                    aba.className = `aba${documento === documentoAtual ? ' ativa' : ''}`;
                    aba.setAttribute('role', 'tab');
                    aba.setAttribute('aria-selected', documento === documentoAtual ? 'true' : 'false');
                    botaoNome.className = 'aba-nome';
                    botaoNome.type = 'button';
                    botaoNome.textContent = nome;
                    botaoNome.title = documento.modificacoesPendentes ? `${documento.nome} - alterações não salvas` : documento.nome;
                    botaoFechar.className = 'fechar-aba';
                    botaoFechar.type = 'button';
                    botaoFechar.textContent = 'x';
                    botaoFechar.title = `Fechar ${documento.nome}`;
                    botaoFechar.setAttribute('aria-label', `Fechar ${documento.nome}`);

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

                    aba.appendChild(botaoNome);
                    aba.appendChild(botaoFechar);
                    abas.appendChild(aba);
                });

                const abaFerramenta = document.createElement('div');
                const botaoFerramenta = document.createElement('button');
                abaFerramenta.className = `aba aba-ferramenta${visualizacaoAtual === 'formatador-json' ? ' ativa' : ''}`;
                abaFerramenta.setAttribute('role', 'tab');
                abaFerramenta.setAttribute('aria-selected', visualizacaoAtual === 'formatador-json' ? 'true' : 'false');
                botaoFerramenta.className = 'aba-nome';
                botaoFerramenta.type = 'button';
                botaoFerramenta.textContent = 'Formatador JSON';
                botaoFerramenta.title = 'Abrir formatador JSON';
                botaoFerramenta.addEventListener('click', ativarFormatadorJson);
                abaFerramenta.appendChild(botaoFerramenta);
                abas.appendChild(abaFerramenta);

                const abaAtalhos = document.createElement('div');
                const botaoAtalhos = document.createElement('button');
                abaAtalhos.className = `aba aba-ferramenta${visualizacaoAtual === 'atalhos-markdown' ? ' ativa' : ''}`;
                abaAtalhos.setAttribute('role', 'tab');
                abaAtalhos.setAttribute('aria-selected', visualizacaoAtual === 'atalhos-markdown' ? 'true' : 'false');
                botaoAtalhos.className = 'aba-nome';
                botaoAtalhos.type = 'button';
                botaoAtalhos.textContent = 'Atalhos Markdown';
                botaoAtalhos.title = 'Abrir atalhos de Markdown';
                botaoAtalhos.addEventListener('click', ativarAtalhosMarkdown);
                abaAtalhos.appendChild(botaoAtalhos);
                abas.appendChild(abaAtalhos);
            }

            function atualizarInterfaceDocumento(mensagem) {
                atualizarCabecalho();
                atualizarAbas();
                atualizarPreviewMarkdown();
                if (mensagem) {
                    atualizarEstado(mensagem);
                }
            }

            function marcarModificacoes(documento, pendentes) {
                documento.modificacoesPendentes = pendentes;
                atualizarCabecalho();
                atualizarAbas();
            }

            function mostrarEditor() {
                visualizacaoAtual = 'editor';
                acoesArquivo.hidden = false;
                editorPaineis.style.display = 'grid';
                formatadorJson.classList.remove('visivel');
                atalhosMarkdown.classList.remove('visivel');
                container.style.display = 'block';
                atualizarPreviewMarkdown();
            }

            function ativarFormatadorJson() {
                visualizacaoAtual = 'formatador-json';
                acoesArquivo.hidden = true;
                editorPaineis.style.display = 'none';
                container.style.display = 'none';
                formatadorJson.classList.add('visivel');
                atalhosMarkdown.classList.remove('visivel');
                if (!entradaJson.value.trim() && documentoAtual) {
                    entradaJson.value = documentoAtual.modelo.getValue();
                }
                atualizarCabecalho();
                atualizarAbas();
                atualizarEstado('Formatador JSON');
                agendarPersistenciaSessao();
                entradaJson.focus();
            }

            function ativarAtalhosMarkdown() {
                visualizacaoAtual = 'atalhos-markdown';
                acoesArquivo.hidden = true;
                editorPaineis.style.display = 'none';
                container.style.display = 'none';
                formatadorJson.classList.remove('visivel');
                atalhosMarkdown.classList.add('visivel');
                menuOpcoes.open = false;
                atualizarCabecalho();
                atualizarAbas();
                atualizarEstado('Atalhos de Markdown');
                agendarPersistenciaSessao();
                botaoVoltarEditorMarkdown.focus();
            }

            function atualizarPreviewMarkdown() {
                const deveExibir = visualizacaoAtual === 'editor'
                    && Boolean(documentoAtual)
                    && documentoAtual.modelo.getLanguageId() === 'markdown';
                editorPaineis.classList.toggle('preview-visivel', deveExibir);
                previewMarkdown.classList.toggle('visivel', deveExibir);
                if (!deveExibir) {
                    return;
                }

                const conteudo = documentoAtual.modelo.getValue();
                if (!conteudo.trim()) {
                    previewConteudo.innerHTML = '<p id="preview-vazio">Comece a escrever Markdown para visualizar o resultado aqui.</p>';
                    previewStatus.textContent = 'Aguardando conteúdo';
                    return;
                }

                if (!window.marked || typeof window.marked.parse !== 'function' || !window.DOMPurify) {
                    previewConteudo.textContent = conteudo;
                    previewStatus.textContent = 'Preview simples';
                    return;
                }

                try {
                    const html = window.marked.parse(conteudo, { gfm: true, breaks: true });
                    previewConteudo.innerHTML = window.DOMPurify.sanitize(html);
                    previewConteudo.querySelectorAll('a[href]').forEach(function (link) {
                        link.target = '_blank';
                        link.rel = 'noopener noreferrer';
                    });
                    previewStatus.textContent = 'Ao vivo';
                } catch (erro) {
                    previewConteudo.textContent = conteudo;
                    previewStatus.textContent = 'Preview simples';
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

            function formatarJson(compacto) {
                const texto = entradaJson.value.trim();
                if (!texto) {
                    saidaJson.value = '';
                    mensagemJson.textContent = 'Nenhum JSON para formatar.';
                    atualizarEstado('Aguardando JSON');
                    return false;
                }

                try {
                    const valor = JSON.parse(texto);
                    saidaJson.value = JSON.stringify(valor, null, compacto ? 0 : obterIndentacaoJson());
                    mensagemJson.textContent = compacto ? 'JSON válido e compactado.' : 'JSON válido e formatado.';
                    agendarPersistenciaSessao();
                    atualizarEstado(compacto ? 'JSON compactado' : 'JSON formatado');
                    return true;
                } catch (erro) {
                    saidaJson.value = '';
                    mensagemJson.textContent = `JSON inválido: ${erro.message}`;
                    agendarPersistenciaSessao();
                    atualizarEstado('JSON inválido');
                    return false;
                }
            }

            async function copiarResultadoJson() {
                if (!saidaJson.value) {
                    mensagemJson.textContent = 'Formate um JSON antes de copiar.';
                    return;
                }

                try {
                    if (navigator.clipboard && window.isSecureContext) {
                        await navigator.clipboard.writeText(saidaJson.value);
                    } else {
                        saidaJson.focus();
                        saidaJson.select();
                        document.execCommand('copy');
                        saidaJson.setSelectionRange(0, 0);
                    }
                    mensagemJson.textContent = 'Resultado copiado.';
                    atualizarEstado('Resultado copiado');
                } catch (erro) {
                    mensagemJson.textContent = 'Não foi possível copiar o resultado.';
                }
            }

            function usarDocumentoAtualNoJson() {
                if (!documentoAtual) {
                    return;
                }
                entradaJson.value = documentoAtual.modelo.getValue();
                formatarJson(false);
                agendarPersistenciaSessao();
                entradaJson.focus();
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

            async function configurarBackupAutomatico() {
                if (typeof window.showSaveFilePicker !== 'function') {
                    atualizarStatusBackup('Backup automático no navegador ativo. Este navegador não permite arquivo automático.');
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
                        atualizarStatusBackup('Permissão para o arquivo de backup negada.');
                        return false;
                    }
                    manipuladorBackupSessao = manipulador;
                    atualizarStatusBackup('Backup automático em arquivo ativo (a cada 30 s).');
                    agendarPersistenciaSessao();
                    atualizarEstado('Backup automático configurado');
                    return true;
                } catch (erro) {
                    if (erro && erro.name === 'AbortError') {
                        return undefined;
                    }
                    atualizarStatusBackup('Não foi possível configurar o arquivo de backup.');
                    atualizarEstado(`Falha no backup: ${erro && erro.message ? erro.message : 'erro desconhecido'}`);
                    return false;
                }
            }

            async function exportarSessao() {
                if (manipuladorBackupSessao) {
                    try {
                        if (await gravarSessaoNoArquivo(manipuladorBackupSessao, true)) {
                            atualizarStatusBackup('Backup automático em arquivo ativo (a cada 30 s).');
                            atualizarEstado('Sessão exportada');
                            return;
                        }
                    } catch (erro) {
                        manipuladorBackupSessao = undefined;
                    }
                }

                const backupConfigurado = await configurarBackupAutomatico();
                if (backupConfigurado !== false) {
                    return;
                }

                const sessao = criarInstantaneoSessao(false);
                baixarTexto(JSON.stringify(sessao, null, 2), 'meu-editor-sessao.json', 'application/json;charset=utf-8');
                atualizarEstado('Sessão exportada por download');
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
                        atualizarStatusBackup(gravou
                            ? 'Backup automático em arquivo ativo (último: agora).'
                            : 'Sessão salva no navegador; autorize novamente o arquivo de backup.');
                    }
                } catch (erro) {
                    atualizarStatusBackup('Sessão salva no navegador; backup em arquivo indisponível.');
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
                    if (possuiAlteracoesPendentes() && !window.confirm('Existem alterações não salvas. Substituir a sessão atual?')) {
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
                marcarModificacoes(documento, false);
                agendarPersistenciaSessao();
                atualizarEstado(mensagem);
            }

            async function salvarComoArquivo() {
                const documento = documentoAtual;
                if (!documento) {
                    return;
                }
                try {
                    if (typeof window.showSaveFilePicker === 'function') {
                        const nomeSugerido = documento.ehSemTitulo ? 'novo-arquivo.txt' : documento.nome;
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

                    const nomeSugerido = documento.ehSemTitulo ? 'novo-arquivo.txt' : documento.nome;
                    const nome = window.prompt('Nome da cópia para baixar:', nomeSugerido);
                    if (!nome) {
                        return;
                    }
                    baixarArquivo(documento, nome);
                    atualizarEstado(`Cópia baixada: ${nome}. O arquivo original não foi alterado.`);
                } catch (erro) {
                    if (erro && erro.name === 'AbortError') {
                        return;
                    }
                    atualizarEstado(`Falha ao salvar: ${erro && erro.message ? erro.message : 'erro desconhecido'}`);
                }
            }

            async function salvarArquivo() {
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

            function fecharDocumento(documento) {
                if (documento.modificacoesPendentes && !window.confirm(`Existem alterações não salvas em ${documento.nome}. Fechar mesmo assim?`)) {
                    return;
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
                entradaJson.value = sessao.formatadorJson.entrada || '';
                saidaJson.value = sessao.formatadorJson.saida || '';
                if (['2', '4', 'tab'].includes(sessao.formatadorJson.indentacao)) {
                    seletorIndentacaoJson.value = sessao.formatadorJson.indentacao;
                }
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
                        keybindings: [monaco.KeyMod.CtrlCmd | tecla],
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
                    atualizarStatusBackup('Backup em arquivo configurado; verificando permissão.');
                }
                restaurarDocumentos(sessao);
                linguagem.value = obterLinguagemDisponivel(documentoAtual.modelo.getLanguageId());
                editor = window.editor = monaco.editor.create(container, {
                    model: documentoAtual.modelo,
                    language: linguagem.value,
                    theme: 'vs-dark',
                    automaticLayout: true,
                    minimap: { enabled: false },
                    fontSize: 14,
                    tabSize: 2,
                    wordWrap: 'on',
                    padding: { top: 12, bottom: 12 }
                });
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
                    run: salvarArquivo
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
                    label: 'Criar novo conteúdo',
                    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyN],
                    run: criarNovoConteudo
                });
                editor.addAction({
                    id: 'abrir-formatador-json',
                    label: 'Abrir formatador JSON',
                    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KeyJ],
                    run: ativarFormatadorJson
                });
                registrarAtalhosMarkdown();
                editor.onDidChangeCursorPosition(function (evento) {
                    rodape.textContent = `Linha ${evento.position.lineNumber}, coluna ${evento.position.column} | ${editor.getValue().length} caracteres`;
                });
                linguagem.addEventListener('change', function () {
                    if (!documentoAtual) {
                        return;
                    }
                    monaco.editor.setModelLanguage(documentoAtual.modelo, linguagem.value);
                    atualizarPreviewMarkdown();
                    atualizarEstado('Linguagem alterada');
                    editor.focus();
                });
                botaoAbrir.addEventListener('click', abrirArquivo);
                botaoNovo.addEventListener('click', criarNovoConteudo);
                botaoSalvar.addEventListener('click', salvarArquivo);
                botaoSalvarComo.addEventListener('click', salvarComoArquivo);
                botaoExportarSessao.addEventListener('click', exportarSessao);
                botaoImportarSessao.addEventListener('click', function () {
                    seletorSessao.value = '';
                    seletorSessao.click();
                });
                botaoConfigurarBackup.addEventListener('click', configurarBackupAutomatico);
                botaoAbrirFormatadorJson.addEventListener('click', ativarFormatadorJson);
                botaoAbrirAtalhosMarkdown.addEventListener('click', ativarAtalhosMarkdown);
                botaoVoltarEditorMarkdown.addEventListener('click', voltarAoEditorMarkdown);
                botaoUsarJsonAtual.addEventListener('click', usarDocumentoAtualNoJson);
                botaoFormatarJson.addEventListener('click', function () {
                    formatarJson(false);
                });
                botaoCompactarJson.addEventListener('click', function () {
                    formatarJson(true);
                });
                botaoCopiarJson.addEventListener('click', copiarResultadoJson);
                seletorIndentacaoJson.addEventListener('change', function () {
                    if (saidaJson.value) {
                        formatarJson(false);
                    }
                    agendarPersistenciaSessao();
                });
                entradaJson.addEventListener('input', function () {
                    saidaJson.value = '';
                    mensagemJson.textContent = '';
                    if (visualizacaoAtual === 'formatador-json') {
                        atualizarEstado('Editando JSON');
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
                atualizarEstado(sessao ? `Sessão restaurada | ${documentos.length} aba(s)` : 'Pronto');
                editor.focus();
            }, function (erro) {
                mostrarFalha(`Não foi possível carregar o Monaco.\n${erro && erro.message ? erro.message : 'Verifique a conexão com a internet.'}`);
            });
        }());
    