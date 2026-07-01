import { configure } from 'quasar/wrappers';

export default configure(function (ctx) {
  return {
    boot: ['theme', 'axios'],
    css: ['app.scss'],
    extras: ['material-icons'],
    build: {
      distDir: 'dist',
      viteVuePluginOptions: {
        vite: {
          server: {
            allowedHosts: true
          }
        }
      }
    },
    devServer: {
      port: 9000,
      open: false,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:8090',
          changeOrigin: true
        }
      }
    },
    framework: {
      iconSet: 'material-icons',
      lang: 'es',
      config: {},
      plugins: ['Dialog', 'Notify', 'Loading', 'LocalStorage'],
    },
    animations: [],
  };
});
