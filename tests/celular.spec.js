// Área: layout no celular (roda só no projeto "celular", 390x844).
const { test, expect } = require('@playwright/test');
const { abrirEditor, definirConteudo } = require('./utilidades');

test.describe('Celular', () => {
    test('topo fica visível e a barra de ferramentas vai para baixo', async ({ page }) => {
        const erros = await abrirEditor(page);
        const topo = await page.locator('#topo').boundingBox();
        const trilho = await page.locator('#trilho').boundingBox();
        expect(topo.y).toBe(0);
        expect(trilho.y).toBeGreaterThan(700);
        expect(trilho.width).toBeGreaterThan(380);
        expect(await page.evaluate(() => document.documentElement.scrollTop + document.body.scrollTop)).toBe(0);
        expect(erros).toEqual([]);
    });

    test('botões do topo mostram só ícones', async ({ page }) => {
        await abrirEditor(page);
        await expect(page.locator('#novo .rotulo')).toBeHidden();
        await expect(page.locator('#abrir-paleta')).toBeHidden();
        const salvar = await page.locator('#salvar').boundingBox();
        expect(salvar.height).toBeGreaterThanOrEqual(44);
    });

    test('nada ultrapassa a largura da tela', async ({ page }) => {
        await abrirEditor(page);
        const larguraExtra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(larguraExtra).toBeLessThanOrEqual(0);
    });

    test('modo dividido empilha editor e preview', async ({ page }) => {
        await abrirEditor(page);
        await page.locator('#linguagem').selectOption('markdown');
        await definirConteudo(page, '# Oi');
        const editor = await page.locator('#container').boundingBox();
        const preview = await page.locator('#preview-markdown').boundingBox();
        expect(preview.y).toBeGreaterThan(editor.y);
        expect(Math.round(preview.width)).toBe(Math.round(editor.width));
    });

    test('minimapa fica desligado e o botão Mapa não aparece', async ({ page }) => {
        await abrirEditor(page);
        await page.locator('#linguagem').selectOption('markdown');
        await definirConteudo(page, 'linha\n'.repeat(200));
        await page.locator('[data-modo="editor"]').click();
        await expect(page.locator('#alternar-mapa')).toBeHidden();
        await expect(page.locator('#container .minimap')).toBeHidden();
        await page.locator('[data-modo="visual"]').click();
        await expect(page.locator('#editor-visual .ProseMirror')).toBeVisible({ timeout: 30000 });
        await expect(page.locator('#mapa-visual')).toBeHidden();
    });

    test('painel de sessão cabe na tela', async ({ page }) => {
        await abrirEditor(page);
        await page.locator('#botao-sessao').click();
        const painel = await page.locator('#painel-sessao').boundingBox();
        expect(painel.x).toBeGreaterThanOrEqual(0);
        expect(painel.x + painel.width).toBeLessThanOrEqual(390);
    });
});
