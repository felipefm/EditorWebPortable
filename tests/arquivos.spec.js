// Área: abrir e salvar arquivos (com e sem a File System Access API).
const { test, expect } = require('@playwright/test');
const { abrirEditor, definirConteudo, obterConteudo, focarEditor, arquivosGravados } = require('./utilidades');

async function abrirPeloSeletor(page, nome, conteudo) {
    const [seletor] = await Promise.all([
        page.waitForEvent('filechooser'),
        page.locator('#abrir').click()
    ]);
    await seletor.setFiles({ name: nome, mimeType: 'text/plain', buffer: Buffer.from(conteudo) });
}

test.describe('Arquivos', () => {
    const extensoes = [
        ['notas.md', 'markdown', 'MD'],
        ['dados.json', 'json', '{ }'],
        ['estilo.css', 'css', 'CSS'],
        ['pagina.html', 'html', 'HTML'],
        ['script.ts', 'typescript', 'TS'],
        ['leia.txt', 'plaintext', 'TXT']
    ];
    for (const [nome, linguagem, sigla] of extensoes) {
        test(`abrir ${nome} detecta a linguagem ${linguagem}`, async ({ page }) => {
            await abrirEditor(page, { arquivos: 'indisponivel' });
            await abrirPeloSeletor(page, nome, 'conteúdo de teste');
            await expect(page.locator('.aba.ativa .aba-nome')).toHaveText(nome);
            await expect(page.locator('.aba.ativa .aba-linguagem')).toHaveText(sigla);
            await expect(page.locator('#linguagem')).toHaveValue(linguagem);
            expect(await obterConteudo(page)).toBe('conteúdo de teste');
        });
    }

    test('sem a API de arquivos, salvar baixa uma cópia com o nome informado', async ({ page }) => {
        await abrirEditor(page, { arquivos: 'indisponivel', respostaPrompt: 'saida.txt' });
        await definirConteudo(page, 'linha salva');
        const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.locator('#salvar').click()
        ]);
        expect(download.suggestedFilename()).toBe('saida.txt');
        const caminho = await download.path();
        expect(require('fs').readFileSync(caminho, 'utf8')).toBe('linha salva');
    });

    test('com a API de arquivos, salvar um documento novo grava e limpa o indicador', async ({ page }) => {
        await abrirEditor(page);
        await focarEditor(page);
        await page.keyboard.type('novo texto');
        await expect(page.locator('.aba.modificada')).toHaveCount(1);
        await page.locator('#salvar').click();
        await expect(page.locator('.aba.modificada')).toHaveCount(0);
        await expect(page.locator('.aba.ativa .aba-nome')).toHaveText('novo-arquivo.txt');
        const gravados = await arquivosGravados(page);
        expect(gravados['novo-arquivo.txt']).toContain('novo texto');
    });

    test('arquivo aberto é salvo no mesmo arquivo com Ctrl+S', async ({ page }) => {
        await abrirEditor(page, { abrirArquivos: [{ nome: 'dados.json', conteudo: '{"a":1}' }] });
        await page.locator('#abrir').click();
        await expect(page.locator('.aba.ativa .aba-nome')).toHaveText('dados.json');
        await definirConteudo(page, '{"a":2}');
        await focarEditor(page);
        await page.keyboard.press('Control+S');
        await expect(page.locator('.aba.modificada')).toHaveCount(0);
        expect((await arquivosGravados(page))['dados.json']).toBe('{"a":2}');
    });

    test('Salvar como grava com o nome sugerido', async ({ page }) => {
        await abrirEditor(page, { abrirArquivos: [{ nome: 'original.md', conteudo: '# Oi' }] });
        await page.locator('#abrir').click();
        await page.locator('#salvar-como').click();
        await expect(page.locator('#estado')).toHaveText('Arquivo salvo');
        expect((await arquivosGravados(page))['original.md']).toBe('# Oi');
    });
});
