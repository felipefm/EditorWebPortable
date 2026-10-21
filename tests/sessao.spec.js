// Área: sessão salva no navegador, painel de backup, exportar e importar.
const { test, expect } = require('@playwright/test');
const { abrirEditor, recarregar, definirConteudo, obterConteudo, novaAba, nomesDasAbas, arquivosGravados } = require('./utilidades');

const sessaoExemplo = {
    versao: 2,
    documentos: [
        { id: 1, nome: 'importado.md', conteudo: '# Importado', linguagem: 'markdown' },
        { id: 2, nome: 'outro.js', conteudo: 'let a = 1;', linguagem: 'javascript' }
    ],
    documentoAtualId: 1,
    visualizacaoAtual: 'editor'
};

async function importar(page, conteudo) {
    await page.locator('#botao-sessao').click();
    const [seletor] = await Promise.all([
        page.waitForEvent('filechooser'),
        page.locator('#importar-sessao').click()
    ]);
    await seletor.setFiles({ name: 'sessao.json', mimeType: 'application/json', buffer: Buffer.from(conteudo) });
}

test.describe('Sessão e backup', () => {
    test('abas e conteúdo voltam depois de recarregar a página', async ({ page }) => {
        await abrirEditor(page);
        await definirConteudo(page, 'conteudo um');
        await novaAba(page, 'markdown', '# conteudo dois');
        await recarregar(page);
        expect(await nomesDasAbas(page)).toEqual(['Sem título 1', 'Sem título 2']);
        await expect(page.locator('.aba.ativa .aba-nome')).toHaveText('Sem título 2');
        expect(await obterConteudo(page)).toBe('# conteudo dois');
        await expect(page.locator('#estado')).toContainText('Sessão restaurada');
    });

    test('a ferramenta aberta também é restaurada', async ({ page }) => {
        await abrirEditor(page);
        await page.locator('#trilho-json').click();
        await recarregar(page);
        await expect(page.locator('#formatador-json')).toBeVisible();
    });

    test('painel de sessão abre, fecha com Esc e com clique fora', async ({ page }) => {
        await abrirEditor(page);
        await page.locator('#botao-sessao').click();
        await expect(page.locator('#painel-sessao')).toBeVisible();
        await expect(page.locator('#botao-sessao')).toHaveAttribute('aria-expanded', 'true');
        await page.keyboard.press('Escape');
        await expect(page.locator('#painel-sessao')).toBeHidden();

        await page.locator('#botao-sessao').click();
        await page.locator('#trilho').click({ position: { x: 20, y: 400 } });
        await expect(page.locator('#painel-sessao')).toBeHidden();
    });

    test('painel mostra o horário do último salvamento e o número de abas', async ({ page }) => {
        await abrirEditor(page);
        await novaAba(page, null, 'algo');
        await page.locator('#botao-sessao').click();
        await expect(page.locator('#status-navegador')).toContainText('Salvo automaticamente às');
        await expect(page.locator('#sessao-abas')).toHaveText('2 abas abertas');
    });

    test('exportar cópia baixa um JSON com todas as abas', async ({ page }) => {
        await abrirEditor(page);
        await novaAba(page, 'markdown', '# exportado');
        await page.locator('#botao-sessao').click();
        const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.locator('#exportar-sessao').click()
        ]);
        expect(download.suggestedFilename()).toBe('meu-editor-sessao.json');
        const sessao = JSON.parse(require('fs').readFileSync(await download.path(), 'utf8'));
        expect(sessao.documentos).toHaveLength(2);
        expect(sessao.documentos[1].conteudo).toBe('# exportado');
    });

    test('importar sessão substitui as abas', async ({ page }) => {
        await abrirEditor(page);
        await importar(page, JSON.stringify(sessaoExemplo));
        await expect(page.locator('.aba-nome')).toHaveText(['importado.md', 'outro.js']);
        expect(await obterConteudo(page)).toBe('# Importado');
        await expect(page.locator('#estado')).toHaveText('Sessão importada');
    });

    test('importar com alterações pendentes pede confirmação', async ({ page }) => {
        await abrirEditor(page);
        await novaAba(page, null, 'não salvo');
        await importar(page, JSON.stringify(sessaoExemplo));
        await expect(page.locator('#dialogo-confirmacao')).toBeVisible();
        await page.locator('#dialogo-acoes button[value="cancelar"]').click();
        expect(await nomesDasAbas(page)).toEqual(['Sem título 1', 'Sem título 2']);
    });

    test('importar arquivo inválido avisa e mantém as abas', async ({ page }) => {
        await abrirEditor(page);
        await importar(page, '{"isto": "não é uma sessão"}');
        await expect(page.locator('#estado')).toContainText('Falha ao importar sessão');
        await expect(page.locator('.aba')).toHaveCount(1);
    });

    test('configurar backup em arquivo grava a sessão e mostra "Backup ativo"', async ({ page }) => {
        await abrirEditor(page);
        await expect(page.locator('#rotulo-sessao')).toHaveText('Salvo no navegador');
        await page.locator('#botao-sessao').click();
        await page.locator('#configurar-backup').click();
        await expect(page.locator('#rotulo-sessao')).toHaveText('Backup ativo');
        await expect(page.locator('#botao-sessao')).toHaveClass(/ok/);
        await expect(page.locator('#configurar-backup')).toHaveText('Trocar');
        await expect(page.locator('#status-backup')).toContainText('meu-editor-sessao.json');
        const gravado = JSON.parse((await arquivosGravados(page))['meu-editor-sessao.json']);
        expect(gravado.documentos).toHaveLength(1);
    });

    test('navegador sem backup em arquivo explica e esconde o botão', async ({ page }) => {
        await abrirEditor(page, { arquivos: 'indisponivel' });
        await page.locator('#botao-sessao').click();
        await expect(page.locator('#status-backup')).toContainText('não permite backup automático');
        await expect(page.locator('#configurar-backup')).toBeHidden();
        await expect(page.locator('#rotulo-sessao')).toHaveText('Salvo no navegador');
    });
});
