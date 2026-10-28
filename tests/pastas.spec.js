// Área: painel de pastas (árvore de arquivos de uma pasta).
// Os mesmos testes rodam com as duas fontes de arquivos:
// - "navegador": a pasta do computador no Edge e no Chrome. Ela é simulada com o armazenamento privado
//   do navegador (OPFS), que usa a mesma API: os arquivos são criados, lidos, renomeados e apagados de
//   verdade, só que fora do disco.
// - "servidor": a versão homelab (servidor/servidor.js), ligada para cada teste numa pasta temporária,
//   no Edge e no Firefox.
const { test, expect } = require('@playwright/test');
const { abrirEditor, recarregar, obterConteudo, nomesDasAbas } = require('./utilidades');
const { iniciarServidor, criarNoDisco, lerDoDisco } = require('./homelab');

// Fonte do teste em andamento e, na versão homelab, o servidor dele.
let fonte = 'navegador';
let homelab;

const estrutura = {
    'notas.md': '# Notas\n',
    'app.js': 'let a = 1;\n',
    'leia.txt': 'texto\n',
    'logo.png': 'binario',
    'Item 10.md': 'dez\n',
    'Item 2.md': 'dois\n',
    'docs/guia.md': '# Guia\n',
    'docs/sub/fundo.md': 'fundo\n',
    'src/index.js': 'console.log(1);\n',
    'vazia/': null,
    '.git/config': 'x',
    'node_modules/pacote/index.js': 'x'
};

// Roda antes do editor: o seletor de pasta devolve a pasta "projeto" do OPFS. As chaves do
// localStorage simulam a pessoa cancelando o seletor ou o navegador pedindo permissão de novo.
function instalarPastaSimulada() {
    window.showDirectoryPicker = async function () {
        if (localStorage.getItem('teste-cancelar-pasta')) {
            throw new DOMException('Cancelado', 'AbortError');
        }
        const raiz = await navigator.storage.getDirectory();
        return raiz.getDirectoryHandle('projeto', { create: true });
    };
    if (localStorage.getItem('teste-permissao-pasta')) {
        FileSystemHandle.prototype.queryPermission = async function () {
            return localStorage.getItem('teste-permissao-pasta') || 'granted';
        };
        FileSystemHandle.prototype.requestPermission = async function () {
            const resposta = localStorage.getItem('teste-resposta-permissao') || 'granted';
            if (resposta === 'granted') {
                localStorage.removeItem('teste-permissao-pasta');
            }
            return resposta;
        };
    }
}

async function criarArquivos(page, arquivos) {
    if (fonte === 'servidor') {
        criarNoDisco(homelab.pasta, arquivos);
        return;
    }
    await page.evaluate(async (lista) => {
        const raiz = await (await navigator.storage.getDirectory()).getDirectoryHandle('projeto', { create: true });
        for (const [caminho, conteudo] of Object.entries(lista)) {
            const partes = caminho.replace(/\/$/, '').split('/');
            let pasta = raiz;
            for (const parte of partes.slice(0, -1)) {
                pasta = await pasta.getDirectoryHandle(parte, { create: true });
            }
            if (conteudo === null) {
                await pasta.getDirectoryHandle(partes[partes.length - 1], { create: true });
                continue;
            }
            const arquivo = await pasta.getFileHandle(partes[partes.length - 1], { create: true });
            const gravavel = await arquivo.createWritable();
            await gravavel.write(conteudo);
            await gravavel.close();
        }
    }, arquivos);
}

// Tudo o que está na pasta: { 'docs/guia.md': '# Guia\n', 'vazia/': null, ... }
async function lerArquivos(page) {
    if (fonte === 'servidor') {
        return lerDoDisco(homelab.pasta);
    }
    return page.evaluate(async () => {
        const resultado = {};
        async function ler(pasta, prefixo) {
            for await (const [nome, item] of pasta.entries()) {
                if (item.kind === 'directory') {
                    resultado[`${prefixo}${nome}/`] = null;
                    await ler(item, `${prefixo}${nome}/`);
                } else {
                    resultado[`${prefixo}${nome}`] = await (await item.getFile()).text();
                }
            }
        }
        await ler(await (await navigator.storage.getDirectory()).getDirectoryHandle('projeto', { create: true }), '');
        return resultado;
    });
}

const item = (page, caminho) => page.locator(`#arvore-pastas [data-caminho="${caminho}"]`);
const linha = (page, caminho) => item(page, caminho).locator(':scope > .arvore-linha');
const entrada = (page) => page.locator('#arvore-pastas .arvore-entrada');

// Nomes visíveis no primeiro nível da árvore, na ordem da tela.
function nomesDaRaiz(page) {
    return page.locator('#arvore-pastas > [role="treeitem"] > .arvore-linha .arvore-nome').allTextContents();
}

async function abrirComPasta(page, arquivos = estrutura, opcoes) {
    if (fonte === 'servidor') {
        criarNoDisco(homelab.pasta, arquivos);
        const errosServidor = await abrirEditor(page, { ...opcoes, endereco: homelab.endereco });
        await page.locator('#trilho-pastas').click();
        await expect(page.locator('#arvore-pastas [role="treeitem"]').first()).toBeVisible();
        return errosServidor;
    }
    await page.addInitScript(instalarPastaSimulada);
    const erros = await abrirEditor(page, opcoes);
    await criarArquivos(page, arquivos);
    await page.locator('#trilho-pastas').click();
    await page.locator('#pastas-abrir').click();
    await expect(page.locator('#arvore-pastas [role="treeitem"]').first()).toBeVisible();
    return erros;
}

// O acesso à pasta é guardado no IndexedDB meio segundo depois da última mudança.
async function esperarPastaGravada(page, condicao) {
    await expect.poll(() => page.evaluate((esperado) => new Promise((resolver) => {
        const pedido = indexedDB.open('meu-editor-web', 1);
        pedido.onerror = () => resolver(false);
        pedido.onsuccess = () => {
            const banco = pedido.result;
            const leitura = banco.transaction('sessao', 'readonly').objectStore('sessao').get('atual');
            leitura.onerror = () => resolver(false);
            leitura.onsuccess = () => {
                banco.close();
                const sessao = leitura.result;
                const pasta = sessao && sessao.pasta;
                resolver(Boolean(pasta && pasta.manipulador
                    && (esperado.expandidas || []).every((caminho) => pasta.expandidas.includes(caminho))
                    && (esperado.abertos || []).every((caminho) => sessao.documentos.some((documento) => documento.caminhoPasta === caminho && documento.manipulador))));
            };
        };
    }), condicao || {})).toBe(true);
}

async function confirmarDialogo(page, texto) {
    await expect(page.locator('#dialogo-confirmacao')).toBeVisible();
    if (texto) {
        await expect(page.locator('#dialogo-mensagem')).toContainText(texto);
    }
    await page.locator('#dialogo-confirmar').click();
}

for (const nomeFonte of ['navegador', 'servidor']) {
    test.describe(nomeFonte === 'navegador' ? 'Pastas' : 'Pastas no homelab', () => {
        if (nomeFonte === 'navegador') {
            test.skip(({ browserName }) => browserName === 'firefox', 'O Firefox não abre pastas; o aviso é testado abaixo.');
        }
        test.beforeEach(async () => {
            fonte = nomeFonte;
            if (fonte === 'servidor') {
                homelab = await iniciarServidor();
            }
        });
        test.afterEach(async () => {
            if (homelab) {
                await homelab.parar();
                homelab = undefined;
            }
        });
        // Excluir no navegador apaga de vez; no servidor, manda para a lixeira dele.
        const avisoExclusao = nomeFonte === 'servidor' ? 'lixeira do servidor' : 'não vai para a Lixeira';

        test('o painel começa fechado; o botão Pastas abre e fecha, e a escolha fica lembrada', async ({ page }) => {
            test.skip(fonte === 'servidor', 'Só com a pasta do navegador.');
            await page.addInitScript(instalarPastaSimulada);
            const erros = await abrirEditor(page);
            const botao = page.locator('#trilho-pastas');
            await expect(page.locator('#painel-pastas')).toBeHidden();
            await expect(botao).toHaveAttribute('aria-pressed', 'false');
            await botao.click();
            await expect(page.locator('#painel-pastas')).toBeVisible();
            await expect(botao).toHaveAttribute('aria-pressed', 'true');
            await expect(page.locator('#pastas-vazio')).toBeVisible();
            await expect(page.locator('#pastas-abrir')).toBeFocused();
            await recarregar(page);
            await expect(page.locator('#painel-pastas')).toBeVisible();
            await page.locator('#trilho-pastas').click();
            await expect(page.locator('#painel-pastas')).toBeHidden();
            await expect(page.locator('#container textarea')).toBeFocused();
            await recarregar(page);
            await expect(page.locator('#painel-pastas')).toBeHidden();
            expect(erros).toEqual([]);
        });

        test('abrir uma pasta mostra pastas primeiro, em ordem alfabética, sem .git e node_modules', async ({ page }) => {
            const erros = await abrirComPasta(page);
            await expect(page.locator('#pastas-titulo')).toHaveText('projeto');
            expect(await nomesDaRaiz(page)).toEqual(['docs', 'src', 'vazia', 'app.js', 'Item 2.md', 'Item 10.md', 'leia.txt', 'logo.png', 'notas.md']);
            if (fonte === 'navegador') {
                await expect(page.locator('#estado')).toHaveText('Pasta aberta: projeto');
                await expect(item(page, 'docs')).toBeFocused();
            }
            expect(erros).toEqual([]);
        });

        test('cada arquivo tem o ícone do seu tipo', async ({ page }) => {
            await abrirComPasta(page);
            await expect(linha(page, 'notas.md').locator('.arvore-icone')).toHaveText('MD');
            await expect(linha(page, 'app.js').locator('.arvore-icone')).toHaveText('JS');
            await expect(linha(page, 'leia.txt').locator('.arvore-icone')).toHaveText('TXT');
            await expect(linha(page, 'logo.png').locator('.arvore-icone svg')).toHaveCount(1);
            await expect(linha(page, 'docs').locator('.arvore-icone.pasta svg')).toHaveCount(1);
        });

        test('cancelar a escolha da pasta não muda nada', async ({ page }) => {
            test.skip(fonte === 'servidor', 'Só com a pasta do navegador.');
            await page.addInitScript(instalarPastaSimulada);
            await abrirEditor(page);
            await page.evaluate(() => localStorage.setItem('teste-cancelar-pasta', '1'));
            await page.locator('#trilho-pastas').click();
            await page.locator('#pastas-abrir').click();
            await expect(page.locator('#pastas-vazio')).toBeVisible();
            await expect(page.locator('#pastas-erro')).toBeHidden();
        });

        test('clicar numa pasta expande e recolhe; o conteúdo é lido na hora', async ({ page }) => {
            await abrirComPasta(page);
            await expect(item(page, 'docs/guia.md')).toHaveCount(0);
            await linha(page, 'docs').click();
            await expect(item(page, 'docs')).toHaveAttribute('aria-expanded', 'true');
            await expect(item(page, 'docs/guia.md')).toBeVisible();
            await expect(item(page, 'docs/sub')).toBeVisible();
            await linha(page, 'docs/sub').click();
            await expect(item(page, 'docs/sub/fundo.md')).toBeVisible();
            await linha(page, 'docs').click();
            await expect(item(page, 'docs')).toHaveAttribute('aria-expanded', 'false');
            await expect(item(page, 'docs/guia.md')).toHaveCount(0);
            // A subpasta continua expandida quando a pasta de cima abre de novo.
            await linha(page, 'docs').click();
            await expect(item(page, 'docs/sub/fundo.md')).toBeVisible();
            await page.locator('#pastas-recolher').click();
            await expect(item(page, 'docs/guia.md')).toHaveCount(0);
            await expect(item(page, 'docs')).toBeFocused();
        });

        test('pasta vazia mostra "Pasta vazia"', async ({ page }) => {
            await abrirComPasta(page);
            await linha(page, 'vazia').click();
            await expect(item(page, 'vazia').locator('.arvore-vazia')).toHaveText('Pasta vazia');
        });

        test('clicar num arquivo abre numa aba; clicar de novo só volta para ela', async ({ page }) => {
            const erros = await abrirComPasta(page);
            await linha(page, 'app.js').click();
            await expect(page.locator('.aba.ativa .aba-nome')).toHaveText('app.js');
            await expect(page.locator('#linguagem')).toHaveValue('javascript');
            expect(await obterConteudo(page)).toBe('let a = 1;\n');
            await expect(item(page, 'app.js')).toHaveClass(/atual/);
            await expect(page.locator('#container textarea')).toBeFocused();

            await linha(page, 'leia.txt').click();
            await expect(page.locator('.aba.ativa .aba-nome')).toHaveText('leia.txt');
            await expect(item(page, 'leia.txt')).toHaveClass(/atual/);
            await expect(item(page, 'app.js')).not.toHaveClass(/atual/);

            await linha(page, 'app.js').click();
            await expect(page.locator('.aba.ativa .aba-nome')).toHaveText('app.js');
            expect(await nomesDasAbas(page)).toEqual(['Sem título 1', 'app.js', 'leia.txt']);

            // Trocar de aba pela barra de abas também muda o destaque.
            await page.locator('.aba-nome', { hasText: 'leia.txt' }).click();
            await expect(item(page, 'leia.txt')).toHaveClass(/atual/);
            await page.locator('.aba-nome', { hasText: 'Sem título 1' }).click();
            await expect(page.locator('#arvore-pastas .atual')).toHaveCount(0);
            expect(erros).toEqual([]);
        });

        test('arquivo que não é texto não abre', async ({ page }) => {
            await abrirComPasta(page);
            await linha(page, 'logo.png').click();
            await expect(page.locator('#pastas-erro')).toContainText('não é um arquivo de texto');
            expect(await nomesDasAbas(page)).toEqual(['Sem título 1']);
        });

        test('Ctrl+S grava direto no arquivo da pasta', async ({ page }) => {
            await abrirComPasta(page);
            await linha(page, 'app.js').click();
            await expect(page.locator('.aba.ativa .aba-nome')).toHaveText('app.js');
            await expect(page.locator('#container textarea')).toBeFocused();
            await page.keyboard.press('End');
            await page.keyboard.type(' // editado');
            await expect(page.locator('.aba.modificada')).toHaveCount(1);
            await page.keyboard.press('Control+S');
            await expect(page.locator('.aba.modificada')).toHaveCount(0);
            expect((await lerArquivos(page))['app.js']).toBe('let a = 1; // editado\n');
        });

        test('novo arquivo pelo topo do painel: nome sugerido, abre no modo Visual pronto para escrever', async ({ page }) => {
            const erros = await abrirComPasta(page);
            await page.locator('#pastas-novo-arquivo').click();
            await expect(entrada(page)).toBeFocused();
            await expect(entrada(page)).toHaveValue('novo-arquivo.md');
            // Só o nome fica selecionado; a extensão continua.
            await page.keyboard.type('ideias');
            await expect(entrada(page)).toHaveValue('ideias.md');
            await page.keyboard.press('Enter');
            await expect(page.locator('.aba.ativa .aba-nome')).toHaveText('ideias.md');
            await expect(item(page, 'ideias.md')).toHaveClass(/atual/);
            await expect(page.locator('[data-modo="visual"]')).toHaveAttribute('aria-pressed', 'true');
            await expect(page.locator('#editor-visual .ProseMirror')).toBeFocused({ timeout: 30000 });
            await page.keyboard.type('Primeira linha', { delay: 30 });
            await expect.poll(() => obterConteudo(page)).toContain('Primeira linha');
            expect((await lerArquivos(page))['ideias.md']).toBe('');
            await page.keyboard.press('Control+S');
            await expect(page.locator('.aba.modificada')).toHaveCount(0);
            expect((await lerArquivos(page))['ideias.md']).toContain('Primeira linha');
            expect(erros).toEqual([]);
        });

        test('novo arquivo com outra extensão abre no modo da linguagem', async ({ page }) => {
            await abrirComPasta(page);
            await page.locator('#pastas-novo-arquivo').click();
            await expect(entrada(page)).toBeFocused();
            await page.keyboard.press('Control+A');
            await page.keyboard.type('teste.js');
            await page.keyboard.press('Enter');
            await expect(page.locator('.aba.ativa .aba-nome')).toHaveText('teste.js');
            await expect(page.locator('#linguagem')).toHaveValue('javascript');
            await expect(page.locator('#container textarea')).toBeFocused();
        });

        test('o nome sugerido não repete um que já existe', async ({ page }) => {
            await abrirComPasta(page, { 'novo-arquivo.md': '', 'nova-pasta/': null });
            await page.locator('#pastas-novo-arquivo').click();
            await expect(entrada(page)).toBeFocused();
            await expect(entrada(page)).toHaveValue('novo-arquivo-2.md');
            await page.keyboard.press('Escape');
            await page.locator('#pastas-nova-pasta').click();
            await expect(entrada(page)).toBeFocused();
            await expect(entrada(page)).toHaveValue('nova-pasta-2');
        });

        test('botão direito numa pasta cria arquivo e pasta dentro dela', async ({ page }) => {
            await abrirComPasta(page);
            await linha(page, 'docs').click({ button: 'right' });
            await expect(page.locator('#menu-pastas')).toBeVisible();
            await page.locator('#menu-pastas [data-acao="novo-arquivo"]').click();
            await expect(entrada(page)).toBeFocused();
            await expect(item(page, 'docs')).toHaveAttribute('aria-expanded', 'true');
            await page.keyboard.type('capitulo');
            await page.keyboard.press('Enter');
            await expect(page.locator('.aba.ativa .aba-nome')).toHaveText('capitulo.md');
            await expect(item(page, 'docs/capitulo.md')).toHaveClass(/atual/);

            await linha(page, 'docs').click({ button: 'right' });
            await page.locator('#menu-pastas [data-acao="nova-pasta"]').click();
            await expect(entrada(page)).toBeFocused();
            await page.keyboard.type('anexos');
            await page.keyboard.press('Enter');
            await expect(item(page, 'docs/anexos')).toBeFocused();
            await expect(item(page, 'docs/anexos')).toHaveAttribute('aria-expanded', 'false');
            const arquivos = await lerArquivos(page);
            expect(arquivos['docs/capitulo.md']).toBe('');
            expect(arquivos['docs/anexos/']).toBeNull();
        });

        test('botão direito num arquivo cria ao lado dele; no espaço vazio, na pasta aberta', async ({ page }) => {
            await abrirComPasta(page);
            await linha(page, 'docs').click();
            await linha(page, 'docs/guia.md').click({ button: 'right' });
            await page.locator('#menu-pastas [data-acao="nova-pasta"]').click();
            await expect(entrada(page)).toBeFocused();
            await page.keyboard.type('irma');
            await page.keyboard.press('Enter');
            await expect(item(page, 'docs/irma')).toBeVisible();

            await page.locator('#pastas-conteudo').click({ button: 'right', position: { x: 100, y: 400 } });
            await expect(page.locator('#menu-pastas [data-acao="renomear"]')).toBeHidden();
            await expect(page.locator('#menu-pastas [data-acao="excluir"]')).toBeHidden();
            await page.locator('#menu-pastas [data-acao="nova-pasta"]').click();
            await expect(entrada(page)).toBeFocused();
            await page.keyboard.type('raiz-nova');
            await page.keyboard.press('Enter');
            await expect(item(page, 'raiz-nova')).toBeVisible();
        });

        test('o menu do botão ⋯ fecha com Esc e devolve o foco ao item', async ({ page }) => {
            await abrirComPasta(page);
            await linha(page, 'notas.md').hover();
            await linha(page, 'notas.md').locator('.arvore-mais').click();
            await expect(page.locator('#menu-pastas')).toBeVisible();
            await expect(page.locator('#menu-pastas [data-acao="novo-arquivo"]')).toBeFocused();
            await page.keyboard.press('ArrowDown');
            await expect(page.locator('#menu-pastas [data-acao="nova-pasta"]')).toBeFocused();
            await page.keyboard.press('Escape');
            await expect(page.locator('#menu-pastas')).toBeHidden();
            await expect(item(page, 'notas.md')).toBeFocused();
            expect(await nomesDasAbas(page)).toEqual(['Sem título 1']);
        });

        test('nome repetido ou inválido mostra o motivo e não cria nada; Esc desiste', async ({ page }) => {
            await abrirComPasta(page);
            const antes = await lerArquivos(page);
            await page.locator('#pastas-novo-arquivo').click();
            await expect(entrada(page)).toBeFocused();
            await page.keyboard.press('Control+A');
            await page.keyboard.type('NOTAS.md');
            await expect(page.locator('#pastas-erro')).toHaveText('Já existe "NOTAS.md" nesta pasta.');
            await page.keyboard.press('Enter');
            await expect(entrada(page)).toHaveAttribute('aria-invalid', 'true');
            await expect(entrada(page)).toBeFocused();
            await page.keyboard.press('Control+A');
            await page.keyboard.type('a:b.md');
            await expect(page.locator('#pastas-erro')).toContainText('não pode ter');
            await page.keyboard.press('Control+A');
            await page.keyboard.type('fim.');
            await expect(page.locator('#pastas-erro')).toContainText('terminar com ponto');
            await page.keyboard.press('Control+A');
            await page.keyboard.type('con.txt');
            await expect(page.locator('#pastas-erro')).toContainText('reservado');
            await page.keyboard.press('Escape');
            await expect(entrada(page)).toHaveCount(0);
            await expect(page.locator('#pastas-erro')).toBeHidden();
            await expect(item(page, 'docs')).toBeFocused();
            expect(await lerArquivos(page)).toEqual(antes);
        });

        test('renomear com F2 muda o arquivo e a aba aberta, inclusive a linguagem', async ({ page }) => {
            await abrirComPasta(page);
            await linha(page, 'notas.md').click();
            await expect(page.locator('#linguagem')).toHaveValue('markdown');
            await item(page, 'notas.md').focus();
            await page.keyboard.press('F2');
            await expect(entrada(page)).toBeFocused();
            await expect(entrada(page)).toHaveValue('notas.md');
            // O nome vem selecionado sem a extensão.
            await page.keyboard.type('anotacoes');
            await page.keyboard.press('Enter');
            await expect(item(page, 'anotacoes.md')).toBeFocused();
            await expect(item(page, 'notas.md')).toHaveCount(0);
            await expect(page.locator('.aba.ativa .aba-nome')).toHaveText('anotacoes.md');
            await expect(item(page, 'anotacoes.md')).toHaveClass(/atual/);

            await page.keyboard.press('F2');
            await expect(entrada(page)).toBeFocused();
            await page.keyboard.press('Control+A');
            await page.keyboard.type('anotacoes.txt');
            await page.keyboard.press('Enter');
            await expect(page.locator('.aba.ativa .aba-nome')).toHaveText('anotacoes.txt');
            await expect(page.locator('#linguagem')).toHaveValue('plaintext');
            const arquivos = await lerArquivos(page);
            expect(arquivos['anotacoes.txt']).toBe('# Notas\n');
            expect(arquivos['notas.md']).toBeUndefined();
            expect(arquivos['anotacoes.md']).toBeUndefined();
        });

        test('renomear sem mudar o nome, ou com Esc, não altera nada', async ({ page }) => {
            await abrirComPasta(page);
            await item(page, 'app.js').focus();
            await page.keyboard.press('F2');
            await expect(entrada(page)).toBeFocused();
            await page.keyboard.press('Enter');
            await expect(item(page, 'app.js')).toBeFocused();
            await page.keyboard.press('F2');
            await expect(entrada(page)).toBeFocused();
            await page.keyboard.type('outro');
            await page.keyboard.press('Escape');
            await expect(item(page, 'app.js')).toBeFocused();
            expect((await lerArquivos(page))['app.js']).toBe('let a = 1;\n');
        });

        test('renomear funciona também quando o navegador não sabe mover (copia e apaga)', async ({ page }) => {
            test.skip(fonte === 'servidor', 'Só com a pasta do navegador.');
            await abrirComPasta(page);
            await page.evaluate(() => { FileSystemHandle.prototype.move = undefined; });
            await linha(page, 'app.js').click({ button: 'right' });
            await page.locator('#menu-pastas [data-acao="renomear"]').click();
            await expect(entrada(page)).toBeFocused();
            await page.keyboard.press('Control+A');
            await page.keyboard.type('principal.js');
            await page.keyboard.press('Enter');
            await expect(item(page, 'principal.js')).toBeVisible();
            await linha(page, 'docs').click({ button: 'right' });
            await page.locator('#menu-pastas [data-acao="renomear"]').click();
            await expect(entrada(page)).toBeFocused();
            await page.keyboard.press('Control+A');
            await page.keyboard.type('manual');
            await page.keyboard.press('Enter');
            await expect(item(page, 'manual')).toBeVisible();
            const arquivos = await lerArquivos(page);
            expect(arquivos['principal.js']).toBe('let a = 1;\n');
            expect(arquivos['app.js']).toBeUndefined();
            expect(arquivos['manual/guia.md']).toBe('# Guia\n');
            expect(arquivos['manual/sub/fundo.md']).toBe('fundo\n');
            expect(arquivos['docs/']).toBeUndefined();
        });

        test('renomear uma pasta com um arquivo aberto: a aba continua salvando no lugar certo', async ({ page }) => {
            await abrirComPasta(page);
            await linha(page, 'docs').click();
            await linha(page, 'docs/sub').click();
            await linha(page, 'docs/sub/fundo.md').click();
            await page.locator('[data-modo="editor"]').click();
            await item(page, 'docs').focus();
            await page.keyboard.press('F2');
            await expect(entrada(page)).toBeFocused();
            await page.keyboard.press('Control+A');
            await page.keyboard.type('manual');
            await page.keyboard.press('Enter');
            // As pastas expandidas continuam expandidas com o nome novo.
            await expect(item(page, 'manual/sub/fundo.md')).toHaveClass(/atual/);
            await page.locator('#container .view-lines').click();
            await page.keyboard.press('Control+End');
            await page.keyboard.type('mais');
            await page.keyboard.press('Control+S');
            await expect(page.locator('.aba.modificada')).toHaveCount(0);
            const arquivos = await lerArquivos(page);
            expect(arquivos['manual/sub/fundo.md']).toBe('fundo\nmais');
            expect(arquivos['docs/']).toBeUndefined();
        });

        test('arrastar um arquivo para uma pasta move o arquivo, e a aba aberta continua salvando nele', async ({ page }) => {
            await abrirComPasta(page);
            await linha(page, 'notas.md').click();
            await page.locator('[data-modo="editor"]').click();
            await linha(page, 'notas.md').dragTo(linha(page, 'docs'));
            await expect(item(page, 'docs/notas.md')).toBeFocused();
            await expect(item(page, 'notas.md')).toHaveCount(0);
            await expect(item(page, 'docs')).toHaveAttribute('aria-expanded', 'true');
            await expect(item(page, 'docs/notas.md')).toHaveClass(/atual/);
            await expect(page.locator('#estado')).toHaveText('"notas.md" movido para docs');
            expect(await nomesDasAbas(page)).toEqual(['Sem título 1', 'notas.md']);
            await page.locator('#container .view-lines').click();
            await page.keyboard.press('Control+End');
            await page.keyboard.type('mais');
            await page.keyboard.press('Control+S');
            await expect(page.locator('.aba.modificada')).toHaveCount(0);
            const arquivos = await lerArquivos(page);
            expect(arquivos['docs/notas.md']).toBe('# Notas\nmais');
            expect(arquivos['notas.md']).toBeUndefined();
        });

        test('soltar num arquivo leva para a pasta dele; no espaço vazio, para a pasta aberta', async ({ page }) => {
            await abrirComPasta(page);
            await linha(page, 'docs').click();
            await linha(page, 'app.js').dragTo(linha(page, 'docs/guia.md'));
            await expect(item(page, 'docs/app.js')).toBeFocused();
            const caixa = await page.locator('#pastas-conteudo').boundingBox();
            await linha(page, 'docs/guia.md').dragTo(page.locator('#pastas-conteudo'), { targetPosition: { x: 40, y: caixa.height - 10 } });
            await expect(item(page, 'guia.md')).toBeFocused();
            const arquivos = await lerArquivos(page);
            expect(arquivos['docs/app.js']).toBe('let a = 1;\n');
            expect(arquivos['guia.md']).toBe('# Guia\n');
            expect(arquivos['app.js']).toBeUndefined();
            expect(arquivos['docs/guia.md']).toBeUndefined();
        });

        test('arrastar uma pasta leva tudo junto; parar sobre uma pasta fechada abre ela', async ({ page }) => {
            await abrirComPasta(page);
            await linha(page, 'docs').click();
            await linha(page, 'docs/sub').click();
            await linha(page, 'docs/sub/fundo.md').click();
            await page.locator('[data-modo="editor"]').click();
            await linha(page, 'docs').hover();
            await page.mouse.down();
            const caixa = await linha(page, 'vazia').boundingBox();
            await page.mouse.move(caixa.x + 40, caixa.y + caixa.height / 2, { steps: 5 });
            await expect(item(page, 'vazia')).toHaveAttribute('aria-expanded', 'true');
            await expect(item(page, 'vazia')).toHaveClass(/alvo-soltar/);
            await page.mouse.move(caixa.x + 42, caixa.y + caixa.height / 2);
            await page.mouse.up();
            // As pastas que estavam expandidas continuam expandidas no lugar novo.
            await expect(item(page, 'vazia/docs/sub/fundo.md')).toHaveClass(/atual/);
            await expect(page.locator('#arvore-pastas .alvo-soltar, #pastas-conteudo.alvo-soltar')).toHaveCount(0);
            await page.locator('#container .view-lines').click();
            await page.keyboard.press('Control+End');
            await page.keyboard.type('mais');
            await page.keyboard.press('Control+S');
            await expect(page.locator('.aba.modificada')).toHaveCount(0);
            const arquivos = await lerArquivos(page);
            expect(arquivos['vazia/docs/guia.md']).toBe('# Guia\n');
            expect(arquivos['vazia/docs/sub/fundo.md']).toBe('fundo\nmais');
            expect(Object.keys(arquivos).filter((caminho) => caminho.startsWith('docs'))).toEqual([]);
        });

        test('uma pasta não vai para dentro dela mesma, e soltar na própria pasta não muda nada', async ({ page }) => {
            await abrirComPasta(page);
            const antes = await lerArquivos(page);
            await linha(page, 'docs').click();
            await linha(page, 'docs').dragTo(linha(page, 'docs/sub'));
            await expect(page.locator('#pastas-erro')).toBeHidden();
            await linha(page, 'docs/guia.md').dragTo(linha(page, 'docs'));
            await expect(page.locator('#pastas-erro')).toBeHidden();
            expect(await lerArquivos(page)).toEqual(antes);
            await item(page, 'docs').focus();
            await page.keyboard.press('Control+X');
            await page.keyboard.press('ArrowDown');
            await expect(item(page, 'docs/sub')).toBeFocused();
            await page.keyboard.press('Control+V');
            await expect(page.locator('#pastas-erro')).toHaveText('Uma pasta não pode ir para dentro dela mesma.');
            await expect(item(page, 'docs')).not.toHaveClass(/recortado/);
            expect(await lerArquivos(page)).toEqual(antes);
        });

        test('Recortar e Colar pelo menu e pelo teclado; Esc desiste', async ({ page }) => {
            await abrirComPasta(page);
            await linha(page, 'docs').click({ button: 'right' });
            await expect(page.locator('#menu-pastas [data-acao="colar"]')).toBeHidden();
            await page.keyboard.press('Escape');
            await linha(page, 'app.js').click({ button: 'right' });
            await page.locator('#menu-pastas [data-acao="recortar"]').click();
            await expect(item(page, 'app.js')).toHaveClass(/recortado/);
            await expect(item(page, 'app.js')).toBeFocused();
            await linha(page, 'docs').click({ button: 'right' });
            await page.locator('#menu-pastas [data-acao="colar"]').click();
            await expect(item(page, 'docs/app.js')).toBeFocused();
            await expect(item(page, 'docs/app.js')).not.toHaveClass(/recortado/);

            await page.keyboard.press('Control+X');
            await expect(item(page, 'docs/app.js')).toHaveClass(/recortado/);
            await page.keyboard.press('Escape');
            await expect(item(page, 'docs/app.js')).not.toHaveClass(/recortado/);
            await expect(page.locator('#estado')).toHaveText('Recorte cancelado');
            await page.keyboard.press('Control+V');
            await expect(item(page, 'docs/app.js')).toBeFocused();

            // Colar num arquivo cola na pasta dele.
            await page.keyboard.press('Control+X');
            await linha(page, 'src').click();
            await item(page, 'src/index.js').focus();
            await page.keyboard.press('Control+V');
            await expect(item(page, 'src/app.js')).toBeFocused();
            const arquivos = await lerArquivos(page);
            expect(arquivos['src/app.js']).toBe('let a = 1;\n');
            expect(arquivos['docs/app.js']).toBeUndefined();
            expect(arquivos['app.js']).toBeUndefined();
        });

        test('mover para uma pasta que já tem um item com o mesmo nome avisa e não muda nada', async ({ page }) => {
            await abrirComPasta(page, { ...estrutura, 'docs/notas.md': 'outra\n' });
            await linha(page, 'notas.md').dragTo(linha(page, 'docs'));
            await expect(page.locator('#pastas-erro')).toHaveText('Não foi possível mover "notas.md": já existe "notas.md" em "docs".');
            await expect(item(page, 'notas.md')).toBeFocused();
            const arquivos = await lerArquivos(page);
            expect(arquivos['notas.md']).toBe('# Notas\n');
            expect(arquivos['docs/notas.md']).toBe('outra\n');
        });

        test('mover funciona também quando o navegador não sabe mover (copia e apaga)', async ({ page }) => {
            test.skip(fonte === 'servidor', 'Só com a pasta do navegador.');
            await abrirComPasta(page);
            await page.evaluate(() => { FileSystemHandle.prototype.move = undefined; });
            await linha(page, 'docs').dragTo(linha(page, 'src'));
            await expect(item(page, 'src/docs')).toBeFocused();
            await linha(page, 'leia.txt').dragTo(linha(page, 'src/docs'));
            await expect(item(page, 'src/docs/leia.txt')).toBeFocused();
            const arquivos = await lerArquivos(page);
            expect(arquivos['src/docs/guia.md']).toBe('# Guia\n');
            expect(arquivos['src/docs/sub/fundo.md']).toBe('fundo\n');
            expect(arquivos['src/docs/leia.txt']).toBe('texto\n');
            expect(arquivos['docs/']).toBeUndefined();
            expect(arquivos['leia.txt']).toBeUndefined();
        });

        test('excluir pede confirmação; Cancelar mantém e Excluir apaga e fecha a aba', async ({ page }) => {
            await abrirComPasta(page);
            await linha(page, 'app.js').click();
            await expect(page.locator('.aba.ativa .aba-nome')).toHaveText('app.js');
            await item(page, 'app.js').focus();
            await page.keyboard.press('Delete');
            await expect(page.locator('#dialogo-mensagem')).toContainText(avisoExclusao);
            await page.locator('#dialogo-confirmacao button[value="cancelar"]').click();
            await expect(item(page, 'app.js')).toBeFocused();
            expect((await lerArquivos(page))['app.js']).toBe('let a = 1;\n');

            await page.keyboard.press('Delete');
            await confirmarDialogo(page, 'Excluir "app.js"?');
            await expect(item(page, 'app.js')).toHaveCount(0);
            // O foco vai para o item seguinte.
            await expect(item(page, 'Item 2.md')).toBeFocused();
            expect(await nomesDasAbas(page)).toEqual(['Sem título 1']);
            expect((await lerArquivos(page))['app.js']).toBeUndefined();
            await expect(page.locator('#estado')).toHaveText('Arquivo excluído: app.js');
        });

        test('excluir um arquivo aberto com alterações avisa e mantém o texto na aba', async ({ page }) => {
            await abrirComPasta(page);
            await linha(page, 'app.js').click();
            await expect(page.locator('.aba.ativa .aba-nome')).toHaveText('app.js');
            await expect(page.locator('#container textarea')).toBeFocused();
            await page.keyboard.type('// rascunho\n');
            await expect(page.locator('.aba.modificada')).toHaveCount(1);
            await linha(page, 'app.js').click({ button: 'right' });
            await page.locator('#menu-pastas [data-acao="excluir"]').click();
            await confirmarDialogo(page, 'app.js está aberto com alterações não salvas');
            await expect(item(page, 'app.js')).toHaveCount(0);
            expect(await nomesDasAbas(page)).toEqual(['Sem título 1', 'app.js']);
            await expect(page.locator('.aba.modificada')).toHaveCount(1);
            expect(await obterConteudo(page)).toContain('// rascunho');
            expect((await lerArquivos(page))['app.js']).toBeUndefined();
        });

        test('excluir uma pasta apaga tudo dentro e fecha as abas sem alterações', async ({ page }) => {
            await abrirComPasta(page);
            await linha(page, 'docs').click();
            await linha(page, 'docs/guia.md').click();
            await linha(page, 'docs').click({ button: 'right' });
            await page.locator('#menu-pastas [data-acao="excluir"]').click();
            await confirmarDialogo(page, 'Excluir a pasta "docs" e tudo o que está dentro dela?');
            await expect(item(page, 'docs')).toHaveCount(0);
            await expect(item(page, 'src')).toBeFocused();
            expect(await nomesDasAbas(page)).toEqual(['Sem título 1']);
            const arquivos = await lerArquivos(page);
            expect(Object.keys(arquivos).filter((caminho) => caminho.startsWith('docs'))).toEqual([]);
        });

        test('dá para usar a árvore só com o teclado', async ({ page }) => {
            await abrirComPasta(page);
            await expect(item(page, 'docs')).toBeFocused();
            await page.keyboard.press('ArrowRight');
            await expect(item(page, 'docs')).toHaveAttribute('aria-expanded', 'true');
            await page.keyboard.press('ArrowRight');
            await expect(item(page, 'docs/sub')).toBeFocused();
            await page.keyboard.press('ArrowDown');
            await expect(item(page, 'docs/guia.md')).toBeFocused();
            await page.keyboard.press('ArrowLeft');
            await expect(item(page, 'docs')).toBeFocused();
            await page.keyboard.press('ArrowLeft');
            await expect(item(page, 'docs')).toHaveAttribute('aria-expanded', 'false');
            await page.keyboard.press('End');
            await expect(item(page, 'notas.md')).toBeFocused();
            await page.keyboard.press('Home');
            await expect(item(page, 'docs')).toBeFocused();
            await page.keyboard.press('Enter');
            await expect(item(page, 'docs')).toHaveAttribute('aria-expanded', 'true');
            await page.keyboard.press('End');
            await page.keyboard.press('ArrowUp');
            await expect(item(page, 'logo.png')).toBeFocused();
            await page.keyboard.press('ArrowUp');
            await page.keyboard.press('Enter');
            await expect(page.locator('.aba.ativa .aba-nome')).toHaveText('leia.txt');
            await expect(page.locator('#container textarea')).toBeFocused();
            // Tab volta para a árvore no item que estava com foco.
            await page.locator('#pastas-fechar').focus();
            await page.keyboard.press('Tab');
            await expect(item(page, 'leia.txt')).toBeFocused();
            await page.keyboard.press('Shift+F10');
            await expect(page.locator('#menu-pastas')).toBeVisible();
            await page.keyboard.press('Escape');
            await expect(item(page, 'leia.txt')).toBeFocused();
        });

        test('Atualizar mostra o que mudou na pasta por fora do editor', async ({ page }) => {
            await abrirComPasta(page);
            await linha(page, 'docs').click();
            await criarArquivos(page, { 'externo.md': 'x', 'docs/novo.md': 'y' });
            await expect(item(page, 'externo.md')).toHaveCount(0);
            await page.locator('#pastas-atualizar').click();
            await expect(item(page, 'externo.md')).toBeVisible();
            await expect(item(page, 'docs/novo.md')).toBeVisible();
            await expect(page.locator('#estado')).toHaveText('Pasta atualizada');
        });

        test('fechar a pasta volta ao início e mantém as abas', async ({ page }) => {
            await abrirComPasta(page);
            await linha(page, 'app.js').click();
            await page.locator('#pastas-fechar').click();
            await expect(page.locator('#pastas-vazio')).toBeVisible();
            await expect(page.locator('#arvore-pastas')).toBeHidden();
            await expect(page.locator('#pastas-titulo')).toHaveText('Pastas');
            await expect(page.locator('#pastas-abrir')).toHaveText(fonte === 'servidor' ? 'Abrir a pasta do servidor' : 'Abrir pasta');
            await expect(page.locator('#pastas-abrir')).toBeFocused();
            expect(await nomesDasAbas(page)).toEqual(['Sem título 1', 'app.js']);
            await recarregar(page);
            await expect(page.locator('#pastas-vazio')).toBeVisible();
        });

        test('depois de recarregar, a pasta, as pastas expandidas e o destaque da aba voltam', async ({ page }) => {
            const erros = await abrirComPasta(page);
            await linha(page, 'docs').click();
            await linha(page, 'docs/guia.md').click();
            await esperarPastaGravada(page, { expandidas: ['docs'], abertos: ['docs/guia.md'] });
            await recarregar(page);
            await expect(page.locator('#pastas-titulo')).toHaveText('projeto');
            await expect(item(page, 'docs/guia.md')).toHaveClass(/atual/);
            await expect(page.locator('.aba.ativa .aba-nome')).toHaveText('guia.md');
            // A aba restaurada continua gravando no arquivo.
            await page.locator('[data-modo="editor"]').click();
            await page.locator('#container .view-lines').click();
            await page.keyboard.press('Control+End');
            await page.keyboard.type('fim');
            await page.keyboard.press('Control+S');
            await expect(page.locator('.aba.modificada')).toHaveCount(0);
            expect((await lerArquivos(page))['docs/guia.md']).toBe('# Guia\nfim');
            expect(erros).toEqual([]);
        });

        test('se o navegador pedir permissão de novo, um clique em "Permitir acesso" mostra a árvore', async ({ page }) => {
            test.skip(fonte === 'servidor', 'Só com a pasta do navegador.');
            await abrirComPasta(page);
            await linha(page, 'docs').click();
            await esperarPastaGravada(page, { expandidas: ['docs'] });
            await page.evaluate(() => localStorage.setItem('teste-permissao-pasta', 'prompt'));
            await recarregar(page);
            await expect(page.locator('#pastas-permissao')).toBeVisible();
            await expect(page.locator('#pastas-permissao-texto')).toContainText('"projeto"');
            await expect(page.locator('#arvore-pastas')).toBeHidden();
            await expect(page.locator('#pastas-novo-arquivo')).toBeDisabled();
            await page.locator('#pastas-permitir').click();
            await expect(item(page, 'docs/guia.md')).toBeVisible();
            await expect(page.locator('#pastas-permissao')).toBeHidden();
        });

        test('permissão negada mostra o aviso e deixa tentar de novo', async ({ page }) => {
            test.skip(fonte === 'servidor', 'Só com a pasta do navegador.');
            await abrirComPasta(page);
            await esperarPastaGravada(page);
            await page.evaluate(() => {
                localStorage.setItem('teste-permissao-pasta', 'prompt');
                localStorage.setItem('teste-resposta-permissao', 'denied');
            });
            await recarregar(page);
            await page.locator('#pastas-permitir').click();
            await expect(page.locator('#pastas-erro')).toHaveText('O navegador não liberou o acesso à pasta.');
            await expect(page.locator('#pastas-permissao')).toBeVisible();
            await page.evaluate(() => localStorage.removeItem('teste-resposta-permissao'));
            await page.locator('#pastas-permitir').click();
            await expect(item(page, 'docs')).toBeVisible();
            await expect(page.locator('#pastas-erro')).toBeHidden();
        });

        test('a largura do painel muda arrastando a borda e fica lembrada', async ({ page }) => {
            await abrirComPasta(page);
            const alca = await page.locator('#painel-pastas-alca').boundingBox();
            await page.mouse.move(alca.x + alca.width / 2, alca.y + 200);
            await page.mouse.down();
            await page.mouse.move(alca.x + alca.width / 2 + 100, alca.y + 200, { steps: 5 });
            await page.mouse.up();
            const largura = (await page.locator('#painel-pastas').boundingBox()).width;
            expect(largura).toBeGreaterThan(330);
            expect(largura).toBeLessThan(350);
            await recarregar(page);
            expect((await page.locator('#painel-pastas').boundingBox()).width).toBeCloseTo(largura, 0);
            // Nem muito estreito, nem muito largo.
            await page.locator('#painel-pastas-alca').focus();
            for (let vez = 0; vez < 20; vez += 1) {
                await page.keyboard.press('ArrowRight');
            }
            await expect(page.locator('#painel-pastas-alca')).toHaveAttribute('aria-valuenow', '480');
        });

        test('a paleta de comandos abre uma pasta', async ({ page }) => {
            test.skip(fonte === 'servidor', 'Só com a pasta do navegador.');
            await page.addInitScript(instalarPastaSimulada);
            await abrirEditor(page);
            await criarArquivos(page, { 'a.md': 'a' });
            await page.locator('#container .view-lines').click();
            await page.keyboard.press('F1');
            await page.keyboard.type('Pastas: abrir pasta');
            await page.keyboard.press('Enter');
            await expect(page.locator('#painel-pastas')).toBeVisible();
            await expect(item(page, 'a.md')).toBeVisible();
        });

        test('no Edge sem acesso a arquivos, o painel explica que não abre pastas', async ({ page }) => {
            test.skip(fonte === 'servidor', 'Só com a pasta do navegador.');
            await abrirEditor(page, { arquivos: 'indisponivel' });
            await page.locator('#trilho-pastas').click();
            await expect(page.locator('#pastas-sem-suporte')).toBeVisible();
            await expect(page.locator('#pastas-abrir')).toBeHidden();
        });
    });
}

test.describe('Pastas no Firefox e no Zen', () => {
    test.skip(({ browserName }) => browserName !== 'firefox', 'Só no motor do Firefox.');

    test('o botão Pastas aparece e explica que é preciso o Edge, o Chrome ou a versão homelab', async ({ page }) => {
        const erros = await abrirEditor(page);
        await page.locator('#trilho-pastas').click();
        await expect(page.locator('#painel-pastas')).toBeVisible();
        await expect(page.locator('#pastas-sem-suporte')).toContainText('Edge ou o Chrome');
        await expect(page.locator('#pastas-sem-suporte')).toContainText('versão homelab');
        await expect(page.locator('#pastas-abrir')).toBeHidden();
        expect(erros).toEqual([]);
    });
});

// Coisas que só existem na versão homelab: senha, salvar documento novo, conflito e lixeira.
test.describe('Versão homelab', () => {
    let servidor;
    test.beforeEach(() => {
        fonte = 'servidor';
    });
    test.afterEach(async () => {
        if (servidor) {
            await servidor.parar();
            servidor = undefined;
        }
    });

    test('a pasta do servidor já está no painel, o botão é Salvar e não há aviso de download', async ({ page }) => {
        servidor = await iniciarServidor();
        criarNoDisco(servidor.pasta, { 'a.md': '# A', '.editor/lixeira/velho/x.md': 'x' });
        const erros = await abrirEditor(page, { endereco: servidor.endereco });
        await expect(page.locator('#salvar .rotulo')).toHaveText('Salvar');
        await expect(page.locator('#aviso-arquivos')).toBeHidden();
        await page.locator('#trilho-pastas').click();
        await expect(page.locator('#pastas-titulo')).toHaveText('projeto');
        await expect(item(page, 'a.md')).toBeVisible();
        // A pasta .editor (lixeira e cópias) não aparece.
        await expect(page.locator('#arvore-pastas [role="treeitem"]')).toHaveCount(1);
        expect(erros).toEqual([]);
    });

    test('documento novo é salvo na pasta do servidor com o nome perguntado', async ({ page }) => {
        servidor = await iniciarServidor();
        criarNoDisco(servidor.pasta, { 'docs/': null });
        await abrirEditor(page, { endereco: servidor.endereco, respostaPrompt: 'ideias.md' });
        await page.locator('#trilho-pastas').click();
        await linha(page, 'docs').click();
        await page.locator('#novo').click();
        await expect(page.locator('#editor-visual .ProseMirror')).toBeFocused({ timeout: 30000 });
        await page.keyboard.type('Primeira ideia', { delay: 30 });
        await expect.poll(() => obterConteudo(page)).toContain('Primeira ideia');
        await page.keyboard.press('Control+S');
        await expect(page.locator('.aba.ativa .aba-nome')).toHaveText('ideias.md');
        await expect(page.locator('.aba.modificada')).toHaveCount(0);
        // A pasta escolhida na árvore é onde o arquivo fica.
        expect(lerDoDisco(servidor.pasta)['docs/ideias.md']).toContain('Primeira ideia');
        await expect(item(page, 'docs/ideias.md')).toHaveClass(/atual/);
    });

    test('salvar com um nome que já existe avisa e não grava por cima', async ({ page }) => {
        servidor = await iniciarServidor();
        criarNoDisco(servidor.pasta, { 'a.md': 'original' });
        await abrirEditor(page, { endereco: servidor.endereco, respostaPrompt: 'A.md' });
        await page.locator('#novo').click();
        await expect(page.locator('#editor-visual .ProseMirror')).toBeFocused({ timeout: 30000 });
        await page.keyboard.type('novo', { delay: 30 });
        await expect.poll(() => obterConteudo(page)).toContain('novo');
        await page.keyboard.press('Control+S');
        await expect(page.locator('#estado')).toHaveText('Já existe "A.md" nesta pasta.');
        await expect(page.locator('.aba.modificada')).toHaveCount(1);
        expect(lerDoDisco(servidor.pasta)).toEqual({ 'a.md': 'original' });
    });

    test('arquivo alterado em outro aparelho: o editor pergunta antes de gravar por cima', async ({ page }) => {
        servidor = await iniciarServidor();
        criarNoDisco(servidor.pasta, { 'a.txt': 'versão 1\n' });
        await abrirEditor(page, { endereco: servidor.endereco });
        await page.locator('#trilho-pastas').click();
        await linha(page, 'a.txt').click();
        await expect(page.locator('#container textarea')).toBeFocused();
        await page.keyboard.press('Control+End');
        await page.keyboard.type('minha parte');
        criarNoDisco(servidor.pasta, { 'a.txt': 'versão do outro aparelho\n' });

        await page.keyboard.press('Control+S');
        await expect(page.locator('#dialogo-mensagem')).toContainText('a.txt foi alterado em outro aparelho');
        await page.locator('#dialogo-confirmacao button[value="cancelar"]').click();
        await expect(page.locator('#estado')).toHaveText('Não salvo: o arquivo foi alterado em outro aparelho');
        await expect(page.locator('.aba.modificada')).toHaveCount(1);
        expect(lerDoDisco(servidor.pasta)['a.txt']).toBe('versão do outro aparelho\n');

        await page.locator('#container .view-lines').click();
        await page.keyboard.press('Control+S');
        await confirmarDialogo(page, 'Gravar a sua versão por cima?');
        await expect(page.locator('.aba.modificada')).toHaveCount(0);
        expect(lerDoDisco(servidor.pasta)['a.txt']).toBe('versão 1\nminha parte');
        // A versão do outro aparelho ficou guardada nas cópias.
        const copias = Object.entries(lerDoDisco(servidor.pasta, true))
            .filter(([caminho]) => caminho.startsWith('.editor/copias/a.txt/') && !caminho.endsWith('/'));
        expect(copias.map(([, conteudo]) => conteudo)).toEqual(['versão do outro aparelho\n']);

        // Depois de gravar, a próxima gravação não acusa conflito.
        await page.locator('#container .view-lines').click();
        await page.keyboard.press('Control+End');
        await page.keyboard.type('!');
        await page.keyboard.press('Control+S');
        await expect(page.locator('.aba.modificada')).toHaveCount(0);
        await expect(page.locator('#dialogo-confirmacao')).toBeHidden();
        expect(lerDoDisco(servidor.pasta)['a.txt']).toBe('versão 1\nminha parte!');
    });

    test('excluir manda para a lixeira do servidor', async ({ page }) => {
        servidor = await iniciarServidor();
        criarNoDisco(servidor.pasta, { 'a.md': 'conteúdo', 'docs/b.md': 'b' });
        await abrirEditor(page, { endereco: servidor.endereco });
        await page.locator('#trilho-pastas').click();
        await linha(page, 'a.md').click({ button: 'right' });
        await page.locator('#menu-pastas [data-acao="excluir"]').click();
        await confirmarDialogo(page, 'O arquivo vai para a lixeira do servidor (.editor/lixeira) e fica lá por 30 dias.');
        await expect(item(page, 'a.md')).toHaveCount(0);
        const tudo = lerDoDisco(servidor.pasta, true);
        expect(tudo['a.md']).toBeUndefined();
        const naLixeira = Object.entries(tudo).find(([caminho]) => /^\.editor\/lixeira\/[^/]+\/a\.md$/.test(caminho));
        expect(naLixeira && naLixeira[1]).toBe('conteúdo');
    });

    test('com senha, o painel pede a senha uma vez', async ({ page }) => {
        servidor = await iniciarServidor({ senha: 'segredo' });
        criarNoDisco(servidor.pasta, { 'a.md': '# A' });
        const erros = await abrirEditor(page, { endereco: servidor.endereco });
        await page.locator('#trilho-pastas').click();
        await expect(page.locator('#pastas-senha')).toBeVisible();
        await expect(page.locator('#pastas-senha-campo')).toBeFocused();
        await expect(page.locator('#arvore-pastas')).toBeHidden();
        await page.keyboard.type('errada');
        await page.keyboard.press('Enter');
        await expect(page.locator('#pastas-erro')).toHaveText('Senha incorreta.');
        await page.locator('#pastas-senha-campo').fill('segredo');
        await page.keyboard.press('Enter');
        await expect(item(page, 'a.md')).toBeVisible();
        await expect(page.locator('#pastas-senha')).toBeHidden();
        await expect(page.locator('#pastas-erro')).toBeHidden();
        // O navegador lembra: depois de recarregar, não pede de novo.
        await recarregar(page);
        await expect(item(page, 'a.md')).toBeVisible();
        expect(erros).toEqual([]);
    });
});
