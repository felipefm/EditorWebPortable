// Área: modo Visual de Markdown (Milkdown, carregado do CDN esm.sh).
const { test, expect } = require('@playwright/test');
const { abrirEditor, recarregar, definirConteudo, obterConteudo, novaAba, arquivosGravados } = require('./utilidades');

const amostra = [
    '# Notas',
    '',
    'Texto com **negrito** e _itálico_.',
    '',
    '- item um',
    '- item dois',
    '',
    '- [x] feito',
    '- [ ] pendente',
    '',
    '---',
    '',
    '| Coluna | Valor |',
    '| --- | --- |',
    '| a | 1 |',
    ''
].join('\n');

const editorVisual = (page) => page.locator('#editor-visual .milkdown .ProseMirror');

async function abrirVisual(page, conteudo, opcoes) {
    const erros = await abrirEditor(page, opcoes);
    await page.locator('#linguagem').selectOption('markdown');
    await definirConteudo(page, conteudo);
    await page.locator('[data-modo="visual"]').click();
    await expect(editorVisual(page)).toBeVisible({ timeout: 30000 });
    return erros;
}

// Duplo clique na primeira palavra do primeiro parágrafo (o parágrafo ocupa a largura toda).
// Com o computador ocupado, o navegador às vezes recebe os dois cliques como cliques separados e
// não seleciona nada; nesse caso o duplo clique é repetido até a palavra ficar selecionada. A pausa
// entre as tentativas evita que o navegador junte os cliques num clique triplo (parágrafo inteiro).
async function selecionarPrimeiraPalavra(page) {
    const caixa = await editorVisual(page).locator('p').first().boundingBox();
    await expect(async () => {
        await page.mouse.dblclick(caixa.x + 20, caixa.y + caixa.height / 2);
        expect((await page.evaluate(() => window.getSelection().toString())).trim()).not.toBe('');
    }).toPass({ timeout: 10000, intervals: [800] });
}

async function textoNormalizado(page) {
    return (await obterConteudo(page)).replace(/\r\n/g, '\n');
}

// Coloca o cursor no fim do último parágrafo do editor visual.
async function irParaFimDoParagrafo(page, texto) {
    await editorVisual(page).locator('p', { hasText: texto }).last().click();
    await page.keyboard.press('End');
}

test.describe('Modo Visual', () => {
    test('mostra o Markdown formatado e esconde a barra do editor de texto', async ({ page }) => {
        const erros = await abrirVisual(page, amostra);
        await expect(editorVisual(page).locator('h1')).toHaveText('Notas');
        await expect(editorVisual(page).locator('strong')).toHaveText('negrito');
        await expect(editorVisual(page).locator('th, td').filter({ hasText: 'Valor' }).first()).toBeVisible();
        await expect(page.locator('#container')).toBeHidden();
        await expect(page.locator('#preview-markdown')).toBeHidden();
        await expect(page.locator('#ferramentas-markdown')).toBeHidden();
        await expect(page.locator('[data-modo="visual"]')).toHaveAttribute('aria-pressed', 'true');
        expect(erros).toEqual([]);
    });

    test('entrar e sair do modo Visual sem editar não altera o texto', async ({ page }) => {
        await abrirVisual(page, amostra);
        await page.locator('[data-modo="editor"]').click();
        expect(await textoNormalizado(page)).toBe(amostra);
    });

    test('digitar no modo Visual atualiza o Markdown', async ({ page }) => {
        await abrirVisual(page, 'Primeira linha');
        await irParaFimDoParagrafo(page, 'Primeira linha');
        await page.keyboard.type(' continuada');
        await expect.poll(() => textoNormalizado(page)).toBe('Primeira linha continuada');
        await expect(page.locator('#status-caracteres')).toHaveText('25 caracteres');
    });

    test('Ctrl+B no modo Visual vira **negrito** no Markdown', async ({ page }) => {
        await abrirVisual(page, 'palavra');
        await selecionarPrimeiraPalavra(page);
        await page.keyboard.press('Control+B');
        await expect.poll(() => textoNormalizado(page)).toBe('**palavra**');
    });

    test('editar preserva o estilo do documento (listas com * e itálico com *)', async ({ page }) => {
        await abrirVisual(page, '* um\n* dois\n\nTexto *inclinado* e normal');
        await irParaFimDoParagrafo(page, 'Texto');
        await page.keyboard.type(' fim');
        await expect.poll(() => textoNormalizado(page)).toBe('* um\n* dois\n\nTexto *inclinado* e normal fim');
    });

    test('tabela editada mantém o separador | --- |', async ({ page }) => {
        await abrirVisual(page, 'Antes\n\n| A | B |\n| --- | --- |\n| 1 | 2 |');
        await irParaFimDoParagrafo(page, 'Antes');
        await page.keyboard.type('!');
        await expect.poll(() => textoNormalizado(page)).toBe('Antes!\n\n| A | B |\n| --- | --- |\n| 1 | 2 |');
    });

    test('Ctrl+S no modo Visual salva o texto mais recente', async ({ page }) => {
        await abrirVisual(page, 'rascunho');
        await irParaFimDoParagrafo(page, 'rascunho');
        await page.keyboard.type(' final');
        await page.keyboard.press('Control+S');
        await expect(page.locator('.aba.ativa .aba-nome')).toHaveText('novo-arquivo.md');
        expect((await arquivosGravados(page))['novo-arquivo.md']).toBe('rascunho final');
    });

    test('trocar de aba mostra o conteúdo da outra e preserva o da primeira', async ({ page }) => {
        await abrirVisual(page, 'Documento A');
        await irParaFimDoParagrafo(page, 'Documento A');
        await page.keyboard.type(' editado');
        await novaAba(page, 'markdown', 'Documento B');
        await page.locator('[data-modo="visual"]').click();
        await expect(editorVisual(page)).toContainText('Documento B');
        await page.locator('.aba-nome', { hasText: 'Sem título 1' }).click();
        await expect(editorVisual(page)).toContainText('Documento A editado');
        await page.locator('[data-modo="editor"]').click();
        expect(await textoNormalizado(page)).toBe('Documento A editado');
    });

    test('modo Visual é lembrado depois de recarregar', async ({ page }) => {
        await abrirVisual(page, '# Título');
        await recarregar(page);
        await expect(editorVisual(page)).toBeVisible({ timeout: 30000 });
        await expect(editorVisual(page).locator('h1')).toHaveText('Título');
    });

    test('sem internet para o editor visual, volta ao modo Dividido e avisa', async ({ page }) => {
        await page.route('https://esm.sh/**', (rota) => rota.abort());
        await abrirEditor(page);
        await page.locator('#linguagem').selectOption('markdown');
        await definirConteudo(page, '# Oi');
        await page.locator('[data-modo="visual"]').click();
        await expect(page.locator('#estado')).toContainText('Não foi possível carregar o editor visual');
        await expect(page.locator('[data-modo="dividido"]')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('#container')).toBeVisible();
    });

    test('menu "/" aparece em português', async ({ page }) => {
        await abrirVisual(page, 'Texto');
        await irParaFimDoParagrafo(page, 'Texto');
        await page.keyboard.press('Enter');
        await page.keyboard.type('/');
        await expect(page.getByText('Título 1', { exact: true })).toBeVisible();
        await expect(page.getByText('Lista de tarefas', { exact: true })).toBeAttached();
        await expect(page.getByText('Heading 1', { exact: true })).toHaveCount(0);
    });

    // Todos os atalhos da página "Atalhos de teclado" precisam funcionar também no modo Visual.
    const atalhos = [
        ['negrito', 'Control+B', true, '**palavra** final'],
        ['itálico', 'Control+I', true, '_palavra_ final'],
        ['tachado', 'Control+Shift+X', true, '~~palavra~~ final'],
        ['tachado (alternativo)', 'Alt+Shift+5', true, '~~palavra~~ final'],
        ['código inline', 'Control+Backquote', true, '`palavra` final'],
        ['título 1', 'Control+1', false, '# palavra final'],
        ['título 2', 'Control+2', false, '## palavra final'],
        ['título 3', 'Control+3', false, '### palavra final'],
        ['título 4', 'Control+4', false, '#### palavra final'],
        ['título 5', 'Control+5', false, '##### palavra final'],
        ['título 6', 'Control+6', false, '###### palavra final'],
        ['título 2 com Shift', 'Control+Shift+2', false, '## palavra final'],
        ['lista numerada', 'Control+Shift+7', false, '1. palavra final'],
        ['lista com marcadores', 'Control+Shift+8', false, '- palavra final'],
        ['lista de tarefas', 'Control+Shift+9', false, '- [ ] palavra final'],
        ['citação', 'Control+Shift+Q', false, '> palavra final']
    ];

    async function posicionarNaPalavra(page, selecionarPalavra) {
        if (selecionarPalavra) {
            // No Windows, o duplo clique seleciona também o espaço seguinte.
            await selecionarPrimeiraPalavra(page);
        } else {
            const caixa = await editorVisual(page).locator('p').first().boundingBox();
            await page.mouse.click(caixa.x + 20, caixa.y + caixa.height / 2);
        }
    }

    for (const [nome, atalho, selecionarPalavra, esperado] of atalhos) {
        test(`atalho ${atalho} (${nome}) funciona no modo Visual`, async ({ page }) => {
            await abrirVisual(page, 'palavra final');
            await posicionarNaPalavra(page, selecionarPalavra);
            await page.keyboard.press(atalho);
            await expect.poll(() => textoNormalizado(page)).toBe(esperado);
        });
    }

    test('atalho Control+K (link) pede o endereço e cria o link', async ({ page }) => {
        await abrirVisual(page, 'palavra final');
        await posicionarNaPalavra(page, true);
        await page.keyboard.press('Control+K');
        await page.keyboard.type('https://exemplo.com');
        await page.keyboard.press('Enter');
        await expect.poll(() => textoNormalizado(page)).toBe('[palavra](https://exemplo.com) final');
    });

    const alternancias = [
        ['título', 'Control+2'],
        ['lista numerada', 'Control+Shift+7'],
        ['lista com marcadores', 'Control+Shift+8'],
        ['lista de tarefas', 'Control+Shift+9'],
        ['citação', 'Control+Shift+Q']
    ];
    for (const [nome, atalho] of alternancias) {
        test(`apertar ${atalho} duas vezes desfaz ${nome} no modo Visual`, async ({ page }) => {
            await abrirVisual(page, 'palavra final');
            await posicionarNaPalavra(page, false);
            await page.keyboard.press(atalho);
            await expect.poll(() => textoNormalizado(page)).not.toBe('palavra final');
            await page.keyboard.press(atalho);
            await expect.poll(() => textoNormalizado(page)).toBe('palavra final');
        });
    }

    // No Markdown, o "[" sozinho é escrito como "\[" para não virar link.
    for (const [tecla, esperado] of [['"', '"palavra" final'], ["'", "'palavra' final"], ['(', '(palavra) final'], ['[', '\\[palavra] final'], ['{', '{palavra} final']]) {
        test(`digitar ${tecla} com a palavra selecionada envolve em vez de apagar (modo Visual)`, async ({ page }) => {
            await abrirVisual(page, 'palavra final');
            await posicionarNaPalavra(page, true);
            await page.keyboard.type(tecla);
            await expect.poll(() => textoNormalizado(page)).toBe(esperado);
        });
    }

    const botaoMais = (page) => page.locator('#editor-visual .milkdown-block-handle .operation-item').nth(0);
    const alcaArrastar = (page) => page.locator('#editor-visual .milkdown-block-handle .operation-item').nth(1);

    test('ao passar o mouse aparece o + na margem, sem a alça de arrastar', async ({ page }) => {
        await abrirVisual(page, 'Primeiro\n\nSegundo\n\nTerceiro');
        const terceiro = await editorVisual(page).locator('p', { hasText: 'Terceiro' }).boundingBox();
        await page.mouse.move(terceiro.x + 30, terceiro.y + terceiro.height / 2);
        await expect(botaoMais(page)).toBeVisible();
        await expect(alcaArrastar(page)).toBeHidden();
        const mais = await botaoMais(page).boundingBox();
        expect(mais.x + mais.width).toBeLessThanOrEqual(terceiro.x + 1);
    });

    test('clicar no + abre o menu de blocos', async ({ page }) => {
        await abrirVisual(page, 'Primeiro\n\nSegundo');
        const segundo = await editorVisual(page).locator('p', { hasText: 'Segundo' }).boundingBox();
        await page.mouse.move(segundo.x + 30, segundo.y + segundo.height / 2);
        await botaoMais(page).click();
        await expect(page.locator('.milkdown-slash-menu')).toBeVisible();
        await expect(page.locator('.milkdown-slash-menu')).toContainText('Título 1');
    });

    test('arrastar pelo + não move o parágrafo', async ({ page }) => {
        const texto = 'Primeiro parágrafo.\n\nSegundo parágrafo.\n\nTerceiro parágrafo.';
        await abrirVisual(page, texto);
        const terceiro = await editorVisual(page).locator('p', { hasText: 'Terceiro' }).boundingBox();
        await page.mouse.move(terceiro.x + 30, terceiro.y + terceiro.height / 2);
        const mais = await botaoMais(page).boundingBox();
        await page.mouse.move(mais.x + mais.width / 2, mais.y + mais.height / 2);
        await page.mouse.down();
        await page.mouse.move(mais.x + 200, mais.y - 70, { steps: 12 });
        await page.mouse.up();
        await page.waitForTimeout(400);
        expect(await textoNormalizado(page)).toBe(texto);
    });

    test('começar a seleção pela margem esquerda não move o parágrafo', async ({ page }) => {
        const texto = 'Primeiro parágrafo.\n\nSegundo parágrafo.\n\nTerceiro parágrafo.';
        await abrirVisual(page, texto);
        const terceiro = await editorVisual(page).locator('p', { hasText: 'Terceiro' }).boundingBox();
        // Passa o mouse no parágrafo (a margem mostra o +) e aperta logo à esquerda do texto,
        // onde o Milkdown põe a alça de arrastar.
        await page.mouse.move(terceiro.x + 30, terceiro.y + terceiro.height / 2);
        await expect(botaoMais(page)).toBeVisible();
        const alca = await page.locator('#editor-visual .milkdown-block-handle').boundingBox();
        await page.mouse.move(alca.x + alca.width - 8, alca.y + alca.height / 2);
        await page.mouse.down();
        await page.mouse.move(terceiro.x + 200, terceiro.y - 70, { steps: 12 });
        await page.mouse.up();
        await page.waitForTimeout(400);
        expect(await textoNormalizado(page)).toBe(texto);
    });

    test('documento que não é Markdown não usa o modo Visual', async ({ page }) => {
        await abrirVisual(page, '# Markdown');
        await novaAba(page, 'javascript', 'const a = 1;');
        await expect(page.locator('#editor-visual')).toBeHidden();
        await expect(page.locator('#container')).toBeVisible();
    });
});

// Depois de cada ação, dá para digitar sem clicar no texto: o cursor já está no editor certo.
test.describe('Modo Visual: foco pronto para digitar', () => {
    async function digitarSemClicar(page) {
        await expect(editorVisual(page)).toBeVisible({ timeout: 30000 });
        await page.keyboard.type('digitado');
        await expect.poll(() => obterConteudo(page)).toContain('digitado');
    }

    for (const [nome, acao] of [
        ['botão Novo', (page) => page.locator('#novo').click()],
        ['botão + das abas', (page) => page.locator('#nova-aba').click()],
        ['Ctrl+Alt+N', (page) => page.keyboard.press('Control+Alt+N')]
    ]) {
        test(`arquivo novo pelo ${nome} no modo Visual já aceita digitação`, async ({ page }) => {
            await abrirVisual(page, '# Primeiro');
            await acao(page);
            await expect(page.locator('.aba')).toHaveCount(2);
            await digitarSemClicar(page);
            expect(await obterConteudo(page)).toBe('digitado');
        });
    }

    test('clicar no botão Visual já deixa digitar', async ({ page }) => {
        await abrirEditor(page);
        await page.locator('#linguagem').selectOption('markdown');
        await definirConteudo(page, 'Oi');
        await page.locator('[data-modo="visual"]').click();
        await digitarSemClicar(page);
    });

    test('trocar de aba no modo Visual já deixa digitar', async ({ page }) => {
        await abrirVisual(page, 'Primeiro');
        await page.locator('#nova-aba').click();
        await expect(page.locator('.aba')).toHaveCount(2);
        await page.locator('.aba-nome').first().click();
        await expect(editorVisual(page)).toContainText('Primeiro');
        await digitarSemClicar(page);
    });

    test('fechar uma aba no modo Visual já deixa digitar na que ficou', async ({ page }) => {
        await abrirVisual(page, 'Primeiro');
        await page.locator('#nova-aba').click();
        await expect(page.locator('.aba')).toHaveCount(2);
        await page.locator('.aba').nth(1).getByRole('button', { name: /^Fechar/ }).click();
        await expect(page.locator('.aba')).toHaveCount(1);
        await expect(editorVisual(page)).toContainText('Primeiro');
        await digitarSemClicar(page);
    });

    test('mudar a linguagem para Markdown com o modo Visual escolhido já deixa digitar', async ({ page }) => {
        await abrirVisual(page, 'Primeiro');
        await novaAba(page, 'javascript');
        await expect(page.locator('#container')).toBeVisible();
        await page.locator('#linguagem').selectOption('markdown');
        await digitarSemClicar(page);
    });

    test('recarregar a página no modo Visual já deixa digitar', async ({ page }) => {
        await abrirVisual(page, 'Primeiro');
        await recarregar(page);
        await digitarSemClicar(page);
    });

    test('voltar da tela de atalhos no modo Visual já deixa digitar', async ({ page }) => {
        await abrirVisual(page, 'Primeiro');
        await page.locator('#trilho-atalhos').click();
        await page.locator('#voltar-editor-markdown').click();
        await digitarSemClicar(page);
    });

    test('voltar do Visual para o modo Editor já deixa digitar (comparação: o Monaco recebe o foco)', async ({ page }) => {
        await abrirVisual(page, 'Primeiro');
        await page.locator('[data-modo="editor"]').click();
        await page.keyboard.type('digitado');
        await expect.poll(() => obterConteudo(page)).toContain('digitado');
    });
});

// Listas criadas no Visual saem no Markdown padrão, sem marcações próprias.
test.describe('Modo Visual: listas no Markdown padrão', () => {
    // Digita com intervalo de gente, não de robô: o Milkdown precisa de alguns milissegundos
    // depois de transformar o bloco (Tab, "1. ") para posicionar o cursor.
    const digitar = (page, texto) => page.keyboard.type(texto, { delay: 50 });

    async function noFimDoPrimeiroParagrafo(page, conteudo) {
        const erros = await abrirVisual(page, conteudo);
        await editorVisual(page).locator('p').first().click();
        await page.keyboard.press('End');
        return erros;
    }

    test('lista com marcadores digitada sai como "- item"', async ({ page }) => {
        await noFimDoPrimeiroParagrafo(page, 'Início');
        await page.keyboard.press('Enter');
        await digitar(page, '- um');
        await page.keyboard.press('Enter');
        await digitar(page, 'dois');
        await expect.poll(() => textoNormalizado(page)).toBe('Início\n\n- um\n- dois');
    });

    test('sublista criada com Tab fica colada ao item, sem linha em branco', async ({ page }) => {
        await noFimDoPrimeiroParagrafo(page, 'Início');
        await page.keyboard.press('Enter');
        await digitar(page, '- um');
        await page.keyboard.press('Enter');
        await page.keyboard.press('Tab');
        // Teclas logo depois do Tab, antes de a sublista existir, saem embaralhadas no Milkdown
        // (limitação conhecida, só acontece abaixo de ~20 ms). Num computador lento, espera a sublista.
        await expect(editorVisual(page).locator('li li')).toHaveCount(1);
        await digitar(page, 'sub');
        await expect.poll(() => textoNormalizado(page)).toBe('Início\n\n- um\n  - sub');
    });

    test('lista numerada digitada sai como "1. item"', async ({ page }) => {
        await noFimDoPrimeiroParagrafo(page, 'Início');
        await page.keyboard.press('Enter');
        await digitar(page, '1. um');
        await page.keyboard.press('Enter');
        await digitar(page, 'dois');
        await expect.poll(() => textoNormalizado(page)).toBe('Início\n\n1. um\n2. dois');
    });

    test('lista de tarefas digitada sai como "- [ ] item"', async ({ page }) => {
        await noFimDoPrimeiroParagrafo(page, 'Início');
        await page.keyboard.press('Enter');
        await digitar(page, '- [ ] tarefa');
        await expect.poll(() => textoNormalizado(page)).toBe('Início\n\n- [ ] tarefa');
    });

    test('Enter num item vazio sai da lista e a linha vazia fica marcada com <br />, como no Typora', async ({ page }) => {
        await noFimDoPrimeiroParagrafo(page, 'Início');
        await page.keyboard.press('Enter');
        await digitar(page, '- um');
        await page.keyboard.press('Enter');
        await page.keyboard.press('Enter');
        await expect.poll(() => textoNormalizado(page)).toBe('Início\n\n- um\n\n<br />');
    });

    // Listas que já estão no arquivo continuam iguais depois de editar outro trecho.
    for (const [nome, lista] of [
        ['compacta', '- um\n- dois'],
        ['espaçada', '- um\n\n- dois'],
        ['com sublista', '- um\n  - sub um\n  - sub dois\n- dois'],
        ['numerada com sublista', '1. um\n   1. sub\n2. dois'],
        ['numerada começando em 3', '3. três\n4. quatro'],
        ['numerada com 1)', '1) um\n2) dois'],
        ['de tarefas', '- [ ] a fazer\n- [x] feito'],
        ['com *', '* um\n* dois'],
        ['com parágrafo dentro do item', '- um\n\n  continuação\n- dois']
    ]) {
        test(`lista ${nome} do arquivo continua igual depois de editar`, async ({ page }) => {
            await noFimDoPrimeiroParagrafo(page, `Início\n\n${lista}\n`);
            await digitar(page, '!');
            await expect.poll(() => textoNormalizado(page)).toBe(`Início!\n\n${lista}\n`);
        });
    }
});

// Como no modo Editor: (, [ e { já fecham sozinhos.
test.describe('Modo Visual: fechamento automático', () => {
    const textoDoParagrafo = (page) => editorVisual(page).locator('p').first().textContent();

    async function noFim(page, conteudo) {
        await abrirVisual(page, conteudo);
        await editorVisual(page).locator('p').first().click();
        await page.keyboard.press('End');
    }

    for (const [abre, fecha] of [['(', ')'], ['[', ']'], ['{', '}']]) {
        test(`digitar ${abre} insere ${fecha} e o texto fica dentro`, async ({ page }) => {
            await noFim(page, 'texto');
            await page.keyboard.type(` ${abre}dentro`, { delay: 30 });
            await expect.poll(() => textoDoParagrafo(page)).toBe(`texto ${abre}dentro${fecha}`);
        });

        test(`digitar ${fecha} em cima do fechamento automático não duplica`, async ({ page }) => {
            await noFim(page, 'texto');
            await page.keyboard.type(` ${abre}a${fecha} fim`, { delay: 30 });
            await expect.poll(() => textoDoParagrafo(page)).toBe(`texto ${abre}a${fecha} fim`);
        });
    }

    test('Backspace entre um par vazio apaga os dois', async ({ page }) => {
        await noFim(page, 'texto');
        await page.keyboard.type(' (', { delay: 30 });
        await expect.poll(() => textoDoParagrafo(page)).toBe('texto ()');
        await page.keyboard.press('Backspace');
        await expect.poll(() => textoDoParagrafo(page)).toBe('texto ');
    });

    test('colado numa palavra não fecha, para não sobrar um parêntese', async ({ page }) => {
        await abrirVisual(page, 'palavra');
        await editorVisual(page).locator('p').first().click();
        await page.keyboard.press('Home');
        await page.keyboard.type('(', { delay: 30 });
        await expect.poll(() => textoDoParagrafo(page)).toBe('(palavra');
    });

    test('no Markdown, o texto entre parênteses sai normal', async ({ page }) => {
        await noFim(page, 'texto');
        await page.keyboard.type(' (nota)', { delay: 30 });
        await expect.poll(() => textoNormalizado(page)).toBe('texto (nota)');
    });
});

// Documento novo já começa em Markdown, no modo Visual.
test.describe('Documento novo', () => {
    async function conferirMarkdownVisual(page) {
        await expect(page.locator('.aba.ativa .aba-linguagem')).toHaveText('MD');
        await expect(page.locator('#linguagem')).toHaveValue('markdown');
        await expect(page.locator('[data-modo="visual"]')).toHaveAttribute('aria-pressed', 'true');
        await expect(editorVisual(page)).toBeVisible({ timeout: 30000 });
        await page.keyboard.type('# Título', { delay: 30 });
        await expect.poll(() => textoNormalizado(page)).toBe('# Título');
    }

    for (const [nome, acao] of [
        ['botão Novo', (page) => page.locator('#novo').click()],
        ['botão + das abas', (page) => page.locator('#nova-aba').click()],
        ['Ctrl+Alt+N', (page) => page.keyboard.press('Control+Alt+N')]
    ]) {
        test(`pelo ${nome}, mesmo vindo de uma aba JavaScript no modo Editor`, async ({ page }) => {
            await abrirEditor(page);
            await page.locator('#linguagem').selectOption('javascript');
            await expect(page.locator('#container')).toBeVisible();
            await acao(page);
            await expect(page.locator('.aba')).toHaveCount(2);
            await conferirMarkdownVisual(page);
        });
    }

    test('fechar a última aba abre um documento novo em Markdown, no modo Visual', async ({ page }) => {
        await abrirEditor(page);
        await page.locator('.aba').first().getByRole('button', { name: /^Fechar/ }).click();
        await expect(page.locator('.aba')).toHaveCount(1);
        await conferirMarkdownVisual(page);
    });

    test('a aba que já existia continua com a linguagem dela', async ({ page }) => {
        await abrirEditor(page);
        await page.locator('#linguagem').selectOption('javascript');
        await page.locator('#novo').click();
        await expect(editorVisual(page)).toBeVisible({ timeout: 30000 });
        await page.locator('.aba-nome').first().click();
        await expect(page.locator('.aba.ativa .aba-linguagem')).toHaveText('JS');
        await expect(page.locator('#container')).toBeVisible();
    });
});

test('linha horizontal do modo Visual é sólida e bem visível', async ({ page }) => {
    await abrirVisual(page, 'acima\n\n---\n\nabaixo\n');
    const linha = editorVisual(page).locator('hr');
    await expect(linha).toBeVisible();
    const estilo = await linha.evaluate((elemento) => {
        const calculado = getComputedStyle(elemento);
        return {
            cor: calculado.backgroundColor,
            espessura: parseFloat(calculado.height) - parseFloat(calculado.paddingTop) - parseFloat(calculado.paddingBottom)
        };
    });
    // Cor sem transparência (antes era 20% de opacidade) e pelo menos 2 px de espessura.
    expect(estilo.cor).toMatch(/^rgb\(/);
    expect(estilo.espessura).toBeGreaterThanOrEqual(2);
});
