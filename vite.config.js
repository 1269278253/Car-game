export default {
    base: '/CAR_0607/', // 替换为你的仓库名
    server: {
        port: 3000,
        open: true // 自动打开浏览器
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        // 生成 sourcemap 以便调试
        sourcemap: true
    }
} 