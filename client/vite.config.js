import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	plugins: [svelte()],
	server: {
		port: 5173,
		proxy: {
			'/dev': 'http://localhost:3000',
			'/socket.io': {
				target: 'http://localhost:3000',
				ws: true
			}
		}
	}
});
