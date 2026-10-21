// Área: atalhos gerais (salvar, abrir, nova aba, formatador JSON) em todos os modos de visualização,
// com o foco dentro e fora do texto. Antes, fora do texto, o navegador abria "Salvar página como".
const { test, expect } = require('@playwright/test');
const { abrirEditor, definirConteudo, arquivosGravados } = require('./utilidades');

const modos = ['editor', 'dividido', 'preview', 'visual'];

async function prepararModo(page, modo, opcoes) {
    await abrirEditor(page, opcoes);
    await page.locator('#linguagem').selectOption('markdown');
    await definirConteudo(page, 'palavra final');
    await page.locator(`[data-modo="${modo}"]`).click();
    if (modo === 'visual') {
        await expect(page.locator('#editor-visual .ProseMirror')).toBeVisible({ timeout: 30000 });
    }
}

async function focarNoTexto(page, modo) {
    if (modo === 'visual') {
        await page.locator('#editor-visual .ProseMirror p').first().click();
    } else if (modo === 'preview') {
        await page.locator('#preview-conteudo').click();
    } else {
        await page.locator('#container .view-lines').click();
    }
}

// Deixa o foco num botão, fora do texto (como depois de trocar de modo).
async function focarForaDoTexto(page, modo) {
    await page.locator(`[data-modo="${modo}"]`).focus();
}

const atalhos = [
    ['Control+S', 'salva o documento', async (page) => {
        await expect.poll(async () => (await arquivosGravados(page))['novo-arquivo.md']).toBe('palavra final');
    }],
    ['Control+Shift+S', 'salva como', async (page) => {
        await expect.poll(async () => (await arquivosGravados(page))['novo-arquivo.md']).toBe('palavra final');
    }],
    ['Control+O', 'abre um arquivo', async (page) => {
        await expect(page.locator('.aba.ativa .aba-nome')).toHaveText('aberto.md');
    }],
    ['Control+Alt+N', 'cria uma aba nova', async (page) => {
        await expect(page.locator('.aba')).toHaveCount(2);
    }],
    ['Control+Alt+J', 'abre o formatador JSON', async (page) => {
        await expect(page.locator('#formatador-json')).toBeVisible();
    }]
];

test.describe('Atalhos gerais em todos os modos', () => {
    for (const modo of modos) {
        for (const [atalho, descricao, conferir] of atalhos) {
            test(`modo ${modo}, foco fora do texto: ${atalho} ${descricao}`, async ({ page }) => {
                await prepararModo(page, modo, { abrirArquivos: [{ nome: 'aberto.md', conteudo: '# Aberto' }] });
                await focarForaDoTexto(page, modo);
                await page.keyboard.press(atalho);
                await conferir(page);
            });
        }

        test(`modo ${modo}, foco no texto: Control+S salva o documento`, async ({ page }) => {
            await prepararModo(page, modo);
            await focarNoTexto(page, modo);
            await page.keyboard.press('Control+S');
            await expect.poll(async () => (await arquivosGravados(page))['novo-arquivo.md']).toBe('palavra final');
        });
    }

    test('navegador sem gravação direta (Zen/Firefox): Ctrl+S no modo Visual com foco num botão salva no navegador', async ({ page }) => {
        await prepararModo(page, 'visual', { arquivos: 'indisponivel' });
        let baixou = false;
        page.on('download', () => { baixou = true; });
        await focarForaDoTexto(page, 'visual');
        await page.keyboard.press('Control+S');
        await expect(page.locator('#estado')).toContainText('Salvo no navegador');
        expect(baixou).toBe(false);
    });

    test('atalho com um diálogo aberto não executa a ação', async ({ page }) => {
        await prepararModo(page, 'dividido');
        await page.locator('#inserir-imagem').click();
        await page.keyboard.press('Control+Alt+N');
        await expect(page.locator('.aba')).toHaveCount(1);
        await expect(page.locator('#dialogo-imagem')).toBeVisible();
    });
});
