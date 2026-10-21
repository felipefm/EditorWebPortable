// Área: abrir e salvar arquivos (com e sem a File System Access API).
const fs = require('fs');
const { test, expect } = require('@playwright/test');
const { abrirEditor, recarregar, definirConteudo, obterConteudo, focarEditor, arquivosGravados } = require('./utilidades');

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
        await expect(page.locator('.aba.ativa .aba-nome')).toHaveText('novo-arquivo.js');
        const gravados = await arquivosGravados(page);
        expect(gravados['novo-arquivo.js']).toContain('novo texto');
    });

    test('nome sugerido para documento novo usa a extensão da linguagem', async ({ page }) => {
        await abrirEditor(page);
        await page.locator('#linguagem').selectOption('markdown');
        await page.locator('#salvar').click();
        await expect(page.locator('.aba.ativa .aba-nome')).toHaveText('novo-arquivo.md');
    });

    test('com gravação direta o botão continua "Salvar" e não há aviso', async ({ page }) => {
        await abrirEditor(page);
        await expect(page.locator('#salvar .rotulo')).toHaveText('Salvar');
        await expect(page.locator('#aviso-arquivos')).toBeHidden();
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

// Firefox, Zen, Safari e navegadores de celular: não existe gravação direta em arquivo.
test.describe('Arquivos: navegador sem gravação direta', () => {
    function contarPerguntas(page) {
        const contador = { total: 0 };
        page.on('dialog', (dialogo) => {
            if (dialogo.type() === 'prompt') {
                contador.total += 1;
            }
        });
        return contador;
    }

    async function baixar(page, seletor) {
        const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.locator(seletor).click()
        ]);
        return download;
    }

    test('botão vira "Baixar" e o aviso explica o motivo', async ({ page }) => {
        await abrirEditor(page, { arquivos: 'indisponivel' });
        await expect(page.locator('#salvar .rotulo')).toHaveText('Baixar');
        await expect(page.locator('#salvar')).toHaveAttribute('title', /não grava direto no arquivo/);
        await expect(page.locator('#aviso-arquivos')).toBeVisible();
        await expect(page.locator('#aviso-arquivos')).toContainText('Chrome ou Edge');
    });

    test('"Entendi" esconde o aviso, que não volta depois de recarregar', async ({ page }) => {
        await abrirEditor(page, { arquivos: 'indisponivel' });
        await page.locator('#fechar-aviso-arquivos').click();
        await expect(page.locator('#aviso-arquivos')).toBeHidden();
        await recarregar(page);
        await expect(page.locator('#aviso-arquivos')).toBeHidden();
    });

    test('primeiro download pergunta o nome; os seguintes reaproveitam sem perguntar', async ({ page }) => {
        await abrirEditor(page, { arquivos: 'indisponivel', respostaPrompt: 'notas.txt' });
        const perguntas = contarPerguntas(page);
        await definirConteudo(page, 'versão 1');

        const primeiro = await baixar(page, '#salvar');
        expect(primeiro.suggestedFilename()).toBe('notas.txt');
        await expect(page.locator('.aba.ativa .aba-nome')).toHaveText('notas.txt');
        await expect(page.locator('.aba.modificada')).toHaveCount(0);

        await definirConteudo(page, 'versão 2');
        await expect(page.locator('.aba.modificada')).toHaveCount(1);
        const segundo = await baixar(page, '#salvar');
        expect(segundo.suggestedFilename()).toBe('notas.txt');
        expect(fs.readFileSync(await segundo.path(), 'utf8')).toBe('versão 2');
        await expect(page.locator('.aba.modificada')).toHaveCount(0);
        expect(perguntas.total).toBe(1);
    });

    test('arquivo aberto é baixado com o próprio nome, sem perguntar', async ({ page }) => {
        await abrirEditor(page, { arquivos: 'indisponivel' });
        const perguntas = contarPerguntas(page);
        await abrirPeloSeletor(page, 'relatorio.md', '# Relatório');
        await definirConteudo(page, '# Relatório revisado');
        const download = await baixar(page, '#salvar');
        expect(download.suggestedFilename()).toBe('relatorio.md');
        expect(perguntas.total).toBe(0);
    });

    test('"Baixar com outro nome" sempre pergunta e renomeia a aba', async ({ page }) => {
        await abrirEditor(page, { arquivos: 'indisponivel', respostaPrompt: 'copia.md' });
        const perguntas = contarPerguntas(page);
        await abrirPeloSeletor(page, 'original.md', '# Oi');
        const download = await baixar(page, '#salvar-como');
        expect(download.suggestedFilename()).toBe('copia.md');
        await expect(page.locator('.aba.ativa .aba-nome')).toHaveText('copia.md');
        expect(perguntas.total).toBe(1);
    });

    test('Ctrl+S não baixa nada e confirma o salvamento no navegador', async ({ page }) => {
        await abrirEditor(page, { arquivos: 'indisponivel' });
        let baixou = false;
        page.on('download', () => { baixou = true; });
        await focarEditor(page);
        await page.keyboard.type('texto');
        await page.keyboard.press('Control+S');
        await expect(page.locator('#estado')).toContainText('Salvo no navegador');
        await page.waitForTimeout(500);
        expect(baixou).toBe(false);
    });

    test('cancelar a pergunta do nome não baixa nada', async ({ page }) => {
        await abrirEditor(page, { arquivos: 'indisponivel' });
        let baixou = false;
        page.on('download', () => { baixou = true; });
        await page.locator('#salvar').click();
        await page.waitForTimeout(500);
        expect(baixou).toBe(false);
        await expect(page.locator('.aba.ativa .aba-nome')).toHaveText('Sem título 1');
    });
});
