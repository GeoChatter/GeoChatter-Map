<script lang="ts">
	import iro from '@jaames/iro';

	export let handleColor: (color: string) => void;

	let timeout: NodeJS.Timeout;

	function init(node) {
		const colorPicker = iro.ColorPicker(node, {
			width: 100,
			layoutDirection: 'horizontal',
			sliderSize: 10
		});
		colorPicker.on('color:change', (color) => {
			if (timeout) {
				clearTimeout(timeout);
			}
			timeout = setTimeout(() => {
				handleColor(color.hexString);
			}, 3000);
		});
	}
</script>

<div use:init />
