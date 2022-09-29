<script context="module">
	import { writable } from 'svelte/store';
	import MediaQuery from './MediaQuery.svelte';

	export const mapType = writable('STREETS');

	export let styles = [
		'STREETS',
		'SATELLITE',
		'TERRAIN',
		'OSM',
		'OPENTOPOMAP',
		'3D DEFAULT',
		'3D SATELLITE',
		'3D OUTDOORS',
		'3D LIGHTMODE',
		'3D DARKMODE',
		'3D SATELLITE (NO LABELS)'
	];
</script>

<script  lang="ts">
	import { browser } from '$app/environment';
	import { MapIcon } from 'svelte-feather-icons';

	import {roundSettings} from "../lib/js/api"
	const createMostUsedArray = (): string[] => {
		// FIXME: return all styles
		if (!browser) return [];
		let mapStyleCounter = localStorage.getItem('mapStyleCounter') ?? '{}';
		mapStyleCounter = JSON.parse(mapStyleCounter);

		let sorted: Array<any> = [...Object.entries(mapStyleCounter)];

		sorted = sorted.sort((x, y) => y[1] - x[1]);

		sorted = sorted.map((pair) => pair[0]);
		const concatedArray = sorted.concat(styles);
		const result = [...new Set(concatedArray)];
		return result;
	};

	export let isDrawer = false;

	const changeStyle = (style: string) => {
		let mapStyleCounter = localStorage.getItem('mapStyleCounter') ?? '{}';
		mapStyleCounter = JSON.parse(mapStyleCounter);
		if (!mapStyleCounter[style]) {
			mapStyleCounter[style] = 0;
		}
		mapStyleCounter[style] = mapStyleCounter[style] + 1;
		localStorage.setItem('mapStyleCounter', JSON.stringify(mapStyleCounter));
		$mapType = style;
	};

	let mediaQueries = {
		sm: '640px',
		// => @media (min-width: 640px) { ... }

		md: '768px',
		// => @media (min-width: 768px) { ... }

		lg: '1024px',
		// => @media (min-width: 1024px) { ... }

		xl: '1280px',
		// => @media (min-width: 1280px) { ... }

		'2xl': '1536px'
		// => @media (min-width: 1536px) { ... }
	};
	const getMediaWidth = (i) => {
		if (isDrawer) return '0px'; // should always show all maps
		if (i <= 1) {
			return '0px';
		} else if (i === 3) {
			return mediaQueries['md'];
		} else if (i <= 6) {
			return mediaQueries['xl'];
		} else if (i <= 8) {
			return mediaQueries['2xl'];
		} else {
			return '999999999999px'; // should not be shown
		}
	};
	$: array = createMostUsedArray();

</script>

{#each array as style, i}
	<MediaQuery query={`(min-width: ${getMediaWidth(i)})`}>
		<li>
			<a
				class={$mapType === style ? 'bg-secondary rounded-2xl ' : 'rounded-2xl '}
				disabled={$mapType === style}
				on:click={() => {
					changeStyle(style);
					// array = createMostUsedArray();
				}}
			>
				{#if isDrawer} <MapIcon class="inline" />{/if}
				{style}</a
			>
		</li>
	</MediaQuery>
{/each}
