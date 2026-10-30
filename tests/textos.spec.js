// Área: textos rápidos (painel com textos para copiar ou inserir, abreviação + Tab, Alt+1 a Alt+9).
const { test, expect } = require('@playwright/test');
const { abrirEditor, recarregar, definirConteudo, obterConteudo, selecionar } = require('./utilidades');

const editorVisual = (page) => page.locator('#editor-visual .milkdown .ProseMirror');
const cartao = (page, nome) => page.locator('.texto-cartao', { has: page.locator('.texto-cartao-nome', { hasText: nome }) });

// A área de transferência de verdade não pode ser lida no Firefox do Playwright; o que é copiado fica
// guardado em window.__copiado.
function registrarCopias() {
    window.__copiado = [];
    Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: async function (texto) { window.__copiado.push(texto); } }
    });
}

async function abrir(page, conteudo) {
    await page.addInitScript(registrarCopias);
    const erros = await abrirEditor(page);
    await page.locator('#linguagem').selectOption('plaintext');
    await definirConteudo(page, conteudo === undefined ? '' : conteudo);
    await page.locator('#trilho-textos').click();
    await expect(page.locator('#painel-textos')).toBeVisible();
    return erros;
}

async function criarTexto(page, { nome, texto, abreviacao, tecla }) {
    await page.locator('#textos-novo').click();
    await page.locator('#textos-nome').fill(nome);
    await page.locator('#textos-texto').fill(texto);
    if (abreviacao) {
        await page.locator('#textos-abreviacao').fill(abreviacao);
    }
    if (tecla) {
        await page.locator('#textos-tecla').selectOption(tecla);
    }
    await page.locator('#textos-formulario button[type="submit"]').click();
    await expect(page.locator('#textos-formulario')).toBeHidden();
}

async function copias(page) {
    return page.evaluate(() => window.__copiado);
}

async function texto(page) {
    return (await obterConteudo(page)).replace(/\r\n/g, '\n');
}

async function cursorNoFim(page) {
    await page.evaluate(() => {
        const modelo = window.editor.getModel();
        const linha = modelo.getLineCount();
        window.editor.setPosition({ lineNumber: linha, column: modelo.getLineMaxColumn(linha) });
        window.editor.focus();
    });
}

async function abrirVisual(page, conteudo) {
    await page.locator('#linguagem').selectOption('markdown');
    await definirConteudo(page, conteudo);
    await page.locator('[data-modo="visual"]').click();
    await expect(editorVisual(page)).toBeVisible({ timeout: 30000 });
}

async function fimDoParagrafo(page, trecho) {
    await editorVisual(page).locator('p', { hasText: trecho }).last().click();
    await page.keyboard.press('End');
}

const hoje = (page) => page.evaluate(() => new Date().toLocaleDateString('pt-BR'));

test.describe('Textos rápidos', () => {
    test('painel abre pelo botão do trilho, começa vazio e fecha pelo X', async ({ page }) => {
        const erros = await abrir(page);
        await expect(page.locator('#trilho-textos')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('#textos-busca')).toBeFocused();
        await expect(page.locator('.textos-vazio')).toContainText('Nenhum texto salvo ainda');
        await page.locator('#textos-fechar').click();
        await expect(page.locator('#painel-textos')).toBeHidden();
        await expect(page.locator('#trilho-textos')).toHaveAttribute('aria-pressed', 'false');
        expect(erros).toEqual([]);
    });

    test('painel aberto continua aberto depois de recarregar', async ({ page }) => {
        await abrir(page);
        await recarregar(page);
        await expect(page.locator('#painel-textos')).toBeVisible();
    });

    test('paleta de comandos mostra e esconde o painel', async ({ page }) => {
        await abrir(page);
        await page.locator('#textos-fechar').click();
        await page.evaluate(() => window.editor.getAction('mostrar-painel-textos').run());
        await expect(page.locator('#painel-textos')).toBeVisible();
    });

    test('criar um texto mostra o cartão com nome, prévia, abreviação e atalho', async ({ page }) => {
        await abrir(page);
        await criarTexto(page, { nome: 'Saudação', texto: 'Olá! Tudo bem?\nObrigado pelo contato em {data}.', abreviacao: ';ola', tecla: '1' });
        const item = cartao(page, 'Saudação');
        await expect(item.locator('.texto-cartao-previa')).toContainText('Obrigado pelo contato em {data}.');
        await expect(item.locator('.texto-variavel')).toHaveText('{data}');
        await expect(item.locator('.texto-chip')).toHaveText([';ola + Tab', 'Alt+1']);
        await expect(page.locator('#estado')).toHaveText('Texto rápido "Saudação" salvo');
    });

    test('o formulário recusa nome vazio, texto vazio, abreviação com espaço ou repetida', async ({ page }) => {
        await abrir(page);
        await criarTexto(page, { nome: 'Um', texto: 'primeiro', abreviacao: ';um' });
        await page.locator('#textos-novo').click();
        const salvar = page.locator('#textos-formulario button[type="submit"]');
        await salvar.click();
        await expect(page.locator('#textos-erro')).toHaveText('Dê um nome ao texto para achar depois.');
        await page.locator('#textos-nome').fill('Dois');
        await salvar.click();
        await expect(page.locator('#textos-erro')).toHaveText('O texto está vazio.');
        await page.locator('#textos-texto').fill('segundo');
        await page.locator('#textos-abreviacao').fill(';d s');
        await salvar.click();
        await expect(page.locator('#textos-erro')).toHaveText('A abreviação não pode ter espaços. Exemplo: ;ola');
        await page.locator('#textos-abreviacao').fill(';um');
        await salvar.click();
        await expect(page.locator('#textos-erro')).toHaveText('A abreviação ;um já é usada em "Um".');
        await page.locator('#textos-abreviacao').fill(';dois');
        await salvar.click();
        await expect(page.locator('.texto-cartao')).toHaveCount(2);
    });

    test('botões de variável inserem {data}, {hora} e {cursor} no texto', async ({ page }) => {
        await abrir(page);
        await page.locator('#textos-novo').click();
        await page.locator('#textos-texto').fill('A ');
        for (const variavel of ['{data}', '{hora}', '{cursor}']) {
            await page.locator(`[data-variavel="${variavel}"]`).click();
        }
        await expect(page.locator('#textos-texto')).toHaveValue('A {data}{hora}{cursor}');
    });

    test('Cancelar e Esc fecham o formulário sem salvar', async ({ page }) => {
        await abrir(page);
        await page.locator('#textos-novo').click();
        await page.locator('#textos-nome').fill('Rascunho');
        await page.locator('#textos-cancelar').click();
        await expect(page.locator('#textos-formulario')).toBeHidden();
        await page.locator('#textos-novo').click();
        await page.locator('#textos-nome').fill('Rascunho');
        await page.keyboard.press('Escape');
        await expect(page.locator('#textos-formulario')).toBeHidden();
        await expect(page.locator('.texto-cartao')).toHaveCount(0);
    });

    test('editar muda o texto e mantém a posição na lista', async ({ page }) => {
        await abrir(page);
        await criarTexto(page, { nome: 'Primeiro', texto: 'um' });
        await criarTexto(page, { nome: 'Segundo', texto: 'dois' });
        await cartao(page, 'Primeiro').locator('[data-acao="editar"]').click();
        await expect(page.locator('#textos-titulo')).toHaveText('Editar texto');
        await expect(page.locator('#textos-texto')).toHaveValue('um');
        await page.locator('#textos-texto').fill('um alterado');
        await page.locator('#textos-formulario button[type="submit"]').click();
        await expect(page.locator('.texto-cartao-nome')).toHaveText(['Segundo', 'Primeiro']);
        await expect(cartao(page, 'Primeiro').locator('.texto-cartao-previa')).toHaveText('um alterado');
    });

    test('apagar pergunta antes; Cancelar mantém e Apagar remove', async ({ page }) => {
        await abrir(page);
        await criarTexto(page, { nome: 'Descartável', texto: 'x' });
        await cartao(page, 'Descartável').locator('[data-acao="apagar"]').click();
        await expect(page.locator('#dialogo-mensagem')).toHaveText('Apagar o texto rápido "Descartável"?');
        await page.locator('#dialogo-confirmacao button[value="cancelar"]').click();
        await expect(page.locator('.texto-cartao')).toHaveCount(1);
        await cartao(page, 'Descartável').locator('[data-acao="apagar"]').click();
        await page.locator('#dialogo-confirmar').click();
        await expect(page.locator('.texto-cartao')).toHaveCount(0);
    });

    test('Copiar copia o texto com {data} e {hora} preenchidas e sem {cursor}', async ({ page }) => {
        await abrir(page);
        await criarTexto(page, { nome: 'Prazo', texto: 'Registrado em {data} às {hora}.{cursor}' });
        await cartao(page, 'Prazo').locator('[data-acao="copiar"]').click();
        const [copiado] = await copias(page);
        expect(copiado).toMatch(new RegExp(`^Registrado em ${(await hoje(page)).replace(/\//g, '\\/')} às \\d{2}:\\d{2}\\.$`));
        await expect(page.locator('#estado')).toHaveText('Texto rápido "Prazo" copiado. Cole com Ctrl+V.');
        await expect(cartao(page, 'Prazo').locator('.texto-cartao-usos')).toHaveText('usado 1×');
    });

    test('Inserir põe o texto na posição do cursor do documento', async ({ page }) => {
        await abrir(page, 'Início fim');
        await criarTexto(page, { nome: 'Meio', texto: 'MEIO ' });
        await selecionar(page, 1, 8, 1, 8);
        await cartao(page, 'Meio').locator('[data-acao="inserir"]').click();
        expect(await texto(page)).toBe('Início MEIO fim');
        await expect(page.locator('#estado')).toHaveText('Texto rápido "Meio" inserido');
    });

    test('Inserir troca o trecho selecionado e o {cursor} define onde o cursor fica', async ({ page }) => {
        await abrir(page, 'Prezado TROCAR,');
        await criarTexto(page, { nome: 'Nome', texto: 'senhor {cursor}Silva' });
        await selecionar(page, 1, 9, 1, 15);
        await cartao(page, 'Nome').locator('[data-acao="inserir"]').click();
        await page.keyboard.type('X');
        expect(await texto(page)).toBe('Prezado senhor XSilva,');
    });

    test('Inserir com várias linhas e {cursor} funciona com quebras de linha do Windows', async ({ page }) => {
        await abrir(page, 'a\r\nb');
        await criarTexto(page, { nome: 'Linhas', texto: 'um\ndois {cursor}\ntrês' });
        await cursorNoFim(page);
        await cartao(page, 'Linhas').locator('[data-acao="inserir"]').click();
        await page.keyboard.type('X');
        expect(await texto(page)).toBe('a\nbum\ndois X\ntrês');
    });

    test('Inserir vindo do formatador JSON volta para o documento', async ({ page }) => {
        await abrir(page, 'texto ');
        await criarTexto(page, { nome: 'Fim', texto: 'final' });
        await page.locator('#trilho-json').click();
        await cartao(page, 'Fim').locator('[data-acao="inserir"]').click();
        await expect(page.locator('#area-documentos')).toBeVisible();
        expect(await texto(page)).toContain('final');
    });

    test('os cartões não mudam de lugar ao usar e os novos entram no topo', async ({ page }) => {
        await abrir(page);
        await criarTexto(page, { nome: 'A', texto: 'a' });
        await criarTexto(page, { nome: 'B', texto: 'b' });
        await criarTexto(page, { nome: 'C', texto: 'c' });
        await expect(page.locator('.texto-cartao-nome')).toHaveText(['C', 'B', 'A']);
        for (let vez = 0; vez < 3; vez += 1) {
            await cartao(page, 'A').locator('[data-acao="copiar"]').click();
        }
        await expect(cartao(page, 'A').locator('.texto-cartao-usos')).toHaveText('usado 3×');
        await expect(page.locator('.texto-cartao-nome')).toHaveText(['C', 'B', 'A']);
    });

    test('busca filtra por nome, texto e abreviação; Enter copia o primeiro', async ({ page }) => {
        await abrir(page);
        await criarTexto(page, { nome: 'Saudação', texto: 'Olá', abreviacao: ';ola' });
        await criarTexto(page, { nome: 'Encerramento', texto: 'Atenciosamente', abreviacao: ';fim' });
        const busca = page.locator('#textos-busca');
        await busca.fill('saudação');
        await expect(page.locator('.texto-cartao-nome')).toHaveText(['Saudação']);
        await busca.fill('atencios');
        await expect(page.locator('.texto-cartao-nome')).toHaveText(['Encerramento']);
        await busca.fill(';ola');
        await expect(page.locator('.texto-cartao-nome')).toHaveText(['Saudação']);
        await busca.press('Enter');
        expect(await copias(page)).toEqual(['Olá']);
        await busca.fill('nada disso');
        await expect(page.locator('.textos-vazio')).toHaveText('Nada encontrado para "nada disso".');
    });

    test('abreviação + Tab troca pelo texto no modo Editor', async ({ page }) => {
        await abrir(page);
        await criarTexto(page, { nome: 'Saudação', texto: 'Olá, tudo bem?', abreviacao: ';ola' });
        await cursorNoFim(page);
        await page.keyboard.type('Oi ;ola');
        await page.keyboard.press('Tab');
        expect(await texto(page)).toBe('Oi Olá, tudo bem?');
        await expect(cartao(page, 'Saudação').locator('.texto-cartao-usos')).toHaveText('usado 1×');
    });

    test('Tab sem abreviação conhecida continua inserindo a tabulação', async ({ page }) => {
        await abrir(page);
        await criarTexto(page, { nome: 'Saudação', texto: 'Olá', abreviacao: ';ola' });
        await cursorNoFim(page);
        await page.keyboard.type(';outra');
        await page.keyboard.press('Tab');
        expect(await texto(page)).toMatch(/^;outra(\t| +)$/);
    });

    test('Ctrl+Z desfaz a troca da abreviação', async ({ page }) => {
        await abrir(page);
        await criarTexto(page, { nome: 'Saudação', texto: 'Olá', abreviacao: ';ola' });
        await cursorNoFim(page);
        await page.keyboard.type(';ola');
        await page.keyboard.press('Tab');
        expect(await texto(page)).toBe('Olá');
        await page.keyboard.press('Control+Z');
        expect(await texto(page)).toBe(';ola');
    });

    test('Alt+número com o cursor no documento insere o texto', async ({ page }) => {
        await abrir(page);
        await criarTexto(page, { nome: 'Um', texto: 'primeiro', tecla: '1' });
        await criarTexto(page, { nome: 'Nove', texto: 'nono', tecla: '9' });
        await cursorNoFim(page);
        await page.keyboard.press('Alt+1');
        await page.keyboard.press('Alt+9');
        expect(await texto(page)).toBe('primeironono');
        expect(await copias(page)).toEqual([]);
    });

    test('Alt+número fora do documento copia o texto', async ({ page }) => {
        await abrir(page);
        await criarTexto(page, { nome: 'Dois', texto: 'segundo', tecla: '2' });
        await page.locator('#textos-busca').focus();
        await page.keyboard.press('Alt+2');
        expect(await copias(page)).toEqual(['segundo']);
        expect(await texto(page)).toBe('');
    });

    test('Alt+número sem texto ligado não faz nada', async ({ page }) => {
        await abrir(page, 'nada');
        await cursorNoFim(page);
        await page.keyboard.press('Alt+5');
        expect(await texto(page)).toBe('nada');
        expect(await copias(page)).toEqual([]);
    });

    test('escolher um atalho já usado tira o atalho do outro texto', async ({ page }) => {
        await abrir(page);
        await criarTexto(page, { nome: 'Velho', texto: 'v', tecla: '3' });
        await page.locator('#textos-novo').click();
        await expect(page.locator('#textos-tecla option[value="3"]')).toHaveText('Alt+3 (hoje em "Velho")');
        await page.locator('#textos-cancelar').click();
        await criarTexto(page, { nome: 'Novo', texto: 'n', tecla: '3' });
        await expect(cartao(page, 'Velho').locator('.texto-chip')).toHaveCount(0);
        await expect(cartao(page, 'Novo').locator('.texto-chip')).toHaveText(['Alt+3']);
    });

    test('textos, contagem e atalhos continuam lá depois de recarregar', async ({ page }) => {
        await abrir(page);
        await criarTexto(page, { nome: 'Fica', texto: 'guardado', abreviacao: ';fica', tecla: '4' });
        await cartao(page, 'Fica').locator('[data-acao="copiar"]').click();
        await recarregar(page);
        await expect(cartao(page, 'Fica').locator('.texto-cartao-usos')).toHaveText('usado 1×');
        await expect(cartao(page, 'Fica').locator('.texto-chip')).toHaveText([';fica + Tab', 'Alt+4']);
    });

    test('exportar a sessão leva os textos rápidos junto', async ({ page }) => {
        await abrir(page);
        await criarTexto(page, { nome: 'Exportado', texto: 'vai junto', abreviacao: ';exp', tecla: '6' });
        await page.locator('#botao-sessao').click();
        const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.locator('#exportar-sessao').click()
        ]);
        const sessao = JSON.parse(require('fs').readFileSync(await download.path(), 'utf8'));
        expect(sessao.textosRapidos).toEqual([expect.objectContaining({ nome: 'Exportado', texto: 'vai junto', abreviacao: ';exp', tecla: '6', usos: 0 })]);
    });

    async function importar(page, sessao) {
        await page.locator('#botao-sessao').click();
        const [seletor] = await Promise.all([
            page.waitForEvent('filechooser'),
            page.locator('#importar-sessao').click()
        ]);
        await seletor.setFiles({ name: 'sessao.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(sessao)) });
        // O documento foi alterado no começo do teste; o editor pergunta antes de trocar a sessão.
        await page.locator('#dialogo-confirmar').click();
    }

    const documentosImportados = [{ id: 1, nome: 'a.txt', conteudo: 'a', linguagem: 'plaintext' }];

    test('importar uma sessão com textos rápidos troca os atuais', async ({ page }) => {
        await abrir(page);
        await criarTexto(page, { nome: 'Antigo', texto: 'sai' });
        await importar(page, { versao: 2, documentos: documentosImportados, textosRapidos: [{ id: 'x', nome: 'Importado', texto: 'entra', abreviacao: ';imp', tecla: '7', usos: 2 }] });
        await expect(page.locator('.texto-cartao-nome')).toHaveText(['Importado']);
        await expect(cartao(page, 'Importado').locator('.texto-cartao-usos')).toHaveText('usado 2×');
    });

    test('importar uma sessão antiga, sem textos rápidos, mantém os atuais', async ({ page }) => {
        await abrir(page);
        await criarTexto(page, { nome: 'Mantido', texto: 'fica' });
        await importar(page, { versao: 2, documentos: documentosImportados });
        await expect(page.locator('#estado')).toHaveText('Sessão importada');
        await expect(page.locator('.texto-cartao-nome')).toHaveText(['Mantido']);
    });

    test.describe('modo Visual', () => {
        test('Inserir põe o texto no parágrafo do cursor', async ({ page }) => {
            const erros = await abrir(page);
            await criarTexto(page, { nome: 'Frase', texto: ' e mais isto' });
            await abrirVisual(page, 'Primeiro parágrafo\n');
            await fimDoParagrafo(page, 'Primeiro');
            await cartao(page, 'Frase').locator('[data-acao="inserir"]').click();
            await expect(editorVisual(page).locator('p').first()).toHaveText('Primeiro parágrafo e mais isto');
            expect(await texto(page)).toBe('Primeiro parágrafo e mais isto\n');
            expect(erros).toEqual([]);
        });

        test('texto com parágrafos e lista vira Markdown formatado', async ({ page }) => {
            await abrir(page);
            await criarTexto(page, { nome: 'Passos', texto: 'Siga os passos:\n\n1. Feche o navegador.\n2. Abra de novo.' });
            await abrirVisual(page, 'Olá\n');
            await fimDoParagrafo(page, 'Olá');
            await page.keyboard.press('Enter');
            await cartao(page, 'Passos').locator('[data-acao="inserir"]').click();
            await expect(editorVisual(page).locator('ol li')).toHaveText(['Feche o navegador.', 'Abra de novo.']);
            expect(await texto(page)).toBe('Olá\n\nSiga os passos:\n\n1. Feche o navegador.\n2. Abra de novo.\n');
        });

        test('{cursor} define onde o cursor fica', async ({ page }) => {
            await abrir(page);
            await criarTexto(page, { nome: 'Nome', texto: 'Prezado {cursor}, tudo bem?' });
            await abrirVisual(page, 'Início\n');
            await fimDoParagrafo(page, 'Início');
            await page.keyboard.press('Enter');
            await cartao(page, 'Nome').locator('[data-acao="inserir"]').click();
            await page.keyboard.type('João');
            await expect(editorVisual(page).locator('p').last()).toHaveText('Prezado João, tudo bem?');
        });

        test('{data} e {hora} são preenchidas', async ({ page }) => {
            await abrir(page);
            await criarTexto(page, { nome: 'Data', texto: 'Hoje é {data}, {hora}.' });
            await abrirVisual(page, 'x\n');
            await fimDoParagrafo(page, 'x');
            await cartao(page, 'Data').locator('[data-acao="inserir"]').click();
            await expect(editorVisual(page).locator('p').first()).toHaveText(new RegExp(`^xHoje é ${(await hoje(page)).replace(/\//g, '\\/')}, \\d{2}:\\d{2}\\.$`));
        });

        test('abreviação + Tab troca pelo texto', async ({ page }) => {
            await abrir(page);
            await criarTexto(page, { nome: 'Saudação', texto: 'Olá, tudo bem?', abreviacao: ';ola' });
            await abrirVisual(page, 'Início\n');
            await fimDoParagrafo(page, 'Início');
            await page.keyboard.type(' ;ola');
            await page.keyboard.press('Tab');
            await expect(editorVisual(page).locator('p').first()).toHaveText('Início Olá, tudo bem?');
            expect(await texto(page)).toBe('Início Olá, tudo bem?\n');
        });

        test('Alt+número com o cursor no texto insere', async ({ page }) => {
            await abrir(page);
            await criarTexto(page, { nome: 'Um', texto: 'primeiro', tecla: '1' });
            await abrirVisual(page, 'Início\n');
            await fimDoParagrafo(page, 'Início');
            await page.keyboard.press('Alt+1');
            await expect(editorVisual(page).locator('p').first()).toHaveText('Inícioprimeiro');
            expect(await copias(page)).toEqual([]);
        });
    });
});
