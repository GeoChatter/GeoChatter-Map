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

<script lang="ts">
	import { browser } from '$app/env';

	const createMostUsedArray = (): string[] => {
		if (!browser) return [];
		let mapStyleCounter = localStorage.getItem('mapStyleCounter') ?? '{}';
		mapStyleCounter = JSON.parse(mapStyleCounter);

		let sorted: Array<any> = [...Object.entries(mapStyleCounter)];

		sorted = sorted.sort((x, y) => y[1] - x[1]);

		if (sorted.length < 3) return ['3D DEFAULT', '3D SATELLITE', 'TERRAIN'];
		return sorted.map((pair) => pair[0]);
	};

	export let isDrawer = false;

	const getRank = (style: string) => {
		return createMostUsedArray().indexOf(style) + 1;
	};

	const setHiddenBasedOnRank = (rank: number) => {
		// example rank 3 =>
		let classList = '';
		switch (rank) {
			case 1: {
				// classList = classList + ' xs:block';
				break;
			}
			case 2: {
				// classList = classList + ' xs:block';
				break;
			}
			case 3: {
				classList = classList + 'hidden md:block';
				break;
			}
			default: {
				classList = classList + 'hidden xl:block';
			}
		}
		return classList;
	};

	const getClassList = (style: string): string => {
		return setHiddenBasedOnRank(getRank(style));
	};

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
</script>

{#each styles as style}
	<li>
		<a
			class={($mapType === style ? 'bg-secondary rounded-2xl ' : 'rounded-2xl ') +
				(!isDrawer ? getClassList(style) : '')}
			disabled={$mapType === style}
			on:click={() => changeStyle(style)}>{style}</a
		>
	</li>
{/each}
