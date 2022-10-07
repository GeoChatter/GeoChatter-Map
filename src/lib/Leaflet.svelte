<script lang="ts">
	import { user } from '$lib/supabase';
	import { browser } from '$app/environment';
	import { getCountry } from '$lib/js/helpers/getFeature';

	// import L from 'leaflet';

	export let leaflet;
	export let mapBox;
	export let mapType;
	export let currentGuess;
	export let bot;
	export let lastMapType;
	import { show } from '$lib/Alert.svelte';
	import Flag from '$lib/Flag.svelte';
	import settings from '$lib/js/settings';
	import api, { roundSettings } from './js/api';
	import { get } from 'svelte/store';

	$: copy = !$user || $settings.values.copyAndPaste;

	let profileIcon;
	let flag = '';
	let countryName = '';

	$: {
		if (browser && leaflet) {
			if ($roundSettings) {
				console.log(leaflet?.getZoom());
				if (leaflet?.getZoom() > $roundSettings.maxZoomLevel) {
					leaflet?.setZoom($roundSettings.maxZoomLevel);
				}
				console.log($roundSettings.maxZoomLevel);


				if ($roundSettings.maxZoomLevel !== 0) {
					// leaflet.layers.maxZoom = $roundSettings.maxZoom
				}

			}
		}
	}

	function initLeaflet(node) {
		// node.removeEventListener("click")
		console.log(node.onclick)
		console.log(node)

		import('leaflet').then((L) => {
			if (browser) {
				profileIcon = L.icon({
					iconUrl: $user?.user_metadata?.picture ?? 'https://geochatter.tv/icon_smaller.ico',
					iconSize: [30, 30],
					className: 'rounded-full border-2 border-white'
				});
				user.subscribe((user) => {
					if (user) {
						profileIcon = L.icon({
							iconUrl: user.user_metadata.picture,
							iconSize: [30, 30],
							className: 'rounded-full border-2 border-white'
						});
					}
				});
			}
			let marker;
			let layers = {
				STREETS: L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=en', {
					maxZoom: 20,
					minZoom: 1,
					subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
					attribution: '&copy; Google Maps'
				}),
				SATELLITE: L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}&hl=en', {
					maxZoom: 20,
					minZoom: 1,
					subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
					attribution: '&copy; Google Maps'
				}),
				TERRAIN: L.tileLayer('https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}&hl=en', {
					maxZoom: 20,
					minZoom: 1,
					subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
					attribution: '&copy; Google Maps'
				}),
				OSM: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
					maxZoom: 19,
					minZoom: 1,
					attribution:
						'&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
				}),

				OPENTOPOMAP: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
					maxZoom: 17,
					minZoom: 1,
					attribution:
						'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
				})
			};

			let center = [0, 0];
			let zoom = get(roundSettings).maxZoom >= 1 ? get(zoom).maxZoom : 1;

			let currSelectedCountry;

			async function selectCountry() {
				const [country, svg, countryNameResponse] = await getCountry(
					currentGuess.wrap().lat,
					currentGuess.wrap().lng
				);

				countryName = country?.properties?.shapeName ?? countryNameResponse;

				console.log(svg);
				flag = svg;

				if (currSelectedCountry) {
					leaflet.removeLayer(currSelectedCountry);
				}
				if ($settings.values.showBorders) {
					currSelectedCountry = L.geoJSON(country, { style: { fillOpacity: 0.1 } }).addTo(leaflet);
				}
			}

			if (lastMapType === 'MapBox') {
				zoom = mapBox.getZoom() + 1;
				center = mapBox.getCenter();
			}
			if (browser) {
				leaflet = L.map(node, { zoomControl: false, worldCopyJump: true }).setView(center as any, zoom);
			}

			L.control
				.zoom({
					position: 'topright'
				})
				.addTo(leaflet);
			layers[$mapType].addTo(leaflet);
			leaflet.attributionControl.addAttribution('<b>GeoChatter.tv</b>');

			let oldLayer = layers[$mapType];

			mapType.subscribe((type) => {
				if (!type.startsWith('3D')) {
					leaflet.removeLayer(oldLayer);
					layers[type].addTo(leaflet);
					oldLayer = layers[type];
				}
			});

			if (currentGuess) {
				selectCountry();
				let clipboard = `/w ${bot} ${window.btoa(
					currentGuess.lat.toString() + ',' + currentGuess.lng.toString()
				)}`;
				// if (marker) leaflet.removeLayer(marker);
				if (copy) {
					navigator.clipboard.writeText(clipboard);
				}
				marker = new L.Marker().setLatLng(currentGuess).setIcon(profileIcon).addTo(leaflet);
			}

			function onMapClick(e) {
				currentGuess = e.latlng.wrap();
				let clipboard = `/w ${bot} ${window.btoa(
					currentGuess.lat.toString() + ',' + currentGuess.lng.toString()
				)}`;

				api.sendGuessToBackend(
					currentGuess.lat.toString(),
					currentGuess.lng.toString(),
					false,
					false
				);
				// adding feature to map

				selectCountry();

				if (marker) leaflet.removeLayer(marker);
				if (copy) {
					navigator.clipboard.writeText(clipboard);
					show(1, 'Guess copied to clipboard');
				}
				marker = new L.Marker().setLatLng(currentGuess).setIcon(profileIcon).addTo(leaflet);
			}

			leaflet.on('click', onMapClick);
			console.log(node.onclick)

			lastMapType = 'Leaflet';
		});
	}
</script>

<svelte:head>
	<link
		rel="stylesheet"
		href="https://unpkg.com/leaflet@1.9.1/dist/leaflet.css"
		integrity="sha256-sA+zWATbFveLLNqWO2gtiw3HL/lh1giY/Inf1BJ0z14="
		crossorigin=""
	/>
</svelte:head>
<Flag {countryName} {flag} />
<div class="z-5 w-full h-full saturate-150" use:initLeaflet />
