// Área: barra e atalhos de Markdown, preview e modos de visualização.
const { test, expect } = require('@playwright/test');
const { abrirEditor, recarregar, definirConteudo, obterConteudo, selecionar, novaAba } = require('./utilidades');

async function abrirMarkdown(page, conteudo) {
    await abrirEditor(page);
    await page.locator('#linguagem').selectOption('markdown');
    await definirConteudo(page, conteudo);
}

test.describe('Markdown', () => {
    test('barra de formatação só aparece em documentos Markdown', async ({ page }) => {
        await abrirEditor(page);
        await expect(page.locator('#barra-markdown')).toBeHidden();
        await page.locator('#linguagem').selectOption('markdown');
        await expect(page.locator('#barra-markdown')).toBeVisible();
        await page.locator('#linguagem').selectOption('javascript');
        await expect(page.locator('#barra-markdown')).toBeHidden();
    });

    test('botão de negrito aplica e remove a marcação', async ({ page }) => {
        await abrirMarkdown(page, 'ola mundo');
        await selecionar(page, 1, 1, 1, 4);
        await page.locator('[data-md="negrito"]').click();
        expect(await obterConteudo(page)).toBe('**ola** mundo');
        await page.locator('[data-md="negrito"]').click();
        expect(await obterConteudo(page)).toBe('ola mundo');
    });

    const marcacoes = [
        ['italico', 'Control+I', '*ola* mundo'],
        ['tachado', 'Control+Shift+X', '~~ola~~ mundo'],
        ['codigo', 'Control+Backquote', '`ola` mundo']
    ];
    for (const [botao, atalho, esperado] of marcacoes) {
        test(`botão ${botao} formata a seleção`, async ({ page }) => {
            await abrirMarkdown(page, 'ola mundo');
            await selecionar(page, 1, 1, 1, 4);
            await page.locator(`[data-md="${botao}"]`).click();
            expect(await obterConteudo(page)).toBe(esperado);
        });

        test(`atalho ${atalho} formata a seleção (${botao})`, async ({ page }) => {
            await abrirMarkdown(page, 'ola mundo');
            await selecionar(page, 1, 1, 1, 4);
            await page.keyboard.press(atalho);
            expect(await obterConteudo(page)).toBe(esperado);
        });
    }

    test('Ctrl+B aplica negrito', async ({ page }) => {
        await abrirMarkdown(page, 'ola mundo');
        await selecionar(page, 1, 1, 1, 4);
        await page.keyboard.press('Control+B');
        expect(await obterConteudo(page)).toBe('**ola** mundo');
    });

    test('link transforma a seleção e seleciona a URL', async ({ page }) => {
        await abrirMarkdown(page, 'ola mundo');
        await selecionar(page, 1, 5, 1, 10);
        await page.locator('[data-md="link"]').click();
        expect(await obterConteudo(page)).toBe('ola [mundo](url)');
        const selecionado = await page.evaluate(() => window.editor.getModel().getValueInRange(window.editor.getSelection()));
        expect(selecionado).toBe('url');
    });

    const linhas = [
        ['h1', '# item'],
        ['h2', '## item'],
        ['h3', '### item'],
        ['lista', '- item'],
        ['numerada', '1. item'],
        ['tarefas', '- [ ] item'],
        ['citacao', '> item']
    ];
    for (const [botao, esperado] of linhas) {
        test(`botão ${botao} aplica e remove o formato da linha`, async ({ page }) => {
            await abrirMarkdown(page, 'item');
            await selecionar(page, 1, 1, 1, 1);
            await page.locator(`[data-md="${botao}"]`).click();
            expect(await obterConteudo(page)).toBe(esperado);
            await page.locator(`[data-md="${botao}"]`).click();
            expect(await obterConteudo(page)).toBe('item');
        });
    }

    const linhasHorizontais = [
        ['no meio do texto', 'acima\nabaixo', 1, 'acima\n\n---\n\nabaixo'],
        ['numa linha vazia entre textos', 'acima\n\nabaixo', 2, 'acima\n\n---\n\nabaixo'],
        ['no fim do documento', 'texto', 1, 'texto\n\n---\n']
    ];
    for (const [onde, inicial, linha, esperado] of linhasHorizontais) {
        test(`linha horizontal ${onde} insere --- com linhas em branco`, async ({ page }) => {
            await abrirMarkdown(page, inicial);
            await selecionar(page, linha, 1, linha, 1);
            await page.locator('[data-md="linha"]').click();
            // O Monaco usa a quebra de linha do sistema (CRLF no Windows).
            expect((await obterConteudo(page)).replace(/\r\n/g, '\n')).toBe(esperado);
            await expect(page.locator('#preview-conteudo hr')).toHaveCount(1);
            await expect(page.locator('#preview-conteudo h2')).toHaveCount(0);
        });
    }

    test('--- colado no texto vira título; com linha em branco vira linha', async ({ page }) => {
        await abrirMarkdown(page, 'Texto\n---');
        await expect(page.locator('#preview-conteudo h2')).toHaveText('Texto');
        await definirConteudo(page, 'Texto\n\n---');
        await expect(page.locator('#preview-conteudo hr')).toBeVisible();
    });

    test('formatação funciona com várias linhas selecionadas', async ({ page }) => {
        await abrirMarkdown(page, 'um\ndois\ntres');
        await selecionar(page, 1, 1, 3, 5);
        await page.locator('[data-md="lista"]').click();
        expect(await obterConteudo(page)).toBe('- um\n- dois\n- tres');
    });

    test('preview renderiza o Markdown ao vivo', async ({ page }) => {
        await abrirMarkdown(page, '# Titulo\n\nTexto **forte**\n\n- [x] feito');
        const preview = page.locator('#preview-conteudo');
        await expect(preview.locator('h1')).toHaveText('Titulo');
        await expect(preview.locator('strong')).toHaveText('forte');
        await expect(preview.locator('input[type="checkbox"]')).toBeChecked();
        await definirConteudo(page, '## Outro');
        await expect(preview.locator('h2')).toHaveText('Outro');
    });

    test('preview remove scripts e eventos perigosos', async ({ page }) => {
        await abrirMarkdown(page, '<img src="x" onerror="window.__ataque = 1"><script>window.__ataque = 2</script>\n\n[link](javascript:window.__ataque=3)');
        await expect(page.locator('#preview-conteudo img')).toHaveCount(1);
        await expect(page.locator('#preview-conteudo script')).toHaveCount(0);
        expect(await page.locator('#preview-conteudo img').getAttribute('onerror')).toBeNull();
        await page.waitForTimeout(300);
        expect(await page.evaluate(() => window.__ataque)).toBeUndefined();
    });

    test('links do preview abrem em nova aba', async ({ page }) => {
        await abrirMarkdown(page, '[site](https://example.com)');
        const link = page.locator('#preview-conteudo a');
        await expect(link).toHaveAttribute('target', '_blank');
        await expect(link).toHaveAttribute('rel', /noopener/);
    });

    test('modos Editor, Dividido e Preview mostram os painéis certos', async ({ page }) => {
        await abrirMarkdown(page, '# Oi');
        await expect(page.locator('#container')).toBeVisible();
        await expect(page.locator('#preview-markdown')).toBeVisible();

        await page.locator('[data-modo="preview"]').click();
        await expect(page.locator('#container')).toBeHidden();
        await expect(page.locator('#preview-markdown')).toBeVisible();
        await expect(page.locator('[data-modo="preview"]')).toHaveAttribute('aria-pressed', 'true');

        await page.locator('[data-modo="editor"]').click();
        await expect(page.locator('#container')).toBeVisible();
        await expect(page.locator('#preview-markdown')).toBeHidden();
    });

    test('usar a barra no modo Preview volta para o modo Dividido', async ({ page }) => {
        await abrirMarkdown(page, 'ola');
        await page.locator('[data-modo="preview"]').click();
        await selecionar(page, 1, 1, 1, 4);
        await page.locator('[data-md="negrito"]').click();
        await expect(page.locator('[data-modo="dividido"]')).toHaveAttribute('aria-pressed', 'true');
        expect(await obterConteudo(page)).toBe('**ola**');
    });

    test('documento que não é Markdown não mostra preview', async ({ page }) => {
        await abrirEditor(page);
        await expect(page.locator('#preview-markdown')).toBeHidden();
        await novaAba(page, 'markdown', '# Oi');
        await expect(page.locator('#preview-markdown')).toBeVisible();
        await page.locator('.aba-nome', { hasText: 'Sem título 1' }).click();
        await expect(page.locator('#preview-markdown')).toBeHidden();
    });

    test('modo de visualização é lembrado depois de recarregar', async ({ page }) => {
        await abrirMarkdown(page, '# Oi');
        await page.locator('[data-modo="preview"]').click();
        await recarregar(page);
        await expect(page.locator('[data-modo="preview"]')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('#container')).toBeHidden();
    });
});
