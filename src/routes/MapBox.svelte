<script>
	import { user } from '$lib/supabase';
	import { browser, dev } from '$app/env';
	import { mapType } from '$lib/MapPicker.svelte';
	import { copyAndPaste } from '$lib/Drawer.svelte';
	import { getCountry } from '$lib/js/helpers/getFeature';
	import {
		ChevronLeftIcon,
		ChevronRightIcon,
		ChevronDownIcon,
		ChevronUpIcon
	} from 'svelte-feather-icons';
	import mapboxgl from 'mapbox-gl';
	import { show } from '$lib/Alert.svelte';
	let currSelectedCountry;

	let flag = '';
	let id = 0;
	let lastCountry;
	async function selectCountry() {
		const [country, svg] = await getCountry(currentGuess.lat, currentGuess.lng);
		if (country === lastCountry) return;
		lastCountry = country;
		flag = svg;
		if (currSelectedCountry) {
			mapBox.removeLayer(currSelectedCountry + 'line');
			mapBox.removeLayer(currSelectedCountry);
			mapBox.removeSource(currSelectedCountry);
		}
		id++;
		mapBox.addSource(`countrySelected${id}`, { type: 'geojson', data: country });
		currSelectedCountry = `countrySelected${id}`;
		mapBox.addLayer({
			id: `countrySelected${id}`,
			type: 'fill',
			source: `countrySelected${id}`, // reference the data source
			layout: {},
			paint: {
				'fill-color': '#0080ff', // blue color fill
				'fill-opacity': 0.1
			}
		});
		mapBox.addLayer({
			id: currSelectedCountry + 'line',
			type: 'line',
			source: currSelectedCountry,
			layout: {},
			paint: {
				'line-color': '#0080ff',
				'line-width': 3
			}
		});
	}

	let deviceType;
	if (browser) {
		try {
			mapboxgl.accessToken = dev
				? import.meta.env.VITE_MAPBOXKEYDEV
				: import.meta.env.VITE_MAPBOXKEY;
			mapboxgl.setRTLTextPlugin(
				'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js',
				null,
				true
			);
		} catch {
			/* console.log('no need to set it again'); */
		}
		deviceType = () => {
			const ua = navigator.userAgent;
			if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
				return 'tablet';
			} else if (
				/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
					ua
				)
			) {
				return 'mobile';
			}
			return 'desktop';
		};
	}
	const styles = {
		'3D DEFAULT': 'mapbox://styles/semihm/ckxvy72ks45v114oe7o1cwbxs',
		'3D SATELLITE': 'mapbox://styles/semihm/ckyn214e69hp214ppbwu09w59?optimize=true',
		'3D LIGHTMODE': 'mapbox://styles/mapbox/light-v10?optimize=true',
		'3D DARKMODE': 'mapbox://styles/mapbox/dark-v10?optimize=true',
		'3D OUTDOORS': 'mapbox://styles/mapbox/outdoors-v11?optimize=true'
	};
	export let _3DEnabled = false;
	export let lastMapType;

	$: copy = !$user || $copyAndPaste;

	let mapBoxDemSrc = 'mapbox-dem';
	export let exaggeration = 1;
	export let zoomSensitivity = 100;

	function changeExaggeration(val, mapBox) {
		localStorage.setItem('ex', val);
		mapBox.setTerrain(null);
		mapBox.setTerrain({ source: mapBoxDemSrc, exaggeration: val });
	}
	function toggle3D(enable, mapBox) {
		_3DEnabled = enable;
		if (enable) {
			localStorage.setItem('3d', 1);
		} else {
			localStorage.removeItem('3d');
		}

		if (!enable) {
			mapBox.setTerrain(null);
			mapBox.setPitch(0);
			mapBox.setBearing(0);
			mapBox.dragRotate.disable();
		} else {
			mapBox.setTerrain(null);
			mapBox.setTerrain({ source: mapBoxDemSrc, exaggeration });
			mapBox.dragRotate.enable();
		}
	}

	export let currentGuess;
	export let mapBox;
	export let leaflet;
	export let bot;

	function initMapBox(node) {
		let center = [0, 0];
		let zoom = 1;
		let pitch = 0;
		let bearing = 0;
		if (lastMapType === 'Leaflet') {
			zoom = leaflet.getZoom() - 1;
			center = leaflet.getCenter();
		} else if (lastMapType === 'MapBox') {
			zoom = mapBox.getZoom();
			center = mapBox.getCenter();
			pitch = mapBox.getPitch();
			bearing = mapBox.getBearing();
		}

		mapBox = new mapboxgl.Map({
			container: node, // container ID
			style: styles[$mapType], //'mapbox://styles/mapbox/streets-v11', // style URL
			// style: defaultMapStyle, // style URL
			center, // starting position [lng, lat]
			zoom, // starting zoom
			pitch,
			bearing,
			attributionControl: false
		});

		mapBox.addControl(
			new mapboxgl.AttributionControl({
				customAttribution: '<b>GeoChatter.tv</b>',
				compact: false
			})
		);
		console.log(mapBox);
		// setting again bc too low values maybe not working in constructor
		mapBox.setPitch(pitch);
		mapBox.setBearing(bearing);

		const attributeBtn = document.getElementsByClassName('mapboxgl-ctrl-icon')[0];
		console.log(attributeBtn);
		attributeBtn.classList.add('pointer-events-auto');
		attributeBtn.classList.add('z-[5000]');
		console.log(attributeBtn);
		mapBox.on('load', () => {
			mapBox.addSource(mapBoxDemSrc, {
				type: 'raster-dem',
				url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
				tileSize: 512,
				maxzoom: 14
			});
			let marker;
			mapBox.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }));

			toggle3D(_3DEnabled, mapBox);

			mapBox['scrollZoom'].setWheelZoomRate((0.01 * zoomSensitivity) / 100);

			if (currentGuess) {
				selectCountry();
				let clipboard = `/w ${bot} ${window.btoa(
					currentGuess.lat.toString() + ',' + currentGuess.lng.toString()
				)}`;
				if (copy) {
					navigator.clipboard.writeText(clipboard);
				}
				const el = document.createElement('div');
				const width = 30;
				const height = 30;
				el.className = 'marker rounded-full border-2 border-white';
				el.style.backgroundImage = `url(${$user?.user_metadata?.picture ?? 'test.png'})`;
				el.style.width = `${width}px`;
				el.style.height = `${height}px`;
				el.style.backgroundSize = '100%';

				marker = new mapboxgl.Marker({ element: el })
					.setLngLat([currentGuess.lng, currentGuess.lat])
					.addTo(mapBox);
			}

			function onMapClick(e) {
				currentGuess = e.lngLat;
				selectCountry();
				if (marker) marker.remove();
				let clipboard = `/w ${bot} ${window.btoa(
					currentGuess.lat.toString() + ',' + currentGuess.lng.toString()
				)}`;
				if (copy) {
					navigator.clipboard.writeText(clipboard);
					show(0.5, 'guess copied to clipboard');
				}
				const el = document.createElement('div');
				const width = 30;
				const height = 30;
				el.className = 'marker rounded-full border-2 border-white';
				el.style.backgroundImage = `url(${$user?.user_metadata?.picture ?? 'test.png'})`;
				el.style.width = `${width}px`;
				el.style.height = `${height}px`;
				el.style.backgroundSize = '100%';

				marker = new mapboxgl.Marker({ element: el })
					.setLngLat([currentGuess.lng, currentGuess.lat])
					.addTo(mapBox);
			}

			mapBox.on('click', onMapClick);
			lastMapType = 'MapBox';
		});
	}
	let bearing = 0;
	let pitch = 0;

	const intervalls = [];
</script>

<div class="z-[50000] pointer-events-none absolute top-24 flex justify-center w-full">
	{#if flag}
		<div class="pointer-events-none	 w-16 h-16 ">{@html flag}</div>
	{/if}
</div>

<div id="mapBox" use:initMapBox class="z-5 w-full h-full" />
<div class="hidden sm:grid absolute top-3 right-12 bg-base-100 shadow-md rounded-md p-2 gap-y-2">
	<button
		class={_3DEnabled ? 'btn btn-xs' : 'btn btn-xs btn-primary'}
		on:click={() => toggle3D(!_3DEnabled, mapBox)}
		>{#if _3DEnabled} disable 3d{:else} enable 3d {/if}</button
	>
	<label class="text-xs">Zoom Sensitivity {Math.round((zoomSensitivity / 100) * 10) / 10}</label>
	<input
		on:mouseup={() => {
			if (zoomSensitivity <= 10) {
				zoomSensitivity = 10;
			}
			mapBox['scrollZoom'].setWheelZoomRate((0.01 * zoomSensitivity) / 100);
			localStorage.setItem('sens', zoomSensitivity);
		}}
		type="range"
		min="0"
		max="300"
		bind:value={zoomSensitivity}
		class="range range-xs"
	/>
	{#if mapBox && _3DEnabled && deviceType !== 'mobile'}
		<label class="text-xs">Exaggeration {exaggeration}x</label>
		<input
			on:mouseup={() => changeExaggeration(exaggeration, mapBox)}
			type="range"
			min="1"
			max="10"
			bind:value={exaggeration}
			class="range range-xs "
		/>
		<div
			class="flex w-full"
			on:mouseup={() => intervalls.forEach((interval) => clearInterval(interval))}
			on:mouseleave={() => intervalls.forEach((interval) => clearInterval(interval))}
		>
			<button
				class="w-full text-right flex justify-end items-center"
				on:mousedown={() => {
					intervalls.push(setInterval(() => mapBox.setBearing(mapBox.getBearing() + 0.5), 20));
				}}><ChevronLeftIcon /></button
			>
			<div class="grid w-full justify-center h-12">
				<button
					on:mousedown={() => {
						intervalls.push(setInterval(() => mapBox.setPitch(mapBox.getPitch() - 0.5), 20));
					}}
				>
					<ChevronUpIcon />
				</button>

				<button
					on:mousedown={() => {
						intervalls.push(setInterval(() => mapBox.setPitch(mapBox.getPitch() + 0.5), 20));
					}}
				>
					<ChevronDownIcon />
				</button>
			</div>
			<button
				class="w-full text-right flex justify-start items-center"
				on:mousedown={() => {
					intervalls.push(setInterval(() => mapBox.setBearing(mapBox.getBearing() - 0.5), 20));
				}}
			>
				<ChevronRightIcon />
			</button>
		</div>
	{/if}
</div>
