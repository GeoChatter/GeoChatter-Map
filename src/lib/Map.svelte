<script>
	import { user, auth, supabase } from '$lib/supabase';
	import { browser } from '$app/environment';
	import { mapType, styles } from '$lib/MapPicker.svelte';
	import { LogInIcon, EyeOffIcon, ListIcon, FlagIcon, AwardIcon } from 'svelte-feather-icons';
	import { roundSettings } from '$lib/js/api';
	import Leaflet from './Leaflet.svelte';
	import MapBox from './MapBox.svelte';
	import Feedback from '$lib/Feedback.svelte';
	import { spacePlonkShortcut } from '$lib/shortcut';
	import api from '$lib/js/api';
	import QuickSwitch from '$lib/QuickSwitch.svelte';
	import Alert, { show } from '$lib/Alert.svelte';
	import MovableDiv from '$lib/MovableDiv.svelte';
	import Twitch from '$lib/Twitch.svelte';
	import settings from '$lib/js/settings';
	import ScoreBoard from './ScoreBoard.svelte';

	import { scoreBoardOpen } from '$lib/js/api';
	import { results } from './stores/gameResults';

	let lastMapType;
	let _3DEnabled = false;
	let exaggeration = 1;
	let zoomSensitivity = 100;

	function randomGuess() {
		loading = true;
		setTimeout(() => {
			loading = false;
		}, 5000);
		api.sendGuessToBackend('0', '0', true, true);
	}

	let classListSettings = `relative w-full h-full`;

	roundSettings.subscribe((settings) => {
		classListSettings = `relative w-full h-full  ${settings.blurry ? 'blur-md' : ''} ${
			settings.sepia ? 'sepia' : ''
		} ${settings.blackAndWhite ? 'grayscale' : ''}  ${settings.upsideDown ? 'scale-y-[-1]' : ''} ${
			settings.mirrored ? 'scale-x-[-1]' : ''
		} `;
	});

	// checking for cheating
	setInterval(() => {
		const container = document.getElementById('map_settings');
		if (browser) {
			if (container?.className && container?.className !== classListSettings) {
				alert('anti cheat error');
			}
		}
	}, 500);

	function setSettingsFromLocalStorage() {
		if (browser) {
			let mapTypeCookie = localStorage.getItem('mapType');
			let _3d = $settings.values._3d;
			let sens = $settings.values.sens;
			let ex = $settings.values.ex;
			if (mapTypeCookie) {
				if (styles.includes(mapTypeCookie)) {
					$mapType = mapTypeCookie;
				}
			}
			if (_3d) {
				_3DEnabled = true;
			} else {
				_3DEnabled = false;
			}
			if (sens) {
				zoomSensitivity = sens;
			}
			if (ex) {
				exaggeration = ex;
			}
			mapType.subscribe((type) => localStorage.setItem('mapType', type));
		}
	}

	let currentGuess;
	let mapBox;
	let leaflet;

	if (browser) {
		try {
			const splitLink = window.location.href.split('?');
			api.streamerCode = splitLink[1].split('#')[0];
		} catch (e) {
			console.log(e);
		}
	}

	setSettingsFromLocalStorage();

	let loading = false;
	let newBot;
	let openScoreBoardDuringRound = false;

	let randomGuessModal = false;
</script>

{#if randomGuessModal}
	<div class="modal modal-open z-[9999]">
		<div class="modal-box relative w-fit">
			<div class="flex justify-between">
				<h3 class="font-bold px-6">Do you want to guess a random country?</h3>
				<button
					on:click={() => {
						randomGuessModal = false;
					}}
					class="btn btn-sm btn-circle ">✕</button
				>
			</div>
			<div class="grid">
				<div class="flex justify-center space-x-3  items-center">
					<button
						on:click={() => {
							randomGuessModal = false;
						}}
						class="btn btn-sm btn-secondary">Let me think about it</button
					>
					<button
						on:click={() => {
							randomGuess();
							randomGuessModal = false;
						}}
						class="btn btn-sm btn-primary">Yes!</button
					>
				</div>
				<div class="flex justify-center space-x-3 items-center pt-2">
					<input
						type="checkbox"
						class="toggle"
						on:click={() => {
							settings.change('confirmedRandomGuess', !settings.values.confirmedRandomGuess);
						}}
						checked={$settings.values.confirmRandomGuess}
					/>
					<span class="text-sm">don't show again</span>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if api.streamerCode}
	{#if $settings.values.showStreamOverlay && $settings.streamerSettings.twitchChannelName}
		<MovableDiv><Twitch /></MovableDiv>
	{/if}
	<btn
		on:click={() => {
			openScoreBoardDuringRound = true;
		}}
		class="btn btn-warning absolute z-[3900] top-32 left-2"><AwardIcon /></btn
	>
	{#if openScoreBoardDuringRound || !$scoreBoardOpen}
		<!-- <div class="modal modal-open"> -->
		<MovableDiv>
			<!-- <div class="modal-box relative"> -->
			<div class="overflow-auto h-96 ">
				<label
					for="my-modal-3"
					on:click={() => {
						openScoreBoardDuringRound = false;
						scoreBoardOpen.set(true);
					}}
					class="btn btn-sm btn-circle absolute right-2 top-2">✕</label
				>
				<h3 class="text-lg font-bold p-2">{$results.title}</h3>
				<ScoreBoard />
			</div>
			<!-- </div> -->
		</MovableDiv>
		<!-- </div> -->
	{/if}

	<Alert />
	<div class="hidden sm:flex absolute bottom-8 left-2 ">
		<Feedback />
	</div>
	<QuickSwitch />
	<div class=" z-[1000] w-80 h-32 absolute bottom-0 right-0 ">
		{#if $user}
			<button
				disabled={!currentGuess || !$user || loading}
				use:spacePlonkShortcut={{ code: 'Space', default: true }}
				class="btn pointer-events-auto   z-[3000] btn-wide btn-primary disabled:opacity-100   absolute bottom-8 right-24"
				on:click={() => {
					loading = true;
					setTimeout(() => {
						loading = false;
					}, 5000);
					api.sendGuessToBackend(currentGuess.lat.toString(), currentGuess.lng.toString());
				}}
			>
				{#if !loading}
					{#if $user}
						send guess {#if $settings.values.spacePlonking}(SPACE){/if}
					{:else}
						login to guess without pasting in twitch chat
					{/if}
				{:else}
					loading...
				{/if}
			</button>
			<button
				disabled={loading}
				on:click={() => {
					if ($settings.values.confirmedRandomGuess) {
						randomGuess();
					} else {
						randomGuessModal = true;
					}
				}}
				class="btn pointer-events-auto   z-[3000]  btn-secondary disabled:opacity-100 absolute bottom-8 right-5"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					xmlns:xlink="http://www.w3.org/1999/xlink"
					id="svg"
					version="1.1"
					width="35"
					height="35.04761904761904"
					viewBox="0, 0, 400,419.04761904761904"
				>
					<g id="svgg"
						><path
							id="path1"
							d="M77.000 19.627 C 41.229 19.858,34.703 19.988,33.001 20.503 C 22.585 23.650,13.743 32.537,11.012 42.600 C 9.959 46.483,9.503 91.670,9.735 169.400 C 9.968 247.944,10.033 249.627,13.060 255.172 C 16.740 261.913,22.171 266.870,29.790 270.440 L 33.118 272.000 136.491 272.000 L 239.864 272.000 243.632 270.146 C 252.560 265.752,256.685 261.513,261.092 252.200 L 262.796 248.600 262.798 145.736 L 262.800 42.872 260.799 38.874 C 255.445 28.181,247.744 21.769,238.600 20.393 C 231.406 19.310,170.742 19.022,77.000 19.627 M233.710 32.356 C 239.830 32.785,241.603 33.629,245.881 38.152 C 250.632 43.175,250.288 35.549,250.614 143.000 C 250.908 239.567,250.815 245.221,248.863 249.390 C 247.174 253.000,243.580 256.534,239.589 258.509 L 236.578 260.000 151.189 259.971 C 104.225 259.955,58.870 259.809,50.400 259.647 L 35.000 259.353 32.733 258.314 C 26.150 255.296,23.170 250.131,22.757 241.023 C 22.365 232.372,22.361 62.001,22.753 51.797 C 23.142 41.643,25.653 37.189,33.036 33.552 L 35.780 32.200 49.190 31.958 C 69.130 31.598,227.784 31.940,233.710 32.356 M69.571 57.625 C 46.125 61.077,40.291 92.195,60.800 104.412 C 66.770 107.968,79.703 107.862,85.411 104.210 C 95.070 98.031,98.966 89.164,97.267 77.221 C 95.604 65.524,81.879 55.813,69.571 57.625 M192.302 58.772 C 165.530 67.511,171.839 107.200,200.000 107.200 C 221.980 107.200,233.063 81.537,218.014 65.484 C 211.483 58.517,201.260 55.848,192.302 58.772 M204.877 70.910 C 210.060 73.327,212.584 77.085,212.594 82.400 C 212.623 98.021,189.360 99.640,187.399 84.154 C 186.163 74.396,196.140 66.836,204.877 70.910 M77.825 70.671 C 85.594 73.318,88.138 84.646,82.378 90.948 C 74.700 99.348,60.393 94.188,60.402 83.021 C 60.410 73.540,68.797 67.594,77.825 70.671 M128.073 122.361 C 113.128 127.523,106.739 148.112,116.208 160.600 C 132.996 182.740,166.982 166.379,160.584 139.237 C 158.699 131.242,150.397 123.201,142.800 122.013 C 138.407 121.326,130.531 121.512,128.073 122.361 M272.643 127.238 C 269.544 129.676,269.302 134.338,272.176 136.221 C 273.360 136.997,278.094 138.947,287.400 142.492 C 298.993 146.908,301.396 147.806,309.400 150.708 C 313.075 152.041,323.745 155.958,334.200 159.813 C 338.160 161.272,342.570 162.887,344.000 163.400 C 371.089 173.116,372.575 173.933,376.010 181.000 C 379.196 187.555,378.368 191.360,366.731 223.600 C 366.056 225.470,365.096 228.170,364.597 229.600 C 363.659 232.287,360.033 242.207,356.921 250.600 C 355.942 253.240,354.806 256.390,354.396 257.600 C 353.987 258.810,352.821 262.050,351.807 264.800 C 350.792 267.550,348.784 273.040,347.345 277.000 C 344.927 283.652,340.917 294.574,338.606 300.800 C 338.075 302.230,336.455 306.640,335.004 310.600 C 333.554 314.560,331.667 319.690,330.811 322.000 C 329.229 326.267,327.377 331.276,322.600 344.200 C 308.568 382.167,309.076 381.131,302.800 384.546 C 296.463 387.994,293.627 387.994,283.778 384.550 C 279.610 383.092,274.760 381.396,273.000 380.781 C 265.532 378.171,256.823 375.065,248.400 372.009 C 243.450 370.213,235.440 367.327,230.600 365.596 C 225.760 363.865,217.750 360.985,212.800 359.195 C 207.850 357.406,201.370 355.063,198.400 353.990 C 195.430 352.917,189.490 350.757,185.200 349.190 C 174.975 345.456,171.493 344.190,163.800 341.409 C 160.280 340.136,156.050 338.602,154.400 338.000 C 152.750 337.398,147.080 335.336,141.800 333.419 C 129.988 329.130,125.195 327.382,122.600 326.418 C 118.364 324.844,111.664 322.433,108.600 321.380 C 105.651 320.367,105.131 320.011,101.969 316.840 C 95.023 309.877,94.021 304.216,97.730 292.891 C 100.814 283.475,99.539 280.019,93.151 280.481 C 89.633 280.735,88.459 282.381,85.361 291.400 C 82.977 298.344,82.941 308.466,85.280 314.257 C 88.104 321.249,95.815 329.260,102.036 331.665 C 105.019 332.818,112.064 335.454,115.200 336.590 C 120.993 338.688,125.832 340.450,134.400 343.580 C 139.350 345.388,145.110 347.491,147.200 348.253 C 149.290 349.015,151.900 349.973,153.000 350.382 C 154.100 350.791,157.070 351.865,159.600 352.769 C 162.130 353.673,165.100 354.760,166.200 355.185 C 167.300 355.609,172.250 357.414,177.200 359.195 C 182.150 360.977,187.100 362.775,188.200 363.190 C 191.718 364.518,194.276 365.447,210.800 371.397 C 219.710 374.606,227.900 377.579,229.000 378.003 C 230.100 378.428,236.310 380.677,242.800 383.001 C 249.290 385.326,255.320 387.510,256.200 387.855 C 266.582 391.927,287.415 398.864,290.200 399.177 C 303.795 400.707,319.080 391.469,322.591 379.600 C 322.754 379.050,323.304 377.520,323.815 376.200 C 324.803 373.644,325.287 372.337,331.574 355.200 C 333.794 349.150,336.047 343.030,336.581 341.600 C 337.115 340.170,338.204 337.200,339.000 335.000 C 339.797 332.800,340.791 330.100,341.210 329.000 C 341.629 327.900,343.960 321.510,346.390 314.800 C 348.821 308.090,351.160 301.700,351.588 300.600 C 352.328 298.699,356.778 286.436,361.459 273.400 C 362.644 270.100,363.874 266.770,364.192 266.000 C 364.510 265.230,365.414 262.800,366.200 260.600 C 366.987 258.400,368.065 255.430,368.596 254.000 C 370.158 249.792,376.826 231.277,378.032 227.800 C 378.642 226.040,379.784 222.800,380.570 220.600 C 391.432 190.178,392.050 185.858,386.969 175.884 C 382.044 166.218,378.462 163.406,364.200 158.013 C 349.948 152.624,349.711 152.535,345.600 151.004 C 343.510 150.226,340.900 149.242,339.800 148.818 C 337.737 148.024,336.071 147.411,321.800 142.206 C 317.180 140.521,311.060 138.274,308.200 137.214 C 305.340 136.154,302.190 135.012,301.200 134.676 C 300.210 134.341,295.890 132.779,291.600 131.206 C 277.210 125.929,274.917 125.449,272.643 127.238 M140.895 134.095 C 148.104 136.612,151.436 145.495,147.653 152.108 C 141.232 163.329,124.857 159.606,124.086 146.749 C 123.528 137.447,132.072 131.014,140.895 134.095 M194.515 185.004 C 181.096 187.920,172.268 202.563,175.956 215.786 C 181.152 234.415,204.098 240.536,217.576 226.889 C 234.911 209.338,218.628 179.764,194.515 185.004 M65.800 185.362 C 44.018 192.280,42.037 222.191,62.703 232.120 L 66.200 233.800 72.800 233.799 C 81.826 233.799,84.989 232.577,90.600 226.924 C 102.388 215.048,99.316 195.183,84.468 187.269 C 80.170 184.978,70.212 183.960,65.800 185.362 M294.800 191.733 C 287.709 193.837,282.025 198.838,278.664 205.931 L 277.400 208.600 277.400 215.800 L 277.400 223.000 278.644 225.600 C 292.077 253.676,333.345 238.881,325.639 208.752 C 322.379 196.004,307.702 187.905,294.800 191.733 M78.929 198.180 C 86.083 201.805,87.705 213.810,81.712 218.775 C 76.123 223.405,69.587 223.354,64.472 218.639 C 53.656 208.670,65.777 191.516,78.929 198.180 M205.383 198.005 C 213.309 201.846,215.121 211.838,209.028 218.107 C 203.820 223.466,196.293 223.514,191.001 218.222 C 181.177 208.398,192.881 191.947,205.383 198.005 M307.142 204.069 C 313.370 207.084,316.268 214.773,313.393 220.651 C 306.632 234.469,286.171 227.710,289.411 212.729 C 291.054 205.133,300.157 200.687,307.142 204.069 M152.578 279.984 C 147.994 281.840,148.194 287.597,153.034 293.115 C 162.164 303.526,179.487 303.986,189.027 294.072 C 194.937 287.931,195.585 283.138,190.865 280.485 C 187.860 278.795,185.635 279.683,181.000 284.422 C 174.284 291.287,166.738 290.863,160.704 283.280 C 158.041 279.932,155.375 278.851,152.578 279.984 M260.000 287.041 C 244.307 291.234,236.726 311.836,246.167 324.636 C 256.276 338.343,272.831 340.142,284.397 328.791 C 289.964 323.327,291.400 319.631,291.400 310.769 L 291.400 304.139 289.644 300.569 C 284.320 289.749,271.596 283.942,260.000 287.041 M271.600 299.282 C 279.773 301.716,282.322 313.819,275.961 319.992 C 266.953 328.733,251.901 320.675,254.597 308.555 C 256.343 300.707,263.422 296.847,271.600 299.282 "
							stroke="none"
							fill="white"
							fill-rule="evenodd"
						/></g
					></svg
				>
			</button>
		{:else}
			<button
				class="btn btn-primary  absolute bottom-8 right-5"
				on:click={() => $settings.change('drawerOpen', true)}
			>
				<LogInIcon class="mr-3" size="1x" />sign in to guess on site</button
			>
		{/if}
	</div>
	<div id="map_settings" class={classListSettings}>
		{#if !$mapType.startsWith('3D')}
			<Leaflet
				bind:lastMapType
				bind:bot={api.streamerCode}
				bind:leaflet
				bind:mapBox
				bind:currentGuess
				{mapType}
			/>
		{:else}
			{#each styles as style}
				{#if style === $mapType}
					<MapBox
						bind:mapBox
						bind:lastMapType
						bind:bot={api.streamerCode}
						bind:_3DEnabled
						bind:zoomSensitivity
						bind:exaggeration
						bind:currentGuess
						bind:leaflet
					/>
				{/if}
			{/each}
		{/if}
	</div>
{:else}
	<div
		class="w-full h-full text-center uppercase flex flex-col gap-2 items-center justify-center  "
	>
		please use the full link from the streamer or fill in the map identifier name below
		<input class="input input-bordered" placeholder="map identifier..." bind:value={newBot} />
		<button class="btn btn-primary" on:click={() => (api.streamerCode = newBot)}>go</button>
	</div>
{/if}
