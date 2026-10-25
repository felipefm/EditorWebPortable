// Área: servidor da versão homelab (servidor/servidor.js), testado direto pela API, sem abrir o
// editor. Cobre o que protege os arquivos: caminhos fora da pasta, pedidos de outros sites, endereço,
// senha, tamanho, conflito, lixeira e cópias. Roda uma vez só (projeto desktop): não depende do navegador.
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { test, expect } = require('@playwright/test');
const { iniciarServidor, criarNoDisco, lerDoDisco } = require('./homelab');

test.skip(({ browserName }) => browserName !== 'chromium', 'A API não depende do navegador; roda uma vez.');

let servidor;
test.afterEach(async () => {
    if (servidor) {
        await servidor.parar();
        servidor = undefined;
    }
});

// Pedido com os cabeçalhos que a página do editor manda (Origin igual ao endereço do servidor).
function daPagina(cabecalhos) {
    return { Origin: servidor.endereco, ...cabecalhos };
}

function url(rota, caminho) {
    return `${servidor.endereco}/api/${rota}${caminho === undefined ? '' : `?caminho=${encodeURIComponent(caminho)}`}`;
}

// Pedido HTTP cru, para mandar um cabeçalho Host diferente do endereço.
function pedirComHost(host, rota) {
    const { port } = new URL(servidor.endereco);
    return new Promise((resolver, rejeitar) => {
        http.get({ host: '127.0.0.1', port, path: rota, headers: { Host: host } }, (resposta) => {
            resposta.resume();
            resposta.on('end', () => resolver(resposta.statusCode));
        }).on('error', rejeitar);
    });
}

test.describe('Servidor homelab', () => {
    test('serve o editor e diz que é a versão homelab', async ({ request }) => {
        servidor = await iniciarServidor();
        const pagina = await request.get(`${servidor.endereco}/`);
        expect(pagina.status()).toBe(200);
        expect(await pagina.text()).toContain('Editor Portable');
        expect((await request.get(`${servidor.endereco}/editor.js`)).headers()['content-type']).toContain('javascript');
        expect((await request.get(`${servidor.endereco}/nao-existe.js`)).status()).toBe(404);
        // Arquivos fora de public/ não são servidos.
        expect((await request.get(`${servidor.endereco}/..%2fservidor%2fservidor.js`)).status()).toBe(404);
        const estado = await (await request.get(url('estado'))).json();
        expect(estado).toEqual({ versao: 1, nome: 'projeto', senha: false, autenticado: true });
    });

    test('lista, lê e grava, com a versão do arquivo para evitar conflitos', async ({ request }) => {
        servidor = await iniciarServidor();
        criarNoDisco(servidor.pasta, { 'a.md': 'um', 'docs/b.md': 'b' });
        const lista = await (await request.get(url('listar', ''))).json();
        expect(lista.itens.sort((a, b) => a.nome.localeCompare(b.nome))).toEqual([{ nome: 'a.md', tipo: 'file' }, { nome: 'docs', tipo: 'directory' }]);
        const leitura = await request.get(url('arquivo', 'a.md'));
        expect(await leitura.text()).toBe('um');
        const versao = leitura.headers().etag;

        const certa = await request.put(url('arquivo', 'a.md'), { headers: daPagina({ 'If-Match': versao }), data: 'dois' });
        expect(certa.status()).toBe(200);
        // Gravar de novo com a versão antiga dá conflito (412) e não muda nada.
        const antiga = await request.put(url('arquivo', 'a.md'), { headers: daPagina({ 'If-Match': versao }), data: 'três' });
        expect(antiga.status()).toBe(412);
        expect(lerDoDisco(servidor.pasta)['a.md']).toBe('dois');
        // "Só se for novo" não grava por cima de um arquivo que existe.
        expect((await request.put(url('arquivo', 'a.md'), { headers: daPagina({ 'If-None-Match': '*' }), data: 'x' })).status()).toBe(412);
        expect((await request.put(url('arquivo', 'docs/c.md'), { headers: daPagina({ 'If-None-Match': '*' }), data: 'c' })).status()).toBe(201);
        expect((await request.put(url('arquivo', 'nao/existe.md'), { headers: daPagina(), data: 'x' })).status()).toBe(404);
        expect((await request.put(url('arquivo', 'docs'), { headers: daPagina(), data: 'x' })).status()).toBe(409);
        expect(lerDoDisco(servidor.pasta)).toEqual({ 'a.md': 'dois', 'docs/': null, 'docs/b.md': 'b', 'docs/c.md': 'c' });
    });

    test('caminhos para fora da pasta e a pasta .editor são recusados', async ({ request }) => {
        servidor = await iniciarServidor();
        fs.writeFileSync(path.join(servidor.pasta, '..', 'segredo.txt'), 'não pode');
        for (const caminho of ['../segredo.txt', 'docs/../../segredo.txt', '..\\segredo.txt', 'C:/Windows/win.ini', 'a\0b']) {
            expect((await request.get(url('arquivo', caminho))).status(), caminho).toBe(400);
            expect((await request.put(url('arquivo', caminho), { headers: daPagina(), data: 'x' })).status(), caminho).toBe(400);
        }
        expect((await request.get(url('listar', '..'))).status()).toBe(400);
        for (const caminho of ['.editor', '.editor/lixeira', '.EDITOR/copias']) {
            expect((await request.get(url('listar', caminho))).status(), caminho).toBe(403);
            expect((await request.delete(url('item', caminho), { headers: daPagina() })).status(), caminho).toBe(403);
        }
        expect(fs.readFileSync(path.join(servidor.pasta, '..', 'segredo.txt'), 'utf8')).toBe('não pode');
    });

    test('um atalho (link) que leva para fora da pasta é recusado', async ({ request }) => {
        const fora = fs.mkdtempSync(path.join(os.tmpdir(), 'editor-fora-'));
        fs.writeFileSync(path.join(fora, 'segredo.txt'), 'não pode');
        servidor = await iniciarServidor({
            antes: (pasta) => fs.symlinkSync(fora, path.join(pasta, 'atalho'), 'junction')
        });
        try {
            expect((await request.get(url('listar', 'atalho'))).status()).toBe(403);
            expect((await request.get(url('arquivo', 'atalho/segredo.txt'))).status()).toBe(403);
            expect((await request.put(url('arquivo', 'atalho/novo.txt'), { headers: daPagina(), data: 'x' })).status()).toBe(403);
            expect((await request.delete(url('item', 'atalho/segredo.txt'), { headers: daPagina() })).status()).toBe(403);
            expect(fs.readdirSync(fora)).toEqual(['segredo.txt']);
        } finally {
            fs.rmSync(fora, { recursive: true, force: true });
        }
    });

    test('alterações sem a origem da página do editor são recusadas', async ({ request }) => {
        servidor = await iniciarServidor();
        criarNoDisco(servidor.pasta, { 'a.md': 'um' });
        const pedidos = [
            (cabecalhos) => request.put(url('arquivo', 'a.md'), { headers: cabecalhos, data: 'mudou' }),
            (cabecalhos) => request.delete(url('item', 'a.md'), { headers: cabecalhos }),
            (cabecalhos) => request.post(url('pasta', 'nova'), { headers: cabecalhos }),
            (cabecalhos) => request.post(url('mover'), { headers: cabecalhos, data: { de: 'a.md', para: 'b.md' } })
        ];
        for (const pedir of pedidos) {
            expect((await pedir({})).status()).toBe(403);
            expect((await pedir({ Origin: 'http://site-malicioso.com' })).status()).toBe(403);
        }
        expect(lerDoDisco(servidor.pasta)).toEqual({ 'a.md': 'um' });
    });

    test('só responde pelo IP, localhost, nomes da rede local ou os de ENDERECOS', async () => {
        servidor = await iniciarServidor({ enderecos: 'editor.minha-casa.com' });
        const porta = new URL(servidor.endereco).port;
        for (const host of [`127.0.0.1:${porta}`, `localhost:${porta}`, `192.168.0.10:${porta}`, `[::1]:${porta}`, 'homelab:8080', 'servidor.lan', 'editor.minha-casa.com']) {
            expect(await pedirComHost(host, '/api/estado'), host).toBe(200);
        }
        // Um site de fora que aponta o nome dele para o IP do servidor (DNS rebinding).
        for (const host of ['site-malicioso.com', `site-malicioso.com:${porta}`, 'outro.minha-casa.com']) {
            expect(await pedirComHost(host, '/api/estado'), host).toBe(403);
            expect(await pedirComHost(host, '/'), host).toBe(403);
        }
    });

    test('arquivos maiores que 10 MB são recusados', async ({ request }) => {
        servidor = await iniciarServidor();
        const grande = Buffer.alloc(10 * 1024 * 1024 + 1, 'a');
        const resposta = await request.put(url('arquivo', 'grande.txt'), { headers: daPagina(), data: grande }).catch((erro) => erro);
        // O servidor responde 413 ou corta a conexão; nos dois casos, nada é gravado.
        if (resposta && typeof resposta.status === 'function') {
            expect(resposta.status()).toBe(413);
        }
        expect(lerDoDisco(servidor.pasta)).toEqual({});
    });

    test('criar pasta e renomear não sobrescrevem nada', async ({ request }) => {
        servidor = await iniciarServidor();
        criarNoDisco(servidor.pasta, { 'a.md': 'a', 'b.md': 'b', 'docs/c.md': 'c' });
        const mover = (de, para) => request.post(url('mover'), { headers: daPagina(), data: { de, para } });
        expect((await request.post(url('pasta', 'nova'), { headers: daPagina() })).status()).toBe(201);
        expect((await request.post(url('pasta', 'nova'), { headers: daPagina() })).status()).toBe(409);
        expect((await mover('a.md', 'b.md')).status()).toBe(409);
        expect((await mover('docs', 'docs/dentro')).status()).toBe(400);
        expect((await mover('sumiu.md', 'x.md')).status()).toBe(404);
        expect((await mover('a.md', 'A.md')).status()).toBe(200);
        expect((await mover('docs', 'manual')).status()).toBe(200);
        expect(lerDoDisco(servidor.pasta)).toEqual({ 'A.md': 'a', 'b.md': 'b', 'manual/': null, 'manual/c.md': 'c', 'nova/': null });
    });

    test('excluir move para a lixeira; gravar por cima guarda as 10 últimas cópias', async ({ request }) => {
        servidor = await iniciarServidor();
        criarNoDisco(servidor.pasta, { 'docs/a.md': 'versão 0' });
        for (let versao = 1; versao <= 12; versao += 1) {
            expect((await request.put(url('arquivo', 'docs/a.md'), { headers: daPagina(), data: `versão ${versao}` })).status()).toBe(200);
        }
        let tudo = lerDoDisco(servidor.pasta, true);
        const copias = Object.keys(tudo).filter((caminho) => caminho.startsWith('.editor/copias/docs/a.md/') && !caminho.endsWith('/')).sort();
        expect(copias).toHaveLength(10);
        expect(copias.map((caminho) => tudo[caminho])).toEqual(['versão 2', 'versão 3', 'versão 4', 'versão 5', 'versão 6', 'versão 7', 'versão 8', 'versão 9', 'versão 10', 'versão 11']);

        const exclusao = await request.delete(url('item', 'docs'), { headers: daPagina() });
        expect(exclusao.status()).toBe(200);
        const { lixeira } = await exclusao.json();
        expect(lixeira).toMatch(/^\.editor\/lixeira\/[^/]+\/docs$/);
        tudo = lerDoDisco(servidor.pasta, true);
        expect(tudo['docs/']).toBeUndefined();
        expect(tudo[`${lixeira}/a.md`]).toBe('versão 12');
        expect((await request.delete(url('item', 'docs'), { headers: daPagina() })).status()).toBe(404);
    });

    test('ao ligar, a lixeira apaga o que tem mais de 30 dias', async () => {
        servidor = await iniciarServidor({
            antes: (pasta) => {
                criarNoDisco(pasta, { '.editor/lixeira/antiga/velho.md': 'velho', '.editor/lixeira/recente/novo.md': 'novo' });
                const quarentaDias = (Date.now() - 40 * 24 * 60 * 60 * 1000) / 1000;
                fs.utimesSync(path.join(pasta, '.editor', 'lixeira', 'antiga'), quarentaDias, quarentaDias);
            }
        });
        // A limpeza roda enquanto o teste lê a pasta; uma leitura no meio da exclusão é repetida.
        const lixeira = () => {
            try {
                return Object.keys(lerDoDisco(servidor.pasta, true)).filter((caminho) => caminho.startsWith('.editor/lixeira/')).sort();
            } catch (erro) {
                return [];
            }
        };
        await expect.poll(lixeira).toEqual(['.editor/lixeira/', '.editor/lixeira/recente/', '.editor/lixeira/recente/novo.md']);
    });

    test('com senha: nada de arquivos antes de entrar; senha errada é recusada', async ({ request }) => {
        servidor = await iniciarServidor({ senha: 'segredo' });
        criarNoDisco(servidor.pasta, { 'a.md': 'um' });
        expect(await (await request.get(url('estado'))).json()).toMatchObject({ senha: true, autenticado: false });
        expect((await request.get(url('listar', ''))).status()).toBe(401);
        expect((await request.get(url('arquivo', 'a.md'))).status()).toBe(401);
        expect((await request.put(url('arquivo', 'a.md'), { headers: daPagina(), data: 'x' })).status()).toBe(401);
        expect((await request.post(url('entrar'), { headers: daPagina(), data: { senha: 'errada' } })).status()).toBe(401);
        // A página do editor também é servida sem senha; só os arquivos ficam protegidos.
        expect((await request.get(`${servidor.endereco}/`)).status()).toBe(200);

        const entrada = await request.post(url('entrar'), { headers: daPagina(), data: { senha: 'segredo' } });
        expect(entrada.status()).toBe(200);
        expect(entrada.headers()['set-cookie']).toMatch(/HttpOnly; SameSite=Strict/);
        // O "request" guarda o cookie, como o navegador.
        expect(await (await request.get(url('estado'))).json()).toMatchObject({ autenticado: true });
        expect(await (await request.get(url('arquivo', 'a.md'))).text()).toBe('um');
    });
});
