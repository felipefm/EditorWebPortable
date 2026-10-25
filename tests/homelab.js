// Liga a versão homelab (servidor/servidor.js) para um teste, com uma pasta temporária só dele.
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const arquivoServidor = path.resolve(__dirname, '..', 'servidor', 'servidor.js');

/**
 * opcoes.senha: liga a senha do servidor
 * opcoes.antes(pasta): roda antes de o servidor ligar (por exemplo, para criar uma lixeira antiga)
 * Devolve { endereco, pasta, parar }.
 */
async function iniciarServidor(opcoes = {}) {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'editor-homelab-'));
    const pasta = path.join(base, 'projeto');
    fs.mkdirSync(pasta);
    if (opcoes.antes) {
        await opcoes.antes(pasta);
    }
    const processo = spawn(process.execPath, [arquivoServidor], {
        env: { ...process.env, PASTA: pasta, PORTA: '0', NOME: 'projeto', SENHA: opcoes.senha || '', ENDERECOS: opcoes.enderecos || '' },
        stdio: ['ignore', 'pipe', 'pipe']
    });
    const endereco = await new Promise((resolver, rejeitar) => {
        let saida = '';
        const limite = setTimeout(() => rejeitar(new Error(`O servidor não ligou: ${saida}`)), 15000);
        processo.stdout.on('data', (dados) => {
            saida += dados;
            const encontrado = saida.match(/http:\/\/localhost:(\d+)/);
            if (encontrado) {
                clearTimeout(limite);
                resolver(`http://localhost:${encontrado[1]}`);
            }
        });
        processo.stderr.on('data', (dados) => {
            saida += dados;
        });
        processo.on('exit', (codigo) => {
            clearTimeout(limite);
            rejeitar(new Error(`O servidor saiu (código ${codigo}): ${saida}`));
        });
    });
    return {
        endereco,
        pasta,
        parar: async () => {
            processo.kill();
            await new Promise((resolver) => setTimeout(resolver, 100));
            fs.rmSync(base, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
        }
    };
}

// Cria arquivos e pastas: { 'docs/a.md': 'texto', 'vazia/': null }
function criarNoDisco(pasta, arquivos) {
    for (const [caminho, conteudo] of Object.entries(arquivos)) {
        const destino = path.join(pasta, ...caminho.replace(/\/$/, '').split('/'));
        if (conteudo === null) {
            fs.mkdirSync(destino, { recursive: true });
            continue;
        }
        fs.mkdirSync(path.dirname(destino), { recursive: true });
        fs.writeFileSync(destino, conteudo);
    }
}

// Tudo o que está na pasta, no mesmo formato. A pasta .editor (lixeira e cópias) fica de fora.
function lerDoDisco(pasta, incluirInterna = false) {
    const resultado = {};
    function ler(atual, prefixo) {
        for (const entrada of fs.readdirSync(atual, { withFileTypes: true })) {
            if (!incluirInterna && !prefixo && entrada.name === '.editor') {
                continue;
            }
            const caminho = path.join(atual, entrada.name);
            if (entrada.isDirectory()) {
                resultado[`${prefixo}${entrada.name}/`] = null;
                ler(caminho, `${prefixo}${entrada.name}/`);
            } else {
                resultado[`${prefixo}${entrada.name}`] = fs.readFileSync(caminho, 'utf8');
            }
        }
    }
    ler(pasta, '');
    return resultado;
}

module.exports = { iniciarServidor, criarNoDisco, lerDoDisco };
