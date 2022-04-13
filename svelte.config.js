import adapter from '@sveltejs/adapter-static';

import preprocess from 'svelte-preprocess'

const dev = process.env.NODE_ENV === 'development';
/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: preprocess(),

  kit: {

    paths: {
      base: dev ? '' : process.env.BASE_PATH

    },
    adapter: adapter({
      // default options are shown
      pages: 'build',
      assets: 'build',
      fallback: null,
      precompress: true

    })
  }
};

export default config
