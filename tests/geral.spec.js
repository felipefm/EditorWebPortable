// Área: carregamento, topo, barra lateral, paleta de comandos e rodapé.
const { test, expect } = require('@playwright/test');
const { abrirEditor, definirConteudo, focarEditor } = require('./utilidades');

test.describe('Geral', () => {
    test('carrega sem erros e mostra a interface principal', async ({ page }) => {
        const erros = await abrirEditor(page);
        await expect(page).toHaveTitle(/Editor Portable/);
        await expect(page.locator('#topo')).toBeVisible();
        await expect(page.locator('#trilho')).toBeVisible();
        await expect(page.locator('.aba')).toHaveCount(1);
        await expect(page.locator('#estado')).toHaveText('Pronto');
        await expect(page.locator('#falha')).toBeHidden();
        expect(erros).toEqual([]);
    });

    test('barra lateral alterna entre documentos, JSON e atalhos', async ({ page }) => {
        await abrirEditor(page);

        await page.locator('#trilho-json').click();
        await expect(page.locator('#formatador-json')).toBeVisible();
        await expect(page.locator('#area-documentos')).toBeHidden();
        await expect(page.locator('#trilho-json')).toHaveClass(/ativo/);
        await expect(page).toHaveTitle(/Formatador JSON/);

        await page.locator('#trilho-atalhos').click();
        await expect(page.locator('#atalhos-markdown')).toBeVisible();
        await expect(page.locator('#formatador-json')).toBeHidden();
        await expect(page.locator('#trilho-atalhos')).toHaveClass(/ativo/);

        await page.locator('#voltar-editor-markdown').click();
        await expect(page.locator('#area-documentos')).toBeVisible();
        await expect(page.locator('#trilho-documentos')).toHaveClass(/ativo/);
    });

    test('Ctrl+Alt+J abre o formatador JSON', async ({ page }) => {
        await abrirEditor(page);
        await focarEditor(page);
        await page.keyboard.press('Control+Alt+J');
        await expect(page.locator('#formatador-json')).toBeVisible();
    });

    test('botão de busca abre a paleta de comandos', async ({ page }) => {
        await abrirEditor(page);
        await page.locator('#abrir-paleta').click();
        await expect(page.locator('.quick-input-widget')).toBeVisible();
        await page.keyboard.type('formatador');
        await expect(page.locator('.quick-input-list')).toContainText('Abrir formatador JSON');
    });

    test('rodapé mostra caracteres, cursor, linguagem e quebra de linha', async ({ page }) => {
        await abrirEditor(page);
        await definirConteudo(page, 'abc');
        await expect(page.locator('#status-caracteres')).toHaveText('3 caracteres');
        await expect(page.locator('#status-eol')).toHaveText(/LF|CRLF/);
        await focarEditor(page);
        await expect(page.locator('#status-cursor')).toHaveText(/Ln \d+, Col \d+/);
        await page.locator('#linguagem').selectOption('markdown');
        await expect(page.locator('#linguagem')).toHaveValue('markdown');
    });

    test('rodapé esconde dados do documento no formatador JSON', async ({ page }) => {
        await abrirEditor(page);
        await page.locator('#trilho-json').click();
        await expect(page.locator('#linguagem')).toBeHidden();
        await expect(page.locator('#status-cursor')).toBeHidden();
    });
});
