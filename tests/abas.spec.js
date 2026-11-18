// Área: abas de documentos, novo documento, fechar e diálogo de confirmação.
const { test, expect } = require('@playwright/test');
const { abrirEditor, definirConteudo, obterConteudo, focarEditor, novaAba, nomesDasAbas } = require('./utilidades');

test.describe('Abas', () => {
    test('botão + cria uma nova aba ativa', async ({ page }) => {
        await abrirEditor(page);
        await page.locator('#nova-aba').click();
        expect(await nomesDasAbas(page)).toEqual(['Sem título 1', 'Sem título 2']);
        await expect(page.locator('.aba.ativa .aba-nome')).toHaveText('Sem título 2');
        expect(await obterConteudo(page)).toBe('');
    });

    test('botão Novo do topo também cria uma aba', async ({ page }) => {
        await abrirEditor(page);
        await page.locator('#novo').click();
        await expect(page.locator('.aba')).toHaveCount(2);
    });

    test('Ctrl+Alt+N cria uma nova aba', async ({ page }) => {
        await abrirEditor(page);
        await focarEditor(page);
        await page.keyboard.press('Control+Alt+N');
        await expect(page.locator('.aba')).toHaveCount(2);
    });

    test('editar marca a aba e o rodapé como não salvos', async ({ page }) => {
        await abrirEditor(page);
        await expect(page.locator('.aba.modificada')).toHaveCount(0);
        await focarEditor(page);
        await page.keyboard.type('x');
        await expect(page.locator('.aba.modificada')).toHaveCount(1);
        await expect(page.locator('#indicador-documento')).toHaveClass(/modificado/);
        await expect(page).toHaveTitle(/^● /);
    });

    test('clicar numa aba troca o documento exibido', async ({ page }) => {
        await abrirEditor(page);
        await definirConteudo(page, 'primeiro');
        await novaAba(page, null, 'segundo');
        await page.locator('.aba-nome', { hasText: 'Sem título 1' }).click();
        expect(await obterConteudo(page)).toBe('primeiro');
        await expect(page.locator('.aba.ativa .aba-nome')).toHaveText('Sem título 1');
    });

    test('fechar aba sem alterações não pede confirmação', async ({ page }) => {
        await abrirEditor(page);
        await page.locator('#nova-aba').click();
        await page.locator('.aba').nth(1).locator('.fechar-aba').click();
        await expect(page.locator('#dialogo-confirmacao')).toBeHidden();
        await expect(page.locator('.aba')).toHaveCount(1);
    });

    test('fechar aba modificada pede confirmação; cancelar mantém a aba', async ({ page }) => {
        await abrirEditor(page);
        await novaAba(page, null, 'texto importante');
        await page.locator('.aba.modificada .fechar-aba').click();
        await expect(page.locator('#dialogo-confirmacao')).toBeVisible();
        await expect(page.locator('#dialogo-mensagem')).toContainText('alterações não salvas');
        await page.locator('#dialogo-acoes button[value="cancelar"]').click();
        await expect(page.locator('#dialogo-confirmacao')).toBeHidden();
        await expect(page.locator('.aba')).toHaveCount(2);
    });

    test('fechar aba modificada e confirmar remove a aba', async ({ page }) => {
        await abrirEditor(page);
        await novaAba(page, null, 'texto descartável');
        await page.locator('.aba.modificada .fechar-aba').click();
        await page.locator('#dialogo-confirmar').click();
        await expect(page.locator('.aba')).toHaveCount(1);
    });

    test('fechar a última aba cria uma aba vazia', async ({ page }) => {
        await abrirEditor(page);
        await page.locator('.aba .fechar-aba').click();
        await expect(page.locator('.aba')).toHaveCount(1);
        expect(await obterConteudo(page)).toBe('');
    });

    test('trocar a linguagem atualiza a sigla da aba', async ({ page }) => {
        await abrirEditor(page);
        await expect(page.locator('.aba.ativa .aba-linguagem')).toHaveText('JS');
        await page.locator('#linguagem').selectOption('markdown');
        await expect(page.locator('.aba.ativa .aba-linguagem')).toHaveText('MD');
        await page.locator('#linguagem').selectOption('json');
        await expect(page.locator('.aba.ativa .aba-linguagem')).toHaveText('{ }');
    });

    test('trocar de JavaScript para Markdown não deixa o texto marcado como erro', async ({ page }) => {
        // Logo depois de abrir, o verificador de JavaScript ainda está carregando; a análise que ele
        // termina depois da troca não pode marcar o texto Markdown.
        await abrirEditor(page);
        const errosNoDocumento = () => page.evaluate(() => window.monaco.editor.getModelMarkers({ resource: window.editor.getModel().uri }).length);
        await page.locator('#linguagem').selectOption('markdown');
        await definirConteudo(page, '# Título\n\nTexto comum, que não é JavaScript.\n');
        await page.waitForTimeout(1500);
        expect(await errosNoDocumento()).toBe(0);
        await expect(page.locator('#container .squiggly-error')).toHaveCount(0);
    });

    test('voltar para JavaScript volta a mostrar os erros', async ({ page }) => {
        await abrirEditor(page);
        await page.locator('#linguagem').selectOption('markdown');
        await definirConteudo(page, 'const a = ;');
        await page.locator('#linguagem').selectOption('javascript');
        await expect.poll(() => page.evaluate(() => window.monaco.editor.getModelMarkers({ resource: window.editor.getModel().uri }).length)).toBeGreaterThan(0);
    });

    test('a roda do mouse sobre as abas rola a barra para os lados', async ({ page }) => {
        await abrirEditor(page);
        for (let i = 0; i < 14; i += 1) {
            await page.locator('#nova-aba').click();
        }
        const barra = page.locator('#abas');
        await barra.evaluate((elemento) => { elemento.scrollLeft = 0; });
        const caixa = await barra.boundingBox();
        await page.mouse.move(caixa.x + 60, caixa.y + caixa.height / 2);
        await page.mouse.wheel(0, 300);
        await expect.poll(() => barra.evaluate((elemento) => elemento.scrollLeft)).toBeGreaterThan(100);
        const depois = await barra.evaluate((elemento) => elemento.scrollLeft);
        await page.mouse.wheel(0, -300);
        await expect.poll(() => barra.evaluate((elemento) => elemento.scrollLeft)).toBeLessThan(depois);
    });

    test('com poucas abas, a roda do mouse não faz nada na barra', async ({ page }) => {
        await abrirEditor(page);
        const barra = page.locator('#abas');
        const caixa = await barra.boundingBox();
        await page.mouse.move(caixa.x + 30, caixa.y + caixa.height / 2);
        await page.mouse.wheel(0, 300);
        expect(await barra.evaluate((elemento) => elemento.scrollLeft)).toBe(0);
    });

    test('aba de documento sem pasta: o botão direito só copia o nome e explica o motivo', async ({ page }) => {
        await page.addInitScript(() => {
            window.__copiado = [];
            Object.defineProperty(navigator, 'clipboard', {
                configurable: true,
                value: { writeText: async function (texto) { window.__copiado.push(texto); } }
            });
        });
        await abrirEditor(page);
        await page.locator('.aba-nome').hover();
        await expect(page.locator('.aba-nome')).toHaveAttribute('title', 'Sem título 1');
        await page.locator('.aba').click({ button: 'right' });
        const menu = page.locator('#menu-aba');
        await expect(menu).toBeVisible();
        await expect(menu.locator('[data-acao="copiar-caminho"]')).toBeHidden();
        await expect(menu.locator('[data-acao="local-pasta"]')).toBeHidden();
        await expect(menu.locator('.menu-aviso')).toBeVisible();
        await expect(menu.locator('[data-acao="copiar-nome"]')).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(menu).toBeHidden();
        await expect(page.locator('.aba-nome')).toBeFocused();
        await page.locator('.aba').click({ button: 'right' });
        await menu.locator('[data-acao="copiar-nome"]').click();
        await expect(menu).toBeHidden();
        expect(await page.evaluate(() => window.__copiado)).toEqual(['Sem título 1']);
    });
});
