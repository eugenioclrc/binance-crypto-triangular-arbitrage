import preprocess from "svelte-preprocess";
import adapter from '@sveltejs/adapter-static';
// import adapter from '@sveltejs/adapter-auto';

const dev = process.env.NODE_ENV === 'development';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    vite: {
      ssr: {
        external: ['/src/lib/exchange.js']
      }
    },
    adapter: adapter({
      pages: 'docs',
			assets: 'docs',
			fallback: null,
    }),
    paths: {
      base: dev ? '' : '/binance-crypto-triangular-arbitrage',
    },
    // hydrate the <div id="svelte"> element in src/app.html
    target: "#svelte",
  },

  preprocess: [preprocess({})],
};

export default config;