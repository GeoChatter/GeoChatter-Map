<script lang="ts">
	import { user } from '$lib/supabase';
	import settings, { Settings } from '$lib/js/settings';
	// @ts-ignore
	import { browser, dev } from '$app/environment';
	import { mapType } from '$lib/MapPicker.svelte';
	import { getCountry } from '$lib/js/helpers/getFeature';
	import {
		ChevronLeftIcon,
		ChevronRightIcon,
		ChevronDownIcon,
		ChevronUpIcon
	} from 'svelte-feather-icons';
	import mapboxgl from 'mapbox-gl';
	import { show } from '$lib/Alert.svelte';
	import Flag from '$lib/Flag.svelte';
	import api, { roundSettings } from './js/api';
	import { onDestroy } from 'svelte';
	let currSelectedCountry;

	let globeView = $settings.values.globeView;

	let flag = '';
	let id = 0;
	let lastCountry;
	let countryName = '';
	let subscriptions = [];
	onDestroy(() => {
		subscriptions.forEach((unsub) => unsub());
	});
	async function selectCountry() {
		const [country, svg, countryNameResponse] = await getCountry(
			currentGuess.lat,
			currentGuess.lng
		);
		console.log(country);

		// if (typeof country === 'undefined' && currSelectedCountry) {
		// 	try {
		// 		mapBox.removeLayer(currSelectedCountry + 'line');
		// 		mapBox.removeLayer(currSelectedCountry);
		// 		mapBox.removeSource(currSelectedCountry);
		// 	} catch (e) {
		// 		console.log(e);
		// 	}
		// 	flag = undefined;
		// 	return;
		// }

		if (country === lastCountry) return;

		countryName = country?.properties?.shapeName ?? countryNameResponse;
		lastCountry = country;
		flag = svg;
		if (currSelectedCountry) {
			try {
				mapBox.removeLayer(currSelectedCountry + 'line');
				mapBox.removeLayer(currSelectedCountry);
				mapBox.removeSource(currSelectedCountry);
			} catch (e) {
				console.log(e);
			}
		}
		if ($settings.values.showBorders) {
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
	}
	let deviceType;
	if (browser) {
		try {
			mapboxgl.accessToken = dev
				? // @ts-ignore
				  import.meta.env.VITE_MAPBOXKEYDEV
				: // @ts-ignore
				  import.meta.env.VITE_MAPBOXKEY;
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
		'3D OUTDOORS': 'mapbox://styles/mapbox/outdoors-v11?optimize=true',
		'3D SATELLITE (NO LABELS)': 'mapbox://styles/semihm/cl55552r9000414pe8sxseuz0'
	};
	export let _3DEnabled = false;
	export let lastMapType;

	subscriptions.push(
		$settings.subscribe((s) => {
			_3DEnabled = s.values._3d;
		})
	);

	$: copy = !$user || $settings.values.copyAndPaste;

	let mapBoxDemSrc = 'mapbox-dem';
	export let exaggeration = 1;
	export let zoomSensitivity = 100;

	function changeExaggeration(val, mapBox) {
		$settings.change('ex', val);
		mapBox.setTerrain(null);
		mapBox.setTerrain({ source: mapBoxDemSrc, exaggeration: val });
	}
	function toggle3D(enable: boolean, mapBox) {
		_3DEnabled = enable;
		if (enable) {
			$settings.change('_3d', true);
		} else {
			$settings.change('_3d', false);
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
			projection: globeView ? 'globe' : 'mercator',
			// style: defaultMapStyle, // style URL
			center, // starting position [lng, lat]
			zoom, // starting zoom
			maxZoom: 1,
			pitch,
			bearing,
			attributionControl: false
		});

		mapBox.on('style.load', () => {
			mapBox.setFog({
				color: 'rgb(186, 210, 235)', // Lower atmosphere
				'high-color': 'rgb(36, 92, 223)', // Upper atmosphere
				'horizon-blend': 0.02, // Atmosphere thickness (default 0.2 at low zooms)
				'space-color': 'rgb(11, 11, 25)', // Background color
				'star-intensity': 0.6 // Background star brightness (default 0.35 at low zoooms )
			});
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
			subscriptions.push(
				roundSettings.subscribe((settings) => {
					if (settings.is3dEnabled) {
						toggle3D(true, mapBox);
					} else {
						toggle3D(false, mapBox);
					}
					if (settings.maxZoomLevel == 0) {
						mapBox.setMaxZoom(20);
						return;
					}
					mapBox.setMaxZoom(settings.maxZoomLevel - 1);
				})
			);
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
				el.style.backgroundImage = `url(${
					$user?.user_metadata?.picture ?? 'https://geochatter.tv/icon_smaller.ico'
				})`;
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
				api.sendGuessToBackend(
					currentGuess.lat.toString(),
					currentGuess.lng.toString(),
					false,
					false
				);
				if (copy) {
					navigator.clipboard.writeText(clipboard);
					show(1, 'Guess copied to clipboard');
				}
				const el = document.createElement('div');
				const width = 30;
				const height = 30;
				el.className = 'marker rounded-full border-2 border-white';
				el.style.backgroundImage = `url(${
					$user?.user_metadata?.picture ?? 'https://geochatter.tv/icon_smaller.ico'
				})`;

				subscriptions.push(
					user.subscribe((user) => {
						if (user) {
							el.style.backgroundImage = `url(${
								user?.user_metadata?.picture ?? 'https://geochatter.tv/icon_smaller.ico'
							})`;
						}
					})
				);
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

<Flag {flag} {countryName} />

<div id="mapBox" use:initMapBox class="z-5 w-full h-full" />
<div class="hidden sm:grid absolute top-3 right-12 bg-base-100 shadow-md rounded-md p-2 gap-y-2">
	<button
		class={_3DEnabled ? 'btn btn-xs' : 'btn btn-xs btn-primary'}
		on:click={() => toggle3D(!_3DEnabled, mapBox)}
		disabled={!$roundSettings.is3dEnabled}
		>{#if _3DEnabled} disable 3d{:else} enable 3d {/if}</button
	>

	<button
		class={globeView ? 'btn btn-xs' : 'btn btn-xs btn-primary'}
		on:click={() => {
			globeView = !globeView;
			$settings.change('globeView', globeView);

			if (globeView) {
				mapBox.setProjection('globe');
			} else {
				mapBox.setProjection('mercator');
			}
		}}
		>{#if globeView} disable GlobeView{:else} enable GlobeView {/if}</button
	>
	<!-- svelte-ignore a11y-label-has-associated-control -->
	<label class="text-xs">Zoom Sensitivity {Math.round((zoomSensitivity / 100) * 10) / 10}</label>
	<input
		on:mouseup={() => {
			if (zoomSensitivity <= 10) {
				zoomSensitivity = 10;
			}
			mapBox['scrollZoom'].setWheelZoomRate((0.01 * zoomSensitivity) / 100);

			$settings.change('sens', zoomSensitivity);
		}}
		type="range"
		min="0"
		max="300"
		bind:value={zoomSensitivity}
		class="range range-xs"
	/>
	{#if mapBox && _3DEnabled && deviceType !== 'mobile'}
		<!-- svelte-ignore a11y-label-has-associated-control -->
		<label class="text-xs">Exaggeration {exaggeration}x</label>
		<input
			on:pointerup={() => changeExaggeration(exaggeration, mapBox)}
			type="range"
			min="1"
			max="10"
			bind:value={exaggeration}
			class="range range-xs "
		/>
		<div
			class="flex w-full"
			on:pointerup={() => intervalls.forEach((interval) => clearInterval(interval))}
			on:pointerleave={() => intervalls.forEach((interval) => clearInterval(interval))}
		>
			<button
				class="w-full text-right flex justify-end items-center"
				on:pointerdown={() => {
					intervalls.push(setInterval(() => mapBox.setBearing(mapBox.getBearing() + 0.5), 20));
				}}><ChevronLeftIcon /></button
			>
			<div class="grid w-full justify-center h-12">
				<button
					on:pointerdown={() => {
						intervalls.push(setInterval(() => mapBox.setPitch(mapBox.getPitch() - 0.5), 20));
					}}
				>
					<ChevronUpIcon />
				</button>

				<button
					on:pointerdown={() => {
						intervalls.push(setInterval(() => mapBox.setPitch(mapBox.getPitch() + 0.5), 20));
					}}
				>
					<ChevronDownIcon />
				</button>
			</div>
			<button
				class="w-full text-right flex justify-start items-center"
				on:pointerdown={() => {
					console.log('click');
					intervalls.push(setInterval(() => mapBox.setBearing(mapBox.getBearing() - 0.5), 20));
				}}
			>
				<ChevronRightIcon />
			</button>
		</div>
	{/if}
</div>

<div class="sm:hidden grid absolute top-32 right-3 bg-base-100 shadow-md rounded-md p-2 gap-y-2">
	<div>
		<button
			class="btn btn-xs w-full"
			on:click={() => {
				if (mapBox.getPitch() !== 45) {
					mapBox.setPitch(45);
				} else {
					mapBox.setPitch(0);
				}
			}}>tilt</button
		>
	</div>

	<div class="flex">
		<button
			class="btn btn-xs btn-ghost w-fit text-right flex justify-end items-center"
			on:pointerdown={() => {
				mapBox.setBearing(mapBox.getBearing() + 5);
			}}><ChevronLeftIcon /></button
		>
		<button
			class="btn btn-xs btn-ghost w-fit text-right flex justify-start items-center"
			on:pointerdown={() => {
				mapBox.setBearing(mapBox.getBearing() - 5);
			}}
		>
			<ChevronRightIcon />
		</button>
	</div>
</div>
