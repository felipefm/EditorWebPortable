// Área: imagens em documentos Markdown (diálogo "Inserir imagem" e modo Visual).
const { test, expect } = require('@playwright/test');
const { abrirEditor, definirConteudo, obterConteudo, selecionar } = require('./utilidades');

const PNG_1PX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const editorVisual = (page) => page.locator('#editor-visual .milkdown .ProseMirror');

async function textoNormalizado(page) {
    return (await obterConteudo(page)).replace(/\r\n/g, '\n');
}

async function abrirMarkdown(page, conteudo) {
    const erros = await abrirEditor(page);
    await page.locator('#linguagem').selectOption('markdown');
    await definirConteudo(page, conteudo);
    return erros;
}

async function entrarNoVisual(page) {
    await page.locator('[data-modo="visual"]').click();
    await expect(editorVisual(page)).toBeVisible({ timeout: 30000 });
}

// Gera um PNG com o tamanho pedido, desenhado no próprio navegador.
async function gerarPng(page, largura, altura) {
    const base64 = await page.evaluate(([l, a]) => {
        const tela = document.createElement('canvas');
        tela.width = l;
        tela.height = a;
        const contexto = tela.getContext('2d');
        const gradiente = contexto.createLinearGradient(0, 0, l, a);
        gradiente.addColorStop(0, '#2b6cd4');
        gradiente.addColorStop(1, '#e8b45a');
        contexto.fillStyle = gradiente;
        contexto.fillRect(0, 0, l, a);
        return tela.toDataURL('image/png').split(',')[1];
    }, [largura, altura]);
    return Buffer.from(base64, 'base64');
}

async function dimensoesDaImagemEmbutida(page) {
    const texto = await obterConteudo(page);
    return page.evaluate((t) => new Promise((resolver) => {
        const encontrada = t.match(/\((data:image\/[^)]+)\)/);
        if (!encontrada) {
            resolver(null);
            return;
        }
        const imagem = new Image();
        imagem.onload = () => resolver({ largura: imagem.naturalWidth, altura: imagem.naturalHeight });
        imagem.src = encontrada[1];
    }), texto);
}

test.describe('Imagens no modo Visual', () => {
    // Defeito do Milkdown corrigido pelo editor: imagens sem título eram descartadas ao editar.
    const casos = [
        ['sozinha, sem título, link', '![Logo da empresa](https://example.com/logo.png)'],
        ['sozinha, sem título, embutida', `![Ponto](${PNG_1PX})`],
        ['sozinha, com título', '![Logo](https://example.com/logo.png "Legenda")'],
        ['no meio da frase', 'Texto com ![ícone](https://example.com/i.png) no meio'],
        ['sem descrição', '![](https://example.com/vazia.png)']
    ];
    for (const [nome, imagem] of casos) {
        test(`imagem ${nome} continua no texto depois de editar outro trecho`, async ({ page }) => {
            const inicial = `Antes\n\n${imagem}\n\nDepois`;
            await abrirMarkdown(page, inicial);
            await entrarNoVisual(page);
            await expect(editorVisual(page).locator('img[src]')).toHaveCount(1);
            await editorVisual(page).locator('p', { hasText: 'Depois' }).click();
            await page.keyboard.press('End');
            await page.keyboard.type('!');
            await expect.poll(() => textoNormalizado(page)).toBe(`${inicial}!`);
        });
    }

    test('a descrição da imagem é preservada (não vira "1.00")', async ({ page }) => {
        await abrirMarkdown(page, '![Foto da equipe](https://example.com/equipe.png)\n\nTexto');
        await entrarNoVisual(page);
        await editorVisual(page).locator('p', { hasText: 'Texto' }).click();
        await page.keyboard.press('End');
        await page.keyboard.type(' novo');
        await expect.poll(() => textoNormalizado(page)).toContain('![Foto da equipe](https://example.com/equipe.png)');
        expect(await textoNormalizado(page)).not.toContain('1.00');
    });
});

test.describe('Inserir imagem', () => {
    test('botão "Imagem" aparece só em documentos Markdown', async ({ page }) => {
        await abrirEditor(page);
        await expect(page.locator('#inserir-imagem')).toBeHidden();
        await page.locator('#linguagem').selectOption('markdown');
        await expect(page.locator('#inserir-imagem')).toBeVisible();
    });

    test('sem link e sem arquivo, o diálogo avisa e não insere nada', async ({ page }) => {
        await abrirMarkdown(page, 'Texto');
        await page.locator('#inserir-imagem').click();
        await page.locator('#imagem-confirmar').click();
        await expect(page.locator('#imagem-erro')).toHaveText('Cole o link de uma imagem ou escolha um arquivo.');
        await expect(page.locator('#dialogo-imagem')).toBeVisible();
        expect(await textoNormalizado(page)).toBe('Texto');
    });

    test('cancelar fecha o diálogo sem inserir', async ({ page }) => {
        await abrirMarkdown(page, 'Texto');
        await page.locator('#inserir-imagem').click();
        await page.locator('#imagem-link').fill('https://example.com/a.png');
        await page.locator('#formulario-imagem button[value="cancelar"]').click();
        await expect(page.locator('#dialogo-imagem')).toBeHidden();
        expect(await textoNormalizado(page)).toBe('Texto');
    });

    test('no modo Editor, insere ![descrição](link) na posição do cursor', async ({ page }) => {
        await abrirMarkdown(page, 'Antes  depois');
        await page.locator('[data-modo="editor"]').click();
        await selecionar(page, 1, 7, 1, 7);
        await page.locator('#inserir-imagem').click();
        await page.locator('#imagem-link').fill('https://example.com/foto.png');
        await page.locator('#imagem-descricao').fill('Minha foto');
        await page.locator('#imagem-confirmar').click();
        await expect(page.locator('#dialogo-imagem')).toBeHidden();
        expect(await textoNormalizado(page)).toBe('Antes ![Minha foto](https://example.com/foto.png) depois');
    });

    test('no modo Visual, insere a imagem por link e ela aparece', async ({ page }) => {
        await abrirMarkdown(page, 'Texto');
        await entrarNoVisual(page);
        await editorVisual(page).locator('p').first().click();
        await page.keyboard.press('End');
        await page.locator('#inserir-imagem').click();
        await page.locator('#imagem-link').fill('https://example.com/foto.png');
        await page.locator('#imagem-descricao').fill('Foto');
        await page.locator('#imagem-confirmar').click();
        await expect(editorVisual(page).locator('img[src]')).toHaveCount(1);
        await expect.poll(() => textoNormalizado(page)).toContain('![Foto](https://example.com/foto.png)');
    });

    test('arquivo grande é reduzido para no máximo 1600 px e embutido no documento', async ({ page }) => {
        await abrirMarkdown(page, 'Texto');
        await page.locator('#inserir-imagem').click();
        await page.locator('#imagem-arquivo').setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: await gerarPng(page, 3000, 2000) });
        await page.locator('#imagem-descricao').fill('Foto grande');
        await page.locator('#imagem-confirmar').click();
        await expect(page.locator('#dialogo-imagem')).toBeHidden();
        await expect.poll(() => textoNormalizado(page)).toContain('![Foto grande](data:image/');
        expect(await dimensoesDaImagemEmbutida(page)).toEqual({ largura: 1600, altura: 1067 });
        await expect(page.locator('#estado')).toContainText('Imagem inserida no documento');
    });

    test('arquivo pequeno mantém o tamanho original', async ({ page }) => {
        await abrirMarkdown(page, 'Texto');
        await page.locator('#inserir-imagem').click();
        await page.locator('#imagem-arquivo').setInputFiles({ name: 'icone.png', mimeType: 'image/png', buffer: await gerarPng(page, 120, 80) });
        await page.locator('#imagem-confirmar').click();
        await expect.poll(() => textoNormalizado(page)).toContain('](data:image/');
        expect(await dimensoesDaImagemEmbutida(page)).toEqual({ largura: 120, altura: 80 });
    });

    test('no modo Visual, o arquivo enviado aparece como imagem', async ({ page }) => {
        await abrirMarkdown(page, 'Texto');
        await entrarNoVisual(page);
        await editorVisual(page).locator('p').first().click();
        await page.keyboard.press('End');
        await page.locator('#inserir-imagem').click();
        await page.locator('#imagem-arquivo').setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: await gerarPng(page, 400, 300) });
        await page.locator('#imagem-confirmar').click();
        await expect(editorVisual(page).locator('img[src]')).toHaveCount(1);
        await expect.poll(() => textoNormalizado(page)).toContain('](data:image/');
    });

    test('arquivo que não é imagem mostra erro e não insere nada', async ({ page }) => {
        await abrirMarkdown(page, 'Texto');
        await page.locator('#inserir-imagem').click();
        await page.locator('#imagem-arquivo').setInputFiles({ name: 'notas.txt', mimeType: 'text/plain', buffer: Buffer.from('não sou imagem') });
        await page.locator('#imagem-confirmar').click();
        await expect(page.locator('#imagem-erro')).toContainText('não é uma imagem');
        await expect(page.locator('#dialogo-imagem')).toBeVisible();
        expect(await textoNormalizado(page)).toBe('Texto');
    });

    test('imagem embutida aparece no preview', async ({ page }) => {
        await abrirMarkdown(page, `![Ponto](${PNG_1PX})`);
        await expect(page.locator('#preview-conteudo img')).toHaveAttribute('alt', 'Ponto');
    });
});
