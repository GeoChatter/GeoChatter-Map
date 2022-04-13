<script context="module">
	import { writable } from 'svelte/store';

	export const mapType = writable('3D DEFAULT');

	export let styles = [
		'3D DEFAULT',
		'3D SATELLITE',
		'3D OUTDOORS',
		'3D LIGHTMODE',
		'3D DARKMODE',
		'STREETS',
		'SATELLITE',
		'TERRAIN'
	];
</script>

{#each styles as style}
	<li >
		<a
			class={$mapType === style ? 'bg-secondary ' : ''}
			disabled={$mapType === style}
			on:click={() => ($mapType = style)}>{style}</a
		>
	</li>
{/each}
