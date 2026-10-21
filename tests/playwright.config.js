const { defineConfig, devices } = require('@playwright/test');

// Usa o Edge instalado no Windows. Para usar o Chrome: NAVEGADOR=chrome npm test
const canal = process.env.NAVEGADOR || 'msedge';
const porta = 4173;

module.exports = defineConfig({
    testDir: '.',
    testMatch: '*.spec.js',
    timeout: 45000,
    expect: { timeout: 7000 },
    fullyParallel: true,
    retries: 0,
    reporter: [['list'], ['html', { open: 'never', outputFolder: 'relatorio' }]],
    outputDir: 'resultados',
    use: {
        baseURL: `http://localhost:${porta}`,
        channel: canal,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure'
    },
    projects: [
        {
            name: 'desktop',
            testIgnore: 'celular.spec.js',
            use: { viewport: { width: 1440, height: 900 } }
        },
        {
            name: 'celular',
            testMatch: 'celular.spec.js',
            use: { ...devices['Pixel 7'], channel: canal, viewport: { width: 390, height: 844 } }
        }
    ],
    webServer: {
        command: `node servidor.js ${porta}`,
        url: `http://localhost:${porta}`,
        reuseExistingServer: true
    }
});
