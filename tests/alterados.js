// Descobre o que mudou no código e roda só os testes das áreas afetadas.
//
// Uso:
//   npm run test:alterado                 alterações ainda não commitadas
//   npm run test:alterado -- HEAD~1       o que mudou no último commit
//   npm run test:alterado -- --listar     só mostra as áreas, sem rodar
//
// Como decide a área:
//   - public/editor.js: pela função onde a linha mudou (ex.: formatarJson → json).
//     Fora de funções, pelo texto da linha.
//   - public/index.html e public/editor.css: pelo texto da linha (ids e classes).
//     Mudanças dentro de @media também rodam os testes de celular.
//   - tests/*.spec.js: o próprio arquivo de teste.
//   - Se não der para identificar a área, roda tudo.
// Os testes "geral" sempre rodam, porque são rápidos e pegam erros de carregamento.
const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const raizRepositorio = path.resolve(__dirname, '..');
const areasConhecidas = ['geral', 'abas', 'arquivos', 'markdown', 'json', 'sessao', 'celular'];

// Palavras-chave no nome da função ou no texto da linha → área.
const regras = [
    ['json', /json/i],
    ['markdown', /markdown|preview|data-md|md-|modo|marcacao|citacao|tarefas|numerada|negrito|italico|tachado/i],
    ['sessao', /sessao|backup|persist|navegador|indexeddb|instantaneo|legada|armazenamento|importar|exportar/i],
    ['arquivos', /arquivo|salvar|salvo|baixar|gravarno|carregar|manipulador/i],
    ['abas', /\baba|abas|documento|semtitulo|modificac|dialogo|confirmar|linguagem/i],
    ['celular', /@media/i],
    ['geral', /topo|trilho|rodape|paleta|marca|logo|falha|visualizacao|cursor|cabecalho/i]
];

// Funções auxiliares cujo nome não diz a área.
const funcoesConhecidas = {
    obterIndentacaoLinha: ['markdown'],
    obterLinhasSelecionadas: ['markdown'],
    obterSelecoesOrdenadas: ['markdown'],
    formatarHorario: ['sessao'],
    confirmar: ['abas', 'sessao'],
    mostrarFalha: ['geral']
};

function areasPorTexto(texto) {
    return regras.filter(([, padrao]) => padrao.test(texto)).map(([area]) => area);
}

function git(argumentos) {
    return execFileSync('git', argumentos, { cwd: raizRepositorio, encoding: 'utf8' });
}

// Lê o diff e devolve { arquivo: [números de linha no arquivo atual] }.
function linhasAlteradas(base) {
    const diff = git(['diff', '-U0', base, '--', 'public', 'tests']);
    const resultado = {};
    let arquivoAtual;
    for (const linha of diff.split('\n')) {
        const cabecalhoArquivo = linha.match(/^\+\+\+ (?:b\/)?(.+)$/);
        if (cabecalhoArquivo) {
            arquivoAtual = cabecalhoArquivo[1] === '/dev/null' ? undefined : cabecalhoArquivo[1];
            if (arquivoAtual) {
                resultado[arquivoAtual] = resultado[arquivoAtual] || [];
            }
            continue;
        }
        const trecho = linha.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
        if (trecho && arquivoAtual) {
            const inicio = Number(trecho[1]);
            const quantidade = trecho[2] === undefined ? 1 : Number(trecho[2]);
            if (quantidade === 0) {
                resultado[arquivoAtual].push(Math.max(inicio, 1));
            }
            for (let numero = inicio; numero < inicio + quantidade; numero += 1) {
                resultado[arquivoAtual].push(numero);
            }
        }
    }
    const novos = git(['ls-files', '--others', '--exclude-standard', '--', 'public', 'tests']).split('\n').filter(Boolean);
    for (const arquivo of novos) {
        resultado[arquivo] = [0];
    }
    return resultado;
}

// Intervalos das funções de primeiro nível do editor.js (indentação de 12 espaços).
function funcoesDoEditor(linhas) {
    const funcoes = [];
    linhas.forEach((texto, indice) => {
        const inicio = texto.match(/^ {12}(?:async )?function (\w+)\s*\(/);
        if (!inicio) {
            return;
        }
        let fim = indice;
        while (fim < linhas.length && !/^ {12}\}\s*$/.test(linhas[fim])) {
            fim += 1;
        }
        funcoes.push({ nome: inicio[1], inicio: indice + 1, fim: fim + 1 });
    });
    return funcoes;
}

function dentroDeMedia(linhas, numero) {
    for (let indice = numero - 1; indice >= 0; indice -= 1) {
        if (/^\}/.test(linhas[indice]) && indice !== numero - 1) {
            return false;
        }
        if (/^@media/.test(linhas[indice])) {
            return true;
        }
    }
    return false;
}

function analisar(alteracoes) {
    const areas = new Set(['geral']);
    const motivos = [];
    const marcar = (lista, motivo) => {
        lista.forEach((area) => areas.add(area));
        motivos.push(`${motivo} → ${lista.join(', ')}`);
    };

    for (const [arquivo, numeros] of Object.entries(alteracoes)) {
        const nomeBase = path.basename(arquivo);
        const caminho = path.join(raizRepositorio, arquivo);
        const linhas = fs.existsSync(caminho) ? fs.readFileSync(caminho, 'utf8').replace(/\r\n/g, '\n').split('\n') : [];

        if (arquivo.startsWith('tests/')) {
            const area = nomeBase.replace('.spec.js', '');
            if (nomeBase.endsWith('.spec.js') && areasConhecidas.includes(area)) {
                marcar([area], arquivo);
            } else if (['utilidades.js', 'playwright.config.js', 'servidor.js'].includes(nomeBase)) {
                marcar(['todas'], arquivo);
            }
            continue;
        }

        if (nomeBase === 'editor.js') {
            const funcoes = funcoesDoEditor(linhas);
            const jaVistas = new Set();
            for (const numero of numeros) {
                const funcao = funcoes.find((item) => numero >= item.inicio && numero <= item.fim);
                if (funcao) {
                    if (jaVistas.has(funcao.nome)) {
                        continue;
                    }
                    jaVistas.add(funcao.nome);
                    const encontradas = funcoesConhecidas[funcao.nome] || areasPorTexto(funcao.nome);
                    marcar(encontradas.length ? encontradas : ['todas'], `editor.js: ${funcao.nome}()`);
                } else {
                    const texto = (linhas[numero - 1] || '').trim();
                    const chave = `linha:${texto}`;
                    if (!texto || jaVistas.has(chave)) {
                        continue;
                    }
                    jaVistas.add(chave);
                    const encontradas = areasPorTexto(texto);
                    marcar(encontradas.length ? encontradas : ['todas'], `editor.js:${numero} "${texto.slice(0, 60)}"`);
                }
            }
            continue;
        }

        if (nomeBase === 'index.html' || nomeBase === 'editor.css') {
            for (const numero of numeros) {
                const texto = (linhas[numero - 1] || '').trim();
                if (!texto) {
                    continue;
                }
                const encontradas = areasPorTexto(texto);
                if (nomeBase === 'editor.css' && dentroDeMedia(linhas, numero)) {
                    encontradas.push('celular');
                }
                marcar(encontradas.length ? encontradas : ['geral'], `${nomeBase}:${numero} "${texto.slice(0, 60)}"`);
            }
            continue;
        }

        marcar(['todas'], arquivo);
    }
    return { areas, motivos };
}

function principal() {
    const argumentos = process.argv.slice(2);
    const apenasListar = argumentos.includes('--listar');
    const base = argumentos.find((item) => !item.startsWith('--')) || 'HEAD';

    const alteracoes = linhasAlteradas(base);
    if (!Object.keys(alteracoes).length) {
        console.log(`Nenhuma alteração em public/ ou tests/ desde ${base}. Nada para testar.`);
        return 0;
    }

    const { areas, motivos } = analisar(alteracoes);
    const rodarTudo = areas.has('todas');
    console.log('O que mudou:');
    [...new Set(motivos)].forEach((motivo) => console.log(`  - ${motivo}`));
    const listaAreas = rodarTudo ? 'todas' : [...areas].join(', ');
    console.log(`\nÁreas a testar: ${listaAreas}\n`);

    if (apenasListar) {
        return 0;
    }
    const filtros = rodarTudo ? [] : [...areas];
    const execucao = spawnSync('npx', ['playwright', 'test', ...filtros], {
        cwd: __dirname,
        stdio: 'inherit',
        shell: process.platform === 'win32'
    });
    return execucao.status === null ? 1 : execucao.status;
}

process.exitCode = principal();
