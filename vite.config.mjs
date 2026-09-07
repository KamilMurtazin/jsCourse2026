import { defineConfig } from 'vite';
import vuePlugin from '@vitejs/plugin-vue';
import path from 'path';
import { checker } from 'vite-plugin-checker';
import { globSync } from 'node:fs';

const taskHtml = globSync('Lessons/*/{Tasks,Homework}/**/index.html');

export default defineConfig(() => ({
    appType: 'spa',
    resolve: {
        extensions: ['.js', '.ts', '.vue', '.mjs'],
    },
    build: {
        target: 'es2020',
        // Preserve debugger statements and source locations for classroom walkthroughs.
        minify: false,
        sourcemap: true,
        outDir: path.resolve(import.meta.dirname, 'dist'),
        copyPublicDir: false,
        publicDir: false,
        reportCompressedSize: false,
        chunkSizeWarningLimit: Number.POSITIVE_INFINITY,
        rolldownOptions: {
            input: ['./src/index.html', './src/runner.html', ...taskHtml],
            output: {
                entryFileNames: '[name].bundle.js',
                chunkFileNames: 'chunks/[name].[hash].js',
                assetFileNames: 'assets/[name].[hash].[ext]',
            },
        },
    },
    css: {
        preprocessorMaxWorkers: 4,
    },
    base: './',
    plugins: [
        {
            name: 'course-task-console',
            transformIndexHtml: {
                order: 'pre',
                handler(_html, context) {
                    if (context.filename.replaceAll('\\', '/').includes('/Lessons/')) {
                        return [
                            {
                                tag: 'script',
                                attrs: { type: 'module', src: '/src/runner/bridge.ts' },
                                injectTo: 'head-prepend',
                            },
                        ];
                    }
                    return [];
                },
            },
        },
        vuePlugin(),
        checker({
            vueTsc: true,
        }),
    ],
    server: {
        host: '0.0.0.0',
        cors: true,
        open: '/src/index.html',
    },
    test: {
        globals: true,
        environment: 'jsdom',
        include: ['**/*.test.{ts,js}'],
        setupFiles: './vitest.setup.mjs',
    },
}));
