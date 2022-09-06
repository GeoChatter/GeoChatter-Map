<script>
	import Drawer from '$lib/Drawer.svelte';
	export const prerender = true
	import '../app.css';
</script>

<div class="absolute inset-0">
	<Drawer />
	<slot class="h-full" />
</div>
