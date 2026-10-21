// Servidor estático mínimo que serve a pasta public/ para os testes.
const http = require('http');
const fs = require('fs');
const path = require('path');

const raiz = path.resolve(__dirname, '..', 'public');
const porta = Number(process.argv[2]) || 4173;
const tipos = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8'
};

http.createServer(function (requisicao, resposta) {
    const caminho = decodeURIComponent(requisicao.url.split('?')[0]);
    const arquivo = path.join(raiz, caminho === '/' ? 'index.html' : caminho);
    if (!arquivo.startsWith(raiz)) {
        resposta.writeHead(403);
        resposta.end();
        return;
    }
    fs.readFile(arquivo, function (erro, dados) {
        if (erro) {
            resposta.writeHead(404);
            resposta.end();
            return;
        }
        resposta.writeHead(200, { 'Content-Type': tipos[path.extname(arquivo)] || 'application/octet-stream' });
        resposta.end(dados);
    });
}).listen(porta, function () {
    console.log(`Servindo ${raiz} em http://localhost:${porta}`);
});
