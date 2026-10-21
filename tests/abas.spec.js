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
});
