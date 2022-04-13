<script>
	import Drawer from '$lib/Drawer.svelte';

	import '../app.css';
</script>

<div class="absolute inset-0">
	<Drawer />
	<slot class="h-full" />
</div>
