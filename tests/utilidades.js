// Funções compartilhadas pelos testes.
const { expect } = require('@playwright/test');

// Simula a File System Access API (Chrome/Edge) sem abrir janelas nativas.
// Tudo o que for "gravado" fica em window.__arquivosGravados[nome].
function instalarArquivosSimulados(arquivosParaAbrir) {
    window.__arquivosGravados = {};
    function criarManipulador(nome, conteudoInicial) {
        return {
            kind: 'file',
            name: nome,
            queryPermission: async function () { return 'granted'; },
            requestPermission: async function () { return 'granted'; },
            getFile: async function () {
                const conteudo = nome in window.__arquivosGravados ? window.__arquivosGravados[nome] : conteudoInicial;
                return new File([conteudo || ''], nome);
            },
            createWritable: async function () {
                let buffer = '';
                return {
                    write: async function (dados) { buffer += dados; },
                    close: async function () { window.__arquivosGravados[nome] = buffer; }
                };
            }
        };
    }
    const fila = (arquivosParaAbrir || []).slice();
    window.showOpenFilePicker = async function () {
        const proximo = fila.shift();
        if (!proximo) {
            throw new DOMException('Cancelado', 'AbortError');
        }
        return [criarManipulador(proximo.nome, proximo.conteudo)];
    };
    window.showSaveFilePicker = async function (opcoes) {
        return criarManipulador((opcoes && opcoes.suggestedName) || 'arquivo.txt', '');
    };
}

function removerAcessoArquivos() {
    window.showOpenFilePicker = undefined;
    window.showSaveFilePicker = undefined;
    window.showDirectoryPicker = undefined;
}

/**
 * Abre o editor numa página limpa e espera o Monaco carregar.
 * opcoes.arquivos: 'simulados' (padrão), 'indisponivel' ou 'nativo'
 * opcoes.abrirArquivos: [{ nome, conteudo }] devolvidos pelo seletor simulado
 * opcoes.respostaPrompt: texto para responder a window.prompt
 * Retorna a lista de erros de JavaScript da página (deve terminar vazia).
 */
async function abrirEditor(page, opcoes = {}) {
    const erros = [];
    page.on('pageerror', (erro) => erros.push(erro.message));
    page.on('dialog', async (dialogo) => {
        if (dialogo.type() === 'beforeunload') {
            await dialogo.accept();
        } else if (dialogo.type() === 'prompt' && opcoes.respostaPrompt !== undefined) {
            await dialogo.accept(opcoes.respostaPrompt);
        } else {
            await dialogo.dismiss();
        }
    });
    const modo = opcoes.arquivos || 'simulados';
    if (modo === 'simulados') {
        await page.addInitScript(instalarArquivosSimulados, opcoes.abrirArquivos || []);
    } else if (modo === 'indisponivel') {
        await page.addInitScript(removerAcessoArquivos);
    }
    await page.goto('/');
    await esperarCarregar(page);
    return erros;
}

async function esperarCarregar(page) {
    await page.waitForFunction(() => window.editor && window.monaco, null, { timeout: 30000 });
    await expect(page.locator('#estado')).not.toHaveText('Carregando editor...');
}

async function recarregar(page) {
    await page.reload();
    await esperarCarregar(page);
}

async function definirConteudo(page, texto) {
    await page.evaluate((valor) => window.editor.setValue(valor), texto);
}

async function obterConteudo(page) {
    return page.evaluate(() => window.editor.getValue());
}

async function focarEditor(page) {
    await page.locator('#container .view-lines').click();
}

// Seleciona do (linha, coluna) inicial ao final, como no Monaco (base 1).
async function selecionar(page, linha, colunaInicial, linhaFinal, colunaFinal) {
    await page.evaluate(([l1, c1, l2, c2]) => {
        window.editor.setSelection(new window.monaco.Selection(l1, c1, l2, c2));
        window.editor.focus();
    }, [linha, colunaInicial, linhaFinal, colunaFinal]);
}

async function novaAba(page, linguagem, conteudo) {
    await page.locator('#nova-aba').click();
    if (linguagem) {
        await page.locator('#linguagem').selectOption(linguagem);
    }
    if (conteudo !== undefined) {
        await definirConteudo(page, conteudo);
    }
}

function nomesDasAbas(page) {
    return page.locator('.aba-nome').allTextContents();
}

// Lê ou escreve nos editores do formatador JSON ('entrada' ou 'saida').
async function editorJson(page, qual, valor) {
    return page.evaluate(([alvo, texto]) => {
        const editorAlvo = window.monaco.editor.getEditors().find(function (item) {
            return item.getModel() && item.getModel().uri.toString().includes(`json-${alvo}`);
        });
        if (typeof texto === 'string') {
            editorAlvo.setValue(texto);
        }
        const posicao = editorAlvo.getPosition();
        return { valor: editorAlvo.getValue(), linha: posicao.lineNumber, coluna: posicao.column };
    }, [qual, valor]);
}

async function arquivosGravados(page) {
    return page.evaluate(() => window.__arquivosGravados || {});
}

module.exports = {
    abrirEditor,
    recarregar,
    definirConteudo,
    obterConteudo,
    focarEditor,
    selecionar,
    novaAba,
    nomesDasAbas,
    editorJson,
    arquivosGravados
};
