<script>
	import { user } from '$lib/supabase';
	import { browser } from '$app/env';
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

	$: copy = !$user || $settings.values.copyAndPaste;

	let profileIcon;
	let flag = '';
	if (browser) {
		profileIcon = L.icon({
			iconUrl: $user?.user_metadata?.picture ?? 'test.png',
			iconSize: [30, 30],
			className: 'rounded-full border-2 border-white'
		});
	}
	let countryName = '';
	function initLeaflet(node) {
		let marker;
		let layers = {
			STREETS: L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=en', {
				maxZoom: 20,
				subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
				attribution: '&copy; Google Maps'
			}),
			SATELLITE: L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}&hl=en', {
				maxZoom: 20,
				subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
				attribution: '&copy; Google Maps'
			}),
			TERRAIN: L.tileLayer('https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}&hl=en', {
				maxZoom: 20,
				subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
				attribution: '&copy; Google Maps'
			}),
			OSM: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				maxZoom: 19,
				attribution:
					'&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
			}),

			OPENTOPOMAP: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
				maxZoom: 17,
				attribution:
					'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
			})
		};

		let center = [0, 0];
		let zoom = 1;
		let currSelectedCountry;

		async function selectCountry() {
			const [country, svg, countryNameResponse] = await getCountry(
				currentGuess.wrap().lat,
				currentGuess.wrap().lng
			);

			countryName = country?.properties?.shapeName ?? countryNameResponse;

			flag = svg;

			if (currSelectedCountry) {
				leaflet.removeLayer(currSelectedCountry);
			}
			currSelectedCountry = L.geoJSON(country, { style: { fillOpacity: 0.1 } }).addTo(leaflet);
		}

		if (lastMapType === 'MapBox') {
			zoom = mapBox.getZoom() + 1;
			center = mapBox.getCenter();
		}
		if (browser) {
			leaflet = L.map(node, { zoomControl: false, worldCopyJump: true }).setView(center, zoom);
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

			// adding feature to map

			selectCountry();

			if (marker) leaflet.removeLayer(marker);
			if (copy) {
				navigator.clipboard.writeText(clipboard);
				show(0.5, 'guess copied to clipboard');
			}
			marker = new L.Marker().setLatLng(currentGuess).setIcon(profileIcon).addTo(leaflet);
		}

		leaflet.on('click', onMapClick);
		lastMapType = 'Leaflet';
	}
</script>

<Flag {countryName} {flag} />
<div class="z-5 w-full h-full saturate-150" use:initLeaflet />
