// Área: formatador JSON.
const { test, expect } = require('@playwright/test');
const { abrirEditor, definirConteudo, editorJson, nomesDasAbas } = require('./utilidades');

async function abrirFormatador(page) {
    await abrirEditor(page);
    await page.locator('#trilho-json').click();
    await expect(page.locator('#formatador-json')).toBeVisible();
}

async function esperarSaida(page, esperado) {
    await expect.poll(async () => (await editorJson(page, 'saida')).valor).toBe(esperado);
}

test.describe('Formatador JSON', () => {
    test('entrada vazia mostra o estado vazio e desativa as ações', async ({ page }) => {
        await abrirFormatador(page);
        await expect(page.locator('#json-vazio')).toBeVisible();
        await expect(page.locator('#copiar-json')).toBeDisabled();
        await expect(page.locator('#json-nova-aba')).toBeDisabled();
    });

    test('formata automaticamente um JSON válido', async ({ page }) => {
        await abrirFormatador(page);
        await editorJson(page, 'entrada', '{"a":1,"b":[1,2]}');
        await esperarSaida(page, JSON.stringify({ a: 1, b: [1, 2] }, null, 2));
        await expect(page.locator('#json-situacao')).toHaveText('Válido');
        await expect(page.locator('#json-vazio')).toBeHidden();
        await expect(page.locator('#copiar-json')).toBeEnabled();
    });

    test('indentação com 4 espaços e com tabulação', async ({ page }) => {
        await abrirFormatador(page);
        await editorJson(page, 'entrada', '{"a":1}');
        await page.locator('#indentacao-json').selectOption('4');
        await esperarSaida(page, '{\n    "a": 1\n}');
        await page.locator('#indentacao-json').selectOption('tab');
        await esperarSaida(page, '{\n\t"a": 1\n}');
    });

    test('compactar remove espaços e quebras de linha', async ({ page }) => {
        await abrirFormatador(page);
        await editorJson(page, 'entrada', '{\n  "a": 1,\n  "b": 2\n}');
        await page.locator('#compactar-json').click();
        await esperarSaida(page, '{"a":1,"b":2}');
        await expect(page.locator('#json-situacao')).toHaveText('Válido · compactado');
        await page.locator('#formatar-json').click();
        await esperarSaida(page, '{\n  "a": 1,\n  "b": 2\n}');
    });

    test('JSON inválido mostra linha e coluna do erro', async ({ page }) => {
        await abrirFormatador(page);
        await editorJson(page, 'entrada', '{\n  "a": 1\n  "b": 2\n}');
        await expect(page.locator('#json-erro')).toBeVisible();
        await expect(page.locator('#json-erro-texto')).toContainText('Linha 3, coluna 3');
        await expect(page.locator('#json-situacao')).toHaveText('1 erro');
        await expect(page.locator('#json-vazio')).toBeVisible();
        await expect(page.locator('#estado')).toHaveText('JSON inválido');
    });

    test('"Ir para o erro" posiciona o cursor no erro', async ({ page }) => {
        await abrirFormatador(page);
        await editorJson(page, 'entrada', '{\n  "a": 1\n  "b": 2\n}');
        await page.locator('#ir-erro-json').click();
        const posicao = await editorJson(page, 'entrada');
        expect([posicao.linha, posicao.coluna]).toEqual([3, 3]);
    });

    test('corrigir o JSON esconde o erro', async ({ page }) => {
        await abrirFormatador(page);
        await editorJson(page, 'entrada', '{"a": }');
        await expect(page.locator('#json-erro')).toBeVisible();
        await editorJson(page, 'entrada', '{"a": 1}');
        await expect(page.locator('#json-erro')).toBeHidden();
    });

    test('"Usar aba atual" traz o conteúdo do documento', async ({ page }) => {
        await abrirEditor(page);
        await definirConteudo(page, '[1,2,3]');
        await page.locator('#trilho-json').click();
        await page.locator('#usar-json-atual').click();
        expect((await editorJson(page, 'entrada')).valor).toBe('[1,2,3]');
        await esperarSaida(page, '[\n  1,\n  2,\n  3\n]');
    });

    test('documento JSON aberto preenche a entrada ao abrir o formatador', async ({ page }) => {
        await abrirEditor(page);
        await page.locator('#linguagem').selectOption('json');
        await definirConteudo(page, '{"x":true}');
        await page.locator('#trilho-json').click();
        expect((await editorJson(page, 'entrada')).valor).toBe('{"x":true}');
    });

    test('copiar coloca o resultado na área de transferência', async ({ page, context, browserName }) => {
        test.skip(browserName === 'firefox', 'O Firefox não deixa testes automatizados lerem a área de transferência.');
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);
        await abrirFormatador(page);
        await editorJson(page, 'entrada', '{"a":1}');
        await esperarSaida(page, '{\n  "a": 1\n}');
        await page.locator('#copiar-json').click();
        await expect(page.locator('#estado')).toHaveText('Resultado copiado');
        // O Windows converte as quebras de linha da área de transferência para CRLF.
        const copiado = await page.evaluate(() => navigator.clipboard.readText());
        expect(copiado.replace(/\r\n/g, '\n')).toBe('{\n  "a": 1\n}');
    });

    test('"Abrir em nova aba" cria um documento JSON não salvo', async ({ page }) => {
        await abrirFormatador(page);
        await editorJson(page, 'entrada', '{"a":1}');
        await esperarSaida(page, '{\n  "a": 1\n}');
        await page.locator('#json-nova-aba').click();
        await expect(page.locator('#area-documentos')).toBeVisible();
        expect(await nomesDasAbas(page)).toHaveLength(2);
        await expect(page.locator('.aba.ativa .aba-linguagem')).toHaveText('{ }');
        await expect(page.locator('.aba.ativa')).toHaveClass(/modificada/);
        expect(await page.evaluate(() => window.editor.getValue())).toBe('{\n  "a": 1\n}');
    });
});
