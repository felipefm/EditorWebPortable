// Versão homelab do Editor Portable: serve o editor (a pasta public/) e uma API que lê e grava os
// arquivos de uma pasta do servidor. Usa só módulos que já vêm com o Node; não há o que instalar.
//
// Variáveis de ambiente:
//   PASTA      pasta com os arquivos que aparecem no editor (padrão: ./arquivos)
//   PORTA      porta HTTP (padrão: 8887; 0 escolhe uma livre)
//   NOME       nome mostrado no topo do painel de pastas (padrão: o nome da PASTA)
//   SENHA      se preenchida, o editor pede essa senha antes de mostrar os arquivos (padrão: sem senha)
//   ENDERECOS  nomes extras pelos quais o servidor é acessado, separados por vírgula. IPs, localhost
//              e nomes de rede local (sem ponto, .lan, .local, .home.arpa, .internal) já são aceitos.
//
// Excluir não apaga: move para PASTA/.editor/lixeira, que é limpa depois de 30 dias. Gravar por
// cima guarda antes uma cópia em PASTA/.editor/copias (as 10 mais recentes de cada arquivo).
'use strict';
const http = require('http');
const net = require('net');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const crypto = require('crypto');

const raizSite = path.resolve(__dirname, '..', 'public');
const pastaInterna = '.editor';
const diasLixeira = 30;
const copiasPorArquivo = 10;
const limiteCorpo = 10 * 1024 * 1024;
const nomeCookie = 'editor_sessao';
const tipos = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf',
    '.txt': 'text/plain; charset=utf-8'
};

const config = {
    pasta: path.resolve(process.env.PASTA || 'arquivos'),
    porta: process.env.PORTA === undefined || process.env.PORTA === '' ? 8887 : Number(process.env.PORTA),
    nome: process.env.NOME || '',
    senha: process.env.SENHA || '',
    enderecos: (process.env.ENDERECOS || '').split(',').map((nome) => nome.trim().toLowerCase()).filter(Boolean)
};
config.nome = config.nome || path.basename(config.pasta);
const sessoes = new Set();

function erroHttp(status, mensagem) {
    const erro = new Error(mensagem);
    erro.status = status;
    return erro;
}

function responderJson(resposta, status, dados, cabecalhos) {
    resposta.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cabecalhos });
    resposta.end(JSON.stringify(dados));
}

// Contra "DNS rebinding": um site de fora que aponta o próprio nome para o IP do servidor. O
// navegador manda o nome do site no cabeçalho Host, e ele não está na lista.
function enderecoPermitido(host) {
    if (!host) {
        return false;
    }
    let nome = host.toLowerCase();
    nome = nome.startsWith('[') ? nome.slice(1, nome.indexOf(']')) : nome.replace(/:\d+$/, '');
    return net.isIP(nome) !== 0
        || nome === 'localhost'
        || !nome.includes('.')
        || /\.(lan|local|home\.arpa|internal|localhost)$/.test(nome)
        || config.enderecos.includes(nome);
}

// Contra outro site aberto no navegador mandar gravações escondidas (CSRF): toda alteração tem de
// vir da própria página do editor.
function origemPermitida(requisicao) {
    const origem = requisicao.headers.origin;
    if (!origem) {
        return false;
    }
    try {
        return new URL(origem).host === requisicao.headers.host;
    } catch (erro) {
        return false;
    }
}

function lerCookie(requisicao, nome) {
    const cookies = (requisicao.headers.cookie || '').split(';').map((parte) => parte.trim().split('='));
    const encontrado = cookies.find(([chave]) => chave === nome);
    return encontrado ? encontrado.slice(1).join('=') : '';
}

function autenticado(requisicao) {
    return !config.senha || sessoes.has(lerCookie(requisicao, nomeCookie));
}

function senhaCorreta(tentativa) {
    const resumo = (texto) => crypto.createHash('sha256').update(String(texto)).digest();
    return crypto.timingSafeEqual(resumo(tentativa), resumo(config.senha));
}

function lerCorpo(requisicao) {
    return new Promise((resolver, rejeitar) => {
        const partes = [];
        let tamanho = 0;
        requisicao.on('data', (parte) => {
            tamanho += parte.length;
            if (tamanho > limiteCorpo) {
                rejeitar(erroHttp(413, 'Arquivo grande demais (limite de 10 MB).'));
                requisicao.destroy();
                return;
            }
            partes.push(parte);
        });
        requisicao.on('end', () => resolver(Buffer.concat(partes)));
        requisicao.on('error', rejeitar);
    });
}

async function lerJson(requisicao) {
    try {
        return JSON.parse((await lerCorpo(requisicao)).toString('utf8') || '{}');
    } catch (erro) {
        throw erro.status ? erro : erroHttp(400, 'Pedido inválido.');
    }
}

// Transforma o caminho relativo pedido pelo editor ("docs/notas.md") num caminho dentro da pasta.
// Recusa "..", caminhos absolutos, a pasta .editor e links que levam para fora da pasta.
async function resolverCaminho(relativo, permitirRaiz) {
    if (typeof relativo !== 'string' || /[\0\\:]/.test(relativo)) {
        throw erroHttp(400, 'Caminho inválido.');
    }
    const partes = relativo.split('/').filter((parte) => parte !== '');
    if (partes.some((parte) => parte === '.' || parte === '..')) {
        throw erroHttp(400, 'Caminho inválido.');
    }
    if (!partes.length && !permitirRaiz) {
        throw erroHttp(400, 'Caminho inválido.');
    }
    if (partes[0] && partes[0].toLowerCase() === pastaInterna) {
        throw erroHttp(403, 'A pasta .editor é reservada para a lixeira e as cópias.');
    }
    const absoluto = path.join(config.pasta, ...partes);
    await conferirDentroDaPasta(absoluto);
    return { absoluto, relativo: partes.join('/'), nome: partes[partes.length - 1] || config.nome };
}

async function conferirDentroDaPasta(absoluto) {
    const raizReal = await fsp.realpath(config.pasta);
    let atual = absoluto;
    for (;;) {
        try {
            const real = await fsp.realpath(atual);
            if (real !== raizReal && !real.startsWith(raizReal + path.sep)) {
                throw erroHttp(403, 'Esse caminho leva para fora da pasta liberada.');
            }
            return;
        } catch (erro) {
            if (erro.status || erro.code !== 'ENOENT') {
                throw erro;
            }
            const pai = path.dirname(atual);
            if (pai === atual) {
                throw erro;
            }
            atual = pai;
        }
    }
}

function etagDe(conteudo) {
    return `"${crypto.createHash('sha1').update(conteudo).digest('hex')}"`;
}

// Nome com data e hora para cópias e exclusões. O contador desempata as feitas no mesmo milissegundo.
let contador = 0;
function carimbo(data = new Date()) {
    contador = (contador + 1) % 1000000;
    return data.toISOString().replace(/[-:]/g, '').replace('T', '-').replace(/\..*/, '')
        + `-${String(data.getMilliseconds()).padStart(3, '0')}-${String(contador).padStart(6, '0')}`;
}

async function tipoDoItem(absoluto) {
    try {
        const info = await fsp.stat(absoluto);
        return info.isDirectory() ? 'directory' : (info.isFile() ? 'file' : undefined);
    } catch (erro) {
        if (erro.code === 'ENOENT') {
            return undefined;
        }
        throw erro;
    }
}

async function listar(caminho) {
    const alvo = await resolverCaminho(caminho, true);
    const entradas = await fsp.readdir(alvo.absoluto, { withFileTypes: true });
    const itens = [];
    for (const entrada of entradas) {
        if (!alvo.relativo && entrada.name.toLowerCase() === pastaInterna) {
            continue;
        }
        let tipo = entrada.isDirectory() ? 'directory' : (entrada.isFile() ? 'file' : undefined);
        if (entrada.isSymbolicLink()) {
            tipo = await tipoDoItem(path.join(alvo.absoluto, entrada.name)).catch(() => undefined);
        }
        if (tipo) {
            itens.push({ nome: entrada.name, tipo });
        }
    }
    return itens;
}

// Antes de gravar por cima, guarda o conteúdo anterior. Ficam só as cópias mais recentes.
async function guardarCopia(alvo, conteudoAnterior) {
    const pastaCopias = path.join(config.pasta, pastaInterna, 'copias', ...alvo.relativo.split('/'));
    await fsp.mkdir(pastaCopias, { recursive: true });
    await fsp.writeFile(path.join(pastaCopias, `${carimbo()}-${alvo.nome}`), conteudoAnterior);
    const copias = (await fsp.readdir(pastaCopias)).sort();
    for (const antiga of copias.slice(0, Math.max(0, copias.length - copiasPorArquivo))) {
        await fsp.rm(path.join(pastaCopias, antiga), { force: true });
    }
}

async function gravar(requisicao, caminho) {
    const alvo = await resolverCaminho(caminho);
    const conteudo = await lerCorpo(requisicao);
    const tipo = await tipoDoItem(alvo.absoluto);
    if (tipo === 'directory') {
        throw erroHttp(409, `"${alvo.nome}" é uma pasta.`);
    }
    if ((await tipoDoItem(path.dirname(alvo.absoluto))) !== 'directory') {
        throw erroHttp(404, 'A pasta de destino não existe.');
    }
    const condicao = requisicao.headers['if-match'];
    const soSeNovo = requisicao.headers['if-none-match'] === '*';
    let anterior;
    if (tipo === 'file') {
        anterior = await fsp.readFile(alvo.absoluto);
        if (soSeNovo) {
            throw erroHttp(412, `Já existe "${alvo.nome}" nesta pasta.`);
        }
        if (condicao && condicao !== etagDe(anterior)) {
            throw erroHttp(412, `"${alvo.nome}" foi alterado em outro lugar depois que foi aberto.`);
        }
        await guardarCopia(alvo, anterior);
    } else if (condicao) {
        throw erroHttp(412, `"${alvo.nome}" não existe mais.`);
    }
    await fsp.writeFile(alvo.absoluto, conteudo, soSeNovo ? { flag: 'wx' } : undefined);
    return { status: anterior ? 200 : 201, etag: etagDe(conteudo) };
}

async function criarPasta(caminho) {
    const alvo = await resolverCaminho(caminho);
    try {
        await fsp.mkdir(alvo.absoluto);
    } catch (erro) {
        if (erro.code === 'EEXIST') {
            throw erroHttp(409, `Já existe "${alvo.nome}" nesta pasta.`);
        }
        throw erro;
    }
}

async function mover(de, para) {
    const origem = await resolverCaminho(de);
    const destino = await resolverCaminho(para);
    if (destino.relativo.toLowerCase().startsWith(`${origem.relativo.toLowerCase()}/`)) {
        throw erroHttp(400, 'Uma pasta não pode ir para dentro dela mesma.');
    }
    if (!(await tipoDoItem(origem.absoluto))) {
        throw erroHttp(404, `"${origem.nome}" não existe mais.`);
    }
    // Trocar só maiúsculas e minúsculas é permitido, mesmo no Windows, onde o "destino" já existe.
    const soMaiusculas = origem.relativo.toLowerCase() === destino.relativo.toLowerCase();
    if (!soMaiusculas && await tipoDoItem(destino.absoluto)) {
        throw erroHttp(409, `Já existe "${destino.nome}" nesta pasta.`);
    }
    await fsp.rename(origem.absoluto, destino.absoluto);
}

async function moverParaLixeira(caminho) {
    const alvo = await resolverCaminho(caminho);
    if (!(await tipoDoItem(alvo.absoluto))) {
        throw erroHttp(404, `"${alvo.nome}" não existe mais.`);
    }
    const destino = path.join(config.pasta, pastaInterna, 'lixeira', carimbo(), ...alvo.relativo.split('/'));
    await fsp.mkdir(path.dirname(destino), { recursive: true });
    await fsp.rename(alvo.absoluto, destino);
    return path.relative(config.pasta, destino).split(path.sep).join('/');
}

async function limparLixeira() {
    const pastaLixeira = path.join(config.pasta, pastaInterna, 'lixeira');
    let entradas;
    try {
        entradas = await fsp.readdir(pastaLixeira);
    } catch (erro) {
        return;
    }
    const limite = Date.now() - diasLixeira * 24 * 60 * 60 * 1000;
    for (const entrada of entradas) {
        const caminho = path.join(pastaLixeira, entrada);
        const info = await fsp.stat(caminho).catch(() => undefined);
        if (info && info.mtimeMs < limite) {
            await fsp.rm(caminho, { recursive: true, force: true });
        }
    }
}

async function tratarApi(requisicao, resposta, url) {
    const rota = url.pathname;
    const metodo = requisicao.method;
    const caminho = url.searchParams.get('caminho') || '';
    if (metodo !== 'GET' && metodo !== 'HEAD' && !origemPermitida(requisicao)) {
        throw erroHttp(403, 'Pedido recusado: não veio da página do editor.');
    }
    if (rota === '/api/estado' && metodo === 'GET') {
        responderJson(resposta, 200, { versao: 1, nome: config.nome, senha: Boolean(config.senha), autenticado: autenticado(requisicao) });
        return;
    }
    if (rota === '/api/entrar' && metodo === 'POST') {
        const { senha } = await lerJson(requisicao);
        if (!config.senha || senhaCorreta(senha || '')) {
            const token = crypto.randomBytes(32).toString('hex');
            sessoes.add(token);
            responderJson(resposta, 200, { ok: true }, {
                'Set-Cookie': `${nomeCookie}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=31536000`
            });
            return;
        }
        // Uma pausa a cada senha errada deixa tentativas em série muito lentas.
        await new Promise((resolver) => setTimeout(resolver, 1000));
        throw erroHttp(401, 'Senha incorreta.');
    }
    if (!autenticado(requisicao)) {
        throw erroHttp(401, 'É preciso entrar com a senha.');
    }
    if (rota === '/api/listar' && metodo === 'GET') {
        responderJson(resposta, 200, { itens: await listar(caminho) });
    } else if (rota === '/api/info' && metodo === 'GET') {
        const alvo = await resolverCaminho(caminho, true);
        const tipo = await tipoDoItem(alvo.absoluto);
        if (!tipo) {
            throw erroHttp(404, `"${alvo.nome}" não existe.`);
        }
        responderJson(resposta, 200, { tipo });
    } else if (rota === '/api/arquivo' && metodo === 'GET') {
        const alvo = await resolverCaminho(caminho);
        if ((await tipoDoItem(alvo.absoluto)) !== 'file') {
            throw erroHttp(404, `"${alvo.nome}" não existe.`);
        }
        const conteudo = await fsp.readFile(alvo.absoluto);
        resposta.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'X-Content-Type-Options': 'nosniff',
            'Cache-Control': 'no-store',
            ETag: etagDe(conteudo)
        });
        resposta.end(conteudo);
    } else if (rota === '/api/arquivo' && metodo === 'PUT') {
        const resultado = await gravar(requisicao, caminho);
        responderJson(resposta, resultado.status, { etag: resultado.etag }, { ETag: resultado.etag });
    } else if (rota === '/api/pasta' && metodo === 'POST') {
        await criarPasta(caminho);
        responderJson(resposta, 201, { ok: true });
    } else if (rota === '/api/mover' && metodo === 'POST') {
        const { de, para } = await lerJson(requisicao);
        await mover(de, para);
        responderJson(resposta, 200, { ok: true });
    } else if (rota === '/api/item' && metodo === 'DELETE') {
        responderJson(resposta, 200, { lixeira: await moverParaLixeira(caminho) });
    } else {
        throw erroHttp(404, 'Rota inexistente.');
    }
}

async function servirArquivoDoSite(resposta, url) {
    const relativo = decodeURIComponent(url.pathname);
    const arquivo = path.join(raizSite, relativo === '/' ? 'index.html' : relativo);
    if (!arquivo.startsWith(raizSite + path.sep)) {
        throw erroHttp(404, 'Não encontrado.');
    }
    let conteudo;
    try {
        conteudo = await fsp.readFile(arquivo);
    } catch (erro) {
        throw erroHttp(404, 'Não encontrado.');
    }
    resposta.writeHead(200, { 'Content-Type': tipos[path.extname(arquivo)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    resposta.end(conteudo);
}

const codigosDoSistema = {
    ENOENT: [404, 'O item não existe mais.'],
    EEXIST: [409, 'Já existe um item com esse nome.'],
    ENOTEMPTY: [409, 'Já existe um item com esse nome.'],
    ENOTDIR: [400, 'Caminho inválido.'],
    EISDIR: [409, 'Esse item é uma pasta.'],
    EACCES: [403, 'O servidor não tem permissão para mexer nesse item. Confira o dono da pasta (PUID/PGID).'],
    EPERM: [403, 'O servidor não tem permissão para mexer nesse item. Confira o dono da pasta (PUID/PGID).'],
    EBUSY: [409, 'O item está em uso por outro programa.']
};

const servidor = http.createServer(async (requisicao, resposta) => {
    try {
        if (!enderecoPermitido(requisicao.headers.host)) {
            throw erroHttp(403, 'Endereço não permitido. Inclua-o em ENDERECOS.');
        }
        const url = new URL(requisicao.url, 'http://servidor');
        if (url.pathname.startsWith('/api/')) {
            await tratarApi(requisicao, resposta, url);
        } else if (requisicao.method === 'GET' || requisicao.method === 'HEAD') {
            await servirArquivoDoSite(resposta, url);
        } else {
            throw erroHttp(405, 'Método não permitido.');
        }
    } catch (erro) {
        const [status, mensagem] = erro.status ? [erro.status, erro.message] : (codigosDoSistema[erro.code] || [500, 'Erro no servidor.']);
        if (status === 500) {
            console.error(erro);
        }
        if (!resposta.headersSent) {
            responderJson(resposta, status, { erro: mensagem });
        } else {
            resposta.end();
        }
    }
});

fs.mkdirSync(config.pasta, { recursive: true });
limparLixeira();
setInterval(limparLixeira, 6 * 60 * 60 * 1000).unref();
servidor.listen(config.porta, () => {
    console.log(`Editor Portable em http://localhost:${servidor.address().port} (pasta: ${config.pasta}${config.senha ? ', com senha' : ''})`);
});
