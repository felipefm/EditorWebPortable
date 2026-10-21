// Área: minimapa (o do Monaco nos modos Editor e Dividido, e o desenhado pelo editor no modo Visual).
const { test, expect } = require('@playwright/test');
const { abrirEditor, recarregar, definirConteudo } = require('./utilidades');

// Documento longo o bastante para rolar, com títulos, código, citação e tabela.
const documentoLongo = [
    '# Início',
    '',
    ...Array.from({ length: 80 }, (_, indice) => `Parágrafo ${indice + 1} com algum texto para ocupar a linha inteira do editor.\n`),
    '```js',
    'const a = 1;',
    '```',
    '',
    '> citação no meio',
    '',
    '| A | B |',
    '| --- | --- |',
    '| 1 | 2 |',
    '',
    ...Array.from({ length: 80 }, (_, indice) => `Mais texto ${indice + 1} até o fim do documento, para a página rolar bastante.\n`),
    '## Fim',
    ''
].join('\n');

const minimapaMonaco = (page) => page.locator('#container .minimap');
const botaoMapa = (page) => page.locator('#alternar-mapa');

async function abrirMarkdown(page, modo, conteudo = documentoLongo) {
    const erros = await abrirEditor(page);
    await page.locator('#linguagem').selectOption('markdown');
    await definirConteudo(page, conteudo);
    await page.locator(`[data-modo="${modo}"]`).click();
    if (modo === 'visual') {
        await expect(page.locator('#editor-visual .ProseMirror')).toBeVisible({ timeout: 30000 });
    }
    return erros;
}

// Quantos pixels do canvas do mapa Visual foram pintados (0 = mapa vazio).
function pixelsPintados(page, deY = 0, ateY = 1) {
    return page.evaluate(([inicio, fim]) => {
        const tela = document.getElementById('mapa-visual-tela');
        if (!tela.width || !tela.height) {
            return 0;
        }
        const y0 = Math.floor(tela.height * inicio);
        const altura = Math.max(1, Math.floor(tela.height * fim) - y0);
        const dados = tela.getContext('2d').getImageData(0, y0, tela.width, altura).data;
        let total = 0;
        for (let indice = 3; indice < dados.length; indice += 4) {
            if (dados[indice] > 0) {
                total += 1;
            }
        }
        return total;
    }, [deY, ateY]);
}

const rolagemVisual = (page) => page.evaluate(() => document.getElementById('editor-visual').scrollTop);

test.describe('Minimapa', () => {
    test('vem ligado no modo Editor, inclusive em arquivos que não são Markdown', async ({ page }) => {
        const erros = await abrirEditor(page);
        await definirConteudo(page, 'const a = 1;\n'.repeat(50));
        await expect(botaoMapa(page)).toBeVisible();
        await expect(botaoMapa(page)).toHaveAttribute('aria-pressed', 'true');
        await expect(minimapaMonaco(page)).toBeVisible();
        expect(erros).toEqual([]);
    });

    test('aparece no modo Dividido', async ({ page }) => {
        await abrirMarkdown(page, 'dividido');
        await expect(minimapaMonaco(page)).toBeVisible();
    });

    test('o botão desliga e liga o minimapa', async ({ page }) => {
        await abrirMarkdown(page, 'editor');
        await botaoMapa(page).click();
        await expect(botaoMapa(page)).toHaveAttribute('aria-pressed', 'false');
        await expect(minimapaMonaco(page)).toBeHidden();
        await expect(page.locator('#estado')).toHaveText('Minimapa desligado');
        await botaoMapa(page).click();
        await expect(botaoMapa(page)).toHaveAttribute('aria-pressed', 'true');
        await expect(minimapaMonaco(page)).toBeVisible();
        await expect(page.locator('#estado')).toHaveText('Minimapa ligado');
    });

    test('a escolha fica lembrada depois de recarregar', async ({ page }) => {
        await abrirMarkdown(page, 'editor');
        await botaoMapa(page).click();
        await recarregar(page);
        await expect(botaoMapa(page)).toHaveAttribute('aria-pressed', 'false');
        await expect(minimapaMonaco(page)).toBeHidden();
    });

    test('clicar no minimapa do Editor rola o documento', async ({ page }) => {
        await abrirMarkdown(page, 'editor');
        expect(await page.evaluate(() => window.editor.getScrollTop())).toBe(0);
        const caixa = await minimapaMonaco(page).boundingBox();
        await page.mouse.click(caixa.x + caixa.width / 2, caixa.y + caixa.height * 0.9);
        await expect.poll(() => page.evaluate(() => window.editor.getScrollTop())).toBeGreaterThan(500);
    });

    test('no modo Visual aparece o mapa desenhado ao lado da página', async ({ page }) => {
        const erros = await abrirMarkdown(page, 'visual');
        await expect(page.locator('#mapa-visual')).toBeVisible();
        await expect.poll(() => pixelsPintados(page)).toBeGreaterThan(500);
        const mapa = await page.locator('#mapa-visual').boundingBox();
        const pagina = await page.locator('#editor-visual').boundingBox();
        expect(mapa.x).toBeGreaterThanOrEqual(pagina.x + pagina.width - 1);
        expect(erros).toEqual([]);
    });

    test('desligar esconde o mapa do modo Visual e a página ocupa a largura toda', async ({ page }) => {
        await abrirMarkdown(page, 'visual');
        const larguraComMapa = (await page.locator('#editor-visual').boundingBox()).width;
        await botaoMapa(page).click();
        await expect(page.locator('#mapa-visual')).toBeHidden();
        await expect.poll(async () => (await page.locator('#editor-visual').boundingBox()).width).toBeGreaterThan(larguraComMapa);
        await botaoMapa(page).click();
        await expect(page.locator('#mapa-visual')).toBeVisible();
    });

    test('a escolha também vale para o modo Visual depois de recarregar', async ({ page }) => {
        await abrirMarkdown(page, 'visual');
        await botaoMapa(page).click();
        await recarregar(page);
        await expect(page.locator('#editor-visual .ProseMirror')).toBeVisible({ timeout: 30000 });
        await expect(page.locator('#mapa-visual')).toBeHidden();
    });

    test('clicar no mapa do Visual rola o documento até aquele ponto', async ({ page }) => {
        await abrirMarkdown(page, 'visual');
        await expect.poll(() => pixelsPintados(page)).toBeGreaterThan(500);
        expect(await rolagemVisual(page)).toBe(0);
        const caixa = await page.locator('#mapa-visual').boundingBox();
        await page.mouse.click(caixa.x + caixa.width / 2, caixa.y + caixa.height * 0.8);
        await expect.poll(() => rolagemVisual(page)).toBeGreaterThan(500);
    });

    test('arrastar a janela do mapa do Visual rola o documento', async ({ page }) => {
        await abrirMarkdown(page, 'visual');
        await expect.poll(() => pixelsPintados(page)).toBeGreaterThan(500);
        const janela = await page.locator('#mapa-visual-janela').boundingBox();
        const x = janela.x + janela.width / 2;
        const y = janela.y + janela.height / 2;
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x, y + 40, { steps: 5 });
        const depoisDe40 = await rolagemVisual(page);
        expect(depoisDe40).toBeGreaterThan(100);
        await page.mouse.move(x, y + 120, { steps: 5 });
        await page.mouse.up();
        expect(await rolagemVisual(page)).toBeGreaterThan(depoisDe40);
    });

    test('rolar a página do Visual move a janela do mapa', async ({ page }) => {
        await abrirMarkdown(page, 'visual');
        await expect.poll(() => pixelsPintados(page)).toBeGreaterThan(500);
        const antes = (await page.locator('#mapa-visual-janela').boundingBox()).y;
        await page.evaluate(() => {
            const visual = document.getElementById('editor-visual');
            visual.scrollTop = visual.scrollHeight;
        });
        await expect.poll(async () => (await page.locator('#mapa-visual-janela').boundingBox()).y).toBeGreaterThan(antes + 50);
    });

    test('o mapa do Visual se atualiza ao digitar', async ({ page }) => {
        await abrirMarkdown(page, 'visual', '# Curto\n\nUm parágrafo.\n');
        await expect.poll(() => pixelsPintados(page)).toBeGreaterThan(20);
        const antes = await pixelsPintados(page, 0.05, 1);
        await page.locator('#editor-visual .ProseMirror p').last().click();
        await page.keyboard.press('End');
        for (let indice = 0; indice < 6; indice += 1) {
            await page.keyboard.press('Enter');
            await page.keyboard.type('Mais uma linha de texto digitada no modo Visual.');
        }
        await expect.poll(() => pixelsPintados(page, 0.05, 1)).toBeGreaterThan(antes + 50);
    });

    test('o mapa do Visual ignora os botões do bloco de código', async ({ page }) => {
        // Só um bloco de código: sem o filtro, "js" e "Copiar" virariam traços acima do código.
        await abrirMarkdown(page, 'visual', '```js\nx\n```\n');
        await expect.poll(() => pixelsPintados(page)).toBeGreaterThan(0);
        const textos = await page.evaluate(() => {
            const raiz = document.querySelector('#editor-visual .ProseMirror');
            return [...raiz.querySelectorAll('button')].map((botao) => botao.textContent.trim()).filter(Boolean);
        });
        expect(textos).toContain('Copiar');
        // O fundo do bloco é pintado, mas a área dos botões (canto superior direito) fica sem traços de texto.
        const pintadoNosBotoes = await page.evaluate(() => {
            const visual = document.getElementById('editor-visual');
            const pagina = visual.querySelector('.ProseMirror').getBoundingClientRect();
            const botoes = visual.querySelector('.milkdown-code-block .tools').getBoundingClientRect();
            const tela = document.getElementById('mapa-visual-tela');
            const escala = tela.width / pagina.width;
            const topo = visual.getBoundingClientRect().top - visual.scrollTop;
            const dados = tela.getContext('2d').getImageData(
                Math.floor((botoes.left - pagina.left) * escala), Math.floor((botoes.top - topo) * escala),
                Math.max(1, Math.ceil(botoes.width * escala)), Math.max(1, Math.ceil(botoes.height * escala))).data;
            let maximo = 0;
            for (let indice = 3; indice < dados.length; indice += 4) {
                maximo = Math.max(maximo, dados[indice]);
            }
            return maximo;
        });
        // Traço de texto tem opacidade 0.6 (153); o fundo do bloco é bem mais fraco.
        expect(pintadoNosBotoes).toBeLessThan(100);
    });
});
