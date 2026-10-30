// Gera public/vendor/ com as bibliotecas do editor, a partir das versões exatas do package-lock.json.
// O site carrega tudo de public/vendor/, sem depender de CDN: se o site abre, o editor funciona,
// e a versão homelab funciona até sem internet.
//
// Uso (só quando for atualizar uma biblioteca; a publicação não roda este script):
//   cd ferramentas
//   npm ci          instala exatamente o que está no package-lock.json
//   npm run gerar   apaga e recria public/vendor/
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const pastaModulos = path.join(__dirname, 'node_modules');
const destino = path.resolve(__dirname, '..', 'public', 'vendor');

function versao(pacote) {
    return require(path.join(pastaModulos, pacote, 'package.json')).version;
}

function copiar(origem, alvo) {
    fs.mkdirSync(path.dirname(alvo), { recursive: true });
    fs.cpSync(origem, alvo, { recursive: true });
}

function copiarLicenca(pacote, alvo) {
    const arquivo = ['LICENSE', 'LICENSE.md', 'LICENSE.txt'].map((nome) => path.join(pastaModulos, pacote, nome)).find(fs.existsSync);
    copiar(arquivo, alvo);
}

async function gerarMilkdown() {
    const saida = path.join(destino, 'milkdown');
    // Um arquivo só com tudo o que o editor usa. Os módulos precisam ser os mesmos objetos para o
    // Crepe e para o editor (o Milkdown compara as chaves do contexto pela identidade).
    // Script comum (window.Milkdown), não módulo: o navegador bloqueia import() de módulos quando o
    // editor é aberto direto do disco (file://), e um <script> funciona.
    await esbuild.build({
        entryPoints: { milkdown: path.join(__dirname, 'milkdown-entrada.js') },
        bundle: true,
        format: 'iife',
        globalName: 'Milkdown',
        minify: true,
        target: 'es2020',
        legalComments: 'linked',
        outdir: saida,
        logLevel: 'warning'
    });
    await esbuild.build({
        entryPoints: { milkdown: path.join(__dirname, 'milkdown-entrada.css') },
        bundle: true,
        minify: true,
        loader: { '.woff2': 'file', '.woff': 'file', '.ttf': 'file' },
        assetNames: 'fontes/[name]-[hash]',
        outdir: saida,
        logLevel: 'warning'
    });
    copiarLicenca('@milkdown/crepe', path.join(saida, 'LICENSE'));
}

async function principal() {
    fs.rmSync(destino, { recursive: true, force: true });

    copiar(path.join(pastaModulos, 'monaco-editor', 'min', 'vs'), path.join(destino, 'monaco', 'vs'));
    copiarLicenca('monaco-editor', path.join(destino, 'monaco', 'LICENSE'));
    copiar(path.join(pastaModulos, 'marked', 'marked.min.js'), path.join(destino, 'marked', 'marked.min.js'));
    copiarLicenca('marked', path.join(destino, 'marked', 'LICENSE'));
    copiar(path.join(pastaModulos, 'dompurify', 'dist', 'purify.min.js'), path.join(destino, 'dompurify', 'purify.min.js'));
    copiarLicenca('dompurify', path.join(destino, 'dompurify', 'LICENSE'));
    await gerarMilkdown();

    const versoes = ['monaco-editor', '@milkdown/crepe', '@milkdown/kit', 'codemirror', 'marked', 'dompurify'].map((pacote) => `${pacote} ${versao(pacote)}`);
    fs.writeFileSync(path.join(destino, 'VERSOES.txt'), `Gerado por ferramentas/gerar.js. Não edite à mão.\n\n${versoes.join('\n')}\n`);
    console.log(`public/vendor/ gerado:\n  ${versoes.join('\n  ')}`);
}

principal().catch((erro) => {
    console.error(erro);
    process.exit(1);
});
