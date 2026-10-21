// Área: modo Visual de Markdown (Milkdown, carregado do CDN esm.sh).
const { test, expect } = require('@playwright/test');
const { abrirEditor, recarregar, definirConteudo, obterConteudo, novaAba, arquivosGravados } = require('./utilidades');

const amostra = [
    '# Notas',
    '',
    'Texto com **negrito** e _itálico_.',
    '',
    '- item um',
    '- item dois',
    '',
    '- [x] feito',
    '- [ ] pendente',
    '',
    '---',
    '',
    '| Coluna | Valor |',
    '| --- | --- |',
    '| a | 1 |',
    ''
].join('\n');

const editorVisual = (page) => page.locator('#editor-visual .milkdown .ProseMirror');

async function abrirVisual(page, conteudo, opcoes) {
    const erros = await abrirEditor(page, opcoes);
    await page.locator('#linguagem').selectOption('markdown');
    await definirConteudo(page, conteudo);
    await page.locator('[data-modo="visual"]').click();
    await expect(editorVisual(page)).toBeVisible({ timeout: 30000 });
    return erros;
}

async function textoNormalizado(page) {
    return (await obterConteudo(page)).replace(/\r\n/g, '\n');
}

// Coloca o cursor no fim do último parágrafo do editor visual.
async function irParaFimDoParagrafo(page, texto) {
    await editorVisual(page).locator('p', { hasText: texto }).last().click();
    await page.keyboard.press('End');
}

test.describe('Modo Visual', () => {
    test('mostra o Markdown formatado e esconde a barra do editor de texto', async ({ page }) => {
        const erros = await abrirVisual(page, amostra);
        await expect(editorVisual(page).locator('h1')).toHaveText('Notas');
        await expect(editorVisual(page).locator('strong')).toHaveText('negrito');
        await expect(editorVisual(page).locator('th, td').filter({ hasText: 'Valor' }).first()).toBeVisible();
        await expect(page.locator('#container')).toBeHidden();
        await expect(page.locator('#preview-markdown')).toBeHidden();
        await expect(page.locator('#ferramentas-markdown')).toBeHidden();
        await expect(page.locator('[data-modo="visual"]')).toHaveAttribute('aria-pressed', 'true');
        expect(erros).toEqual([]);
    });

    test('entrar e sair do modo Visual sem editar não altera o texto', async ({ page }) => {
        await abrirVisual(page, amostra);
        await page.locator('[data-modo="editor"]').click();
        expect(await textoNormalizado(page)).toBe(amostra);
    });

    test('digitar no modo Visual atualiza o Markdown', async ({ page }) => {
        await abrirVisual(page, 'Primeira linha');
        await irParaFimDoParagrafo(page, 'Primeira linha');
        await page.keyboard.type(' continuada');
        await expect.poll(() => textoNormalizado(page)).toBe('Primeira linha continuada');
        await expect(page.locator('#status-caracteres')).toHaveText('25 caracteres');
    });

    test('Ctrl+B no modo Visual vira **negrito** no Markdown', async ({ page }) => {
        await abrirVisual(page, 'palavra');
        // Duplo clique em cima do texto (o parágrafo ocupa a largura toda).
        const caixa = await editorVisual(page).locator('p').first().boundingBox();
        await page.mouse.dblclick(caixa.x + 20, caixa.y + caixa.height / 2);
        await page.keyboard.press('Control+B');
        await expect.poll(() => textoNormalizado(page)).toBe('**palavra**');
    });

    test('editar preserva o estilo do documento (listas com * e itálico com *)', async ({ page }) => {
        await abrirVisual(page, '* um\n* dois\n\nTexto *inclinado* e normal');
        await irParaFimDoParagrafo(page, 'Texto');
        await page.keyboard.type(' fim');
        await expect.poll(() => textoNormalizado(page)).toBe('* um\n* dois\n\nTexto *inclinado* e normal fim');
    });

    test('tabela editada mantém o separador | --- |', async ({ page }) => {
        await abrirVisual(page, 'Antes\n\n| A | B |\n| --- | --- |\n| 1 | 2 |');
        await irParaFimDoParagrafo(page, 'Antes');
        await page.keyboard.type('!');
        await expect.poll(() => textoNormalizado(page)).toBe('Antes!\n\n| A | B |\n| --- | --- |\n| 1 | 2 |');
    });

    test('Ctrl+S no modo Visual salva o texto mais recente', async ({ page }) => {
        await abrirVisual(page, 'rascunho');
        await irParaFimDoParagrafo(page, 'rascunho');
        await page.keyboard.type(' final');
        await page.keyboard.press('Control+S');
        await expect(page.locator('.aba.ativa .aba-nome')).toHaveText('novo-arquivo.md');
        expect((await arquivosGravados(page))['novo-arquivo.md']).toBe('rascunho final');
    });

    test('trocar de aba mostra o conteúdo da outra e preserva o da primeira', async ({ page }) => {
        await abrirVisual(page, 'Documento A');
        await irParaFimDoParagrafo(page, 'Documento A');
        await page.keyboard.type(' editado');
        await novaAba(page, 'markdown', 'Documento B');
        await page.locator('[data-modo="visual"]').click();
        await expect(editorVisual(page)).toContainText('Documento B');
        await page.locator('.aba-nome', { hasText: 'Sem título 1' }).click();
        await expect(editorVisual(page)).toContainText('Documento A editado');
        await page.locator('[data-modo="editor"]').click();
        expect(await textoNormalizado(page)).toBe('Documento A editado');
    });

    test('modo Visual é lembrado depois de recarregar', async ({ page }) => {
        await abrirVisual(page, '# Título');
        await recarregar(page);
        await expect(editorVisual(page)).toBeVisible({ timeout: 30000 });
        await expect(editorVisual(page).locator('h1')).toHaveText('Título');
    });

    test('sem internet para o editor visual, volta ao modo Dividido e avisa', async ({ page }) => {
        await page.route('https://esm.sh/**', (rota) => rota.abort());
        await abrirEditor(page);
        await page.locator('#linguagem').selectOption('markdown');
        await definirConteudo(page, '# Oi');
        await page.locator('[data-modo="visual"]').click();
        await expect(page.locator('#estado')).toContainText('Não foi possível carregar o editor visual');
        await expect(page.locator('[data-modo="dividido"]')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('#container')).toBeVisible();
    });

    test('menu "/" aparece em português', async ({ page }) => {
        await abrirVisual(page, 'Texto');
        await irParaFimDoParagrafo(page, 'Texto');
        await page.keyboard.press('Enter');
        await page.keyboard.type('/');
        await expect(page.getByText('Título 1', { exact: true })).toBeVisible();
        await expect(page.getByText('Lista de tarefas', { exact: true })).toBeAttached();
        await expect(page.getByText('Heading 1', { exact: true })).toHaveCount(0);
    });

    // Todos os atalhos da página "Atalhos de teclado" precisam funcionar também no modo Visual.
    const atalhos = [
        ['negrito', 'Control+B', true, '**palavra** final'],
        ['itálico', 'Control+I', true, '_palavra_ final'],
        ['tachado', 'Control+Shift+X', true, '~~palavra~~ final'],
        ['tachado (alternativo)', 'Alt+Shift+5', true, '~~palavra~~ final'],
        ['código inline', 'Control+Backquote', true, '`palavra` final'],
        ['título 1', 'Control+1', false, '# palavra final'],
        ['título 2', 'Control+2', false, '## palavra final'],
        ['título 3', 'Control+3', false, '### palavra final'],
        ['título 4', 'Control+4', false, '#### palavra final'],
        ['título 5', 'Control+5', false, '##### palavra final'],
        ['título 6', 'Control+6', false, '###### palavra final'],
        ['título 2 com Shift', 'Control+Shift+2', false, '## palavra final'],
        ['lista numerada', 'Control+Shift+7', false, '1. palavra final'],
        ['lista com marcadores', 'Control+Shift+8', false, '- palavra final'],
        ['lista de tarefas', 'Control+Shift+9', false, '- [ ] palavra final'],
        ['citação', 'Control+Shift+Q', false, '> palavra final']
    ];

    async function posicionarNaPalavra(page, selecionarPalavra) {
        const caixa = await editorVisual(page).locator('p').first().boundingBox();
        if (selecionarPalavra) {
            // Duplo clique em cima da palavra (no Windows, seleciona também o espaço seguinte).
            await page.mouse.dblclick(caixa.x + 20, caixa.y + caixa.height / 2);
        } else {
            await page.mouse.click(caixa.x + 20, caixa.y + caixa.height / 2);
        }
    }

    for (const [nome, atalho, selecionarPalavra, esperado] of atalhos) {
        test(`atalho ${atalho} (${nome}) funciona no modo Visual`, async ({ page }) => {
            await abrirVisual(page, 'palavra final');
            await posicionarNaPalavra(page, selecionarPalavra);
            await page.keyboard.press(atalho);
            await expect.poll(() => textoNormalizado(page)).toBe(esperado);
        });
    }

    test('atalho Control+K (link) pede o endereço e cria o link', async ({ page }) => {
        await abrirVisual(page, 'palavra final');
        await posicionarNaPalavra(page, true);
        await page.keyboard.press('Control+K');
        await page.keyboard.type('https://exemplo.com');
        await page.keyboard.press('Enter');
        await expect.poll(() => textoNormalizado(page)).toBe('[palavra](https://exemplo.com) final');
    });

    const alternancias = [
        ['título', 'Control+2'],
        ['lista numerada', 'Control+Shift+7'],
        ['lista com marcadores', 'Control+Shift+8'],
        ['lista de tarefas', 'Control+Shift+9'],
        ['citação', 'Control+Shift+Q']
    ];
    for (const [nome, atalho] of alternancias) {
        test(`apertar ${atalho} duas vezes desfaz ${nome} no modo Visual`, async ({ page }) => {
            await abrirVisual(page, 'palavra final');
            await posicionarNaPalavra(page, false);
            await page.keyboard.press(atalho);
            await expect.poll(() => textoNormalizado(page)).not.toBe('palavra final');
            await page.keyboard.press(atalho);
            await expect.poll(() => textoNormalizado(page)).toBe('palavra final');
        });
    }

    test('documento que não é Markdown não usa o modo Visual', async ({ page }) => {
        await abrirVisual(page, '# Markdown');
        await novaAba(page, 'javascript', 'const a = 1;');
        await expect(page.locator('#editor-visual')).toBeHidden();
        await expect(page.locator('#container')).toBeVisible();
    });
});
