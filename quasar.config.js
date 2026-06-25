import { configure } from 'quasar/wrappers';

export default configure(function (ctx) {
  return {
    boot: ['axios'],
    css: ['app.scss'],
    extras: ['material-icons'],
    build: {
      distDir: 'dist',
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
    build: {
      viteVuePluginOptions: {
        vite: {
          server: {
            allowedHosts: ['miguel-desktop.local']
          }
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
