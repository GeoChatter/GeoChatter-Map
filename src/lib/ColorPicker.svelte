<script lang="ts">
	import iro from '@jaames/iro';

	export let handleColor: (color: string) => void;

	import { Color } from '$lib/js/helpers/colors';

	const shouldUseDarken = Color.ShouldUseDark;

	let bgColor  
	let dark
	function init(node) {
		const colorPicker = iro.ColorPicker(node, {
			width: 100,
			// layoutDirection: 'horizontal',
			sliderSize: 10
		});
		colorPicker.on('color:change', (color) => {
			    bgColor = color.hexString
				dark = shouldUseDarken(color.hexString);
				handleColor(color.hexString);
		
	})}

</script>
<div style={`background-color: ${bgColor};`} class={dark ? `rounded-md m-2 p-2 border-black border-2 ` : `border-white rounded-md m-2 p-2 border-2  `}>
  	<div   use:init />
</div>