import { defineConfig } from 'vite'

export default defineConfig({
    base: '/Car-game/',  // 确保这是正确的部署基础路径
    server: {
        host: 'localhost', // 明确指定主机
        port: 3000,       // 明确指定端口
        open: true // 自动打开浏览器
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        // 生成 sourcemap 以便调试
        sourcemap: true
    }
}) 