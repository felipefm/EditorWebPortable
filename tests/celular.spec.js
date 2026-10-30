// Área: layout no celular (roda só no projeto "celular", 390x844).
const { test, expect } = require('@playwright/test');
const { abrirEditor, definirConteudo } = require('./utilidades');
const { iniciarServidor, criarNoDisco, lerDoDisco } = require('./homelab');

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

    test('na versão online, o botão e o painel de pastas não aparecem', async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem('meu-editor-web-painel-pastas', JSON.stringify({ aberto: true, largura: 240 }));
        });
        // O "celular" dos testes é o Edge do computador numa tela estreita, que sabe abrir pastas.
        // Um celular de verdade não sabe: os testes tiram esse recurso.
        await abrirEditor(page, { arquivos: 'indisponivel' });
        await expect(page.locator('#trilho-pastas')).toBeHidden();
        await expect(page.locator('#painel-pastas')).toBeHidden();
        await expect(page.locator('#painel-pastas-alca')).toBeHidden();
    });

    test('painel de sessão cabe na tela', async ({ page }) => {
        await abrirEditor(page);
        await page.locator('#botao-sessao').click();
        const painel = await page.locator('#painel-sessao').boundingBox();
        expect(painel.x).toBeGreaterThanOrEqual(0);
        expect(painel.x + painel.width).toBeLessThanOrEqual(390);
    });

    test('textos rápidos cobrem a tela sem passar da largura e fecham ao inserir', async ({ page }) => {
        await abrirEditor(page);
        await page.locator('#linguagem').selectOption('plaintext');
        await definirConteudo(page, '');
        await page.locator('#trilho-textos').click();
        await page.locator('#textos-novo').click();
        await page.locator('#textos-nome').fill('Saudação');
        await page.locator('#textos-texto').fill('Olá!');
        await page.locator('#textos-formulario button[type="submit"]').click();
        const painel = await page.locator('#painel-textos').boundingBox();
        expect(painel.x).toBe(0);
        expect(painel.width).toBeGreaterThan(380);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
        const inserir = await page.locator('.texto-cartao [data-acao="inserir"]').boundingBox();
        expect(inserir.height).toBeGreaterThanOrEqual(36);
        await page.locator('.texto-cartao [data-acao="inserir"]').click();
        await expect(page.locator('#painel-textos')).toBeHidden();
        expect(await page.evaluate(() => window.editor.getValue())).toBe('Olá!');
    });
});

// Na versão homelab o celular também usa a pasta do servidor.
test.describe('Celular na versão homelab', () => {
    let servidor;
    test.afterEach(async () => {
        if (servidor) {
            await servidor.parar();
            servidor = undefined;
        }
    });

    async function abrirHomelab(page, arquivos) {
        servidor = await iniciarServidor();
        criarNoDisco(servidor.pasta, arquivos);
        return abrirEditor(page, { endereco: servidor.endereco });
    }

    const item = (page, caminho) => page.locator(`#arvore-pastas [data-caminho="${caminho}"]`);

    test('o botão Pastas aparece e o painel cobre a tela, sem passar da largura', async ({ page }) => {
        const erros = await abrirHomelab(page, { 'notas.md': '# Notas', 'docs/guia.md': '# Guia' });
        await expect(page.locator('#trilho-pastas')).toBeVisible();
        await page.locator('#trilho-pastas').click();
        await expect(item(page, 'notas.md')).toBeVisible();
        const painel = await page.locator('#painel-pastas').boundingBox();
        const trilho = await page.locator('#trilho').boundingBox();
        expect(painel.x).toBe(0);
        expect(Math.round(painel.width)).toBe(390);
        // Termina onde começa a barra de ferramentas de baixo, sem cobri-la.
        expect(Math.round(painel.y + painel.height)).toBeLessThanOrEqual(Math.round(trilho.y) + 1);
        await expect(page.locator('#painel-pastas-alca')).toBeHidden();
        expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
        // Linhas altas o bastante para o dedo.
        expect((await item(page, 'notas.md').locator(':scope > .arvore-linha').boundingBox()).height).toBeGreaterThanOrEqual(40);
        expect(erros).toEqual([]);
    });

    test('tocar num arquivo abre o texto e fecha o painel; o botão Pastas abre de novo', async ({ page }) => {
        await abrirHomelab(page, { 'notas.md': '# Notas', 'docs/guia.md': '# Guia' });
        await page.locator('#trilho-pastas').click();
        await item(page, 'docs').locator(':scope > .arvore-linha').click();
        await item(page, 'docs/guia.md').locator(':scope > .arvore-linha').click();
        await expect(page.locator('#painel-pastas')).toBeHidden();
        await expect(page.locator('.aba.ativa .aba-nome')).toHaveText('guia.md');
        await page.locator('#trilho-pastas').click();
        await expect(item(page, 'docs/guia.md')).toHaveClass(/atual/);
    });

    test('o botão ⋯ aparece sem passar o mouse e o menu renomeia', async ({ page }) => {
        await abrirHomelab(page, { 'notas.md': '# Notas' });
        await page.locator('#trilho-pastas').click();
        const mais = item(page, 'notas.md').locator('.arvore-mais');
        await expect(mais).toBeVisible();
        expect((await mais.boundingBox()).width).toBeGreaterThanOrEqual(36);
        await mais.click();
        await page.locator('#menu-pastas [data-acao="renomear"]').click();
        await expect(page.locator('#arvore-pastas .arvore-entrada')).toBeFocused();
        await page.keyboard.type('ideias');
        await page.keyboard.press('Enter');
        await expect(item(page, 'ideias.md')).toBeVisible();
        expect(lerDoDisco(servidor.pasta)).toEqual({ 'ideias.md': '# Notas' });
    });

    test('o menu do botão ⋯ recorta e cola em outra pasta; os itens não se arrastam', async ({ page }) => {
        await abrirHomelab(page, { 'notas.md': '# Notas', 'docs/guia.md': '# Guia' });
        await page.locator('#trilho-pastas').click();
        await expect(item(page, 'notas.md').locator(':scope > .arvore-linha')).toHaveAttribute('draggable', 'false');
        await item(page, 'notas.md').locator('.arvore-mais').click();
        await page.locator('#menu-pastas [data-acao="recortar"]').click();
        await expect(item(page, 'notas.md')).toHaveClass(/recortado/);
        await item(page, 'docs').locator('.arvore-mais').click();
        await page.locator('#menu-pastas [data-acao="colar"]').click();
        await expect(item(page, 'docs/notas.md')).toBeVisible();
        expect(lerDoDisco(servidor.pasta)).toEqual({ 'docs/': null, 'docs/guia.md': '# Guia', 'docs/notas.md': '# Notas' });
    });
});
