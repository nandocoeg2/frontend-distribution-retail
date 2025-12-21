import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Custom plugin to inject the script tag for Vite (since Electron's index.html doesn't have it)
const injectScriptPlugin = () => ({
    name: 'inject-script',
    transformIndexHtml(html) {
        return html.replace(
            '</body>',
            '    <script type="module" src="./renderer.js"></script>\n  </body>'
        );
    },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    // Load env file based on mode (development, production, etc.)
    const env = loadEnv(mode, __dirname, '');

    // Determine the backend URL based on APP_ENV
    const appEnv = env.APP_ENV || 'local';
    const backendUrl = appEnv === 'development'
        ? env.BACKEND_BASE_URL_DEV || 'http://192.168.1.201:5050/'
        : env.BACKEND_BASE_URL_LOCAL || 'http://localhost:5050/';

    return {
        plugins: [
            react(),
            injectScriptPlugin(),
        ],
        root: './src',
        publicDir: '../public',
        build: {
            outDir: '../dist',
            emptyOutDir: true,
        },
        server: {
            port: 5173,
            open: true,
        },
        resolve: {
            alias: {
                '@': resolve(__dirname, './src'),
            },
        },
        define: {
            // Polyfill process.env for browser compatibility
            'process.env.BACKEND_BASE_URL': JSON.stringify(backendUrl),
            'process.env.APP_ENV': JSON.stringify(appEnv),
            'process.env.NODE_ENV': JSON.stringify(mode),
        },
        esbuild: {
            loader: 'jsx',
            include: /src\/.*\.jsx?$/,
            exclude: [],
        },
        optimizeDeps: {
            esbuildOptions: {
                loader: {
                    '.js': 'jsx',
                },
            },
        },
    };
});
