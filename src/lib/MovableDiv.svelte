<script lang="ts">
	export let close = false;
	import { XIcon } from 'svelte-feather-icons';
	let moving = false;
	function dragElement(node: HTMLDivElement) {
		var pos1 = 0,
			pos2 = 0,
			pos3 = 0,
			pos4 = 0;

		document.getElementById('header')!.onmousedown = dragMouseDown;

		function dragMouseDown(e: MouseEvent) {
			moving = true;

			e = e;
			e.preventDefault();
			// get the mouse cursor position at startup:
			pos3 = e.clientX;
			pos4 = e.clientY;
			document.onmouseup = closeDragElement;
			// call a function whenever the cursor moves:
			document.onmousemove = elementDrag;
		}

		function elementDrag(e: MouseEvent) {
			e.preventDefault();
			if (
				e.clientX < 0 ||
				e.clientX + 100 > window.innerWidth ||
				e.clientY < 0 ||
				e.clientY + 100 > window.innerHeight
			) {
				console.log('not on screen');
				return;
			}
			// calculate the new cursor position:
			pos1 = pos3 - e.clientX;
			pos2 = pos4 - e.clientY;
			pos3 = e.clientX;
			pos4 = e.clientY;

			// set the element's new position:
			let top = node.offsetTop - pos2;
			node.style.top = top + 'px';
			let left = node.offsetLeft - pos1;
			node.style.left = left + 'px';
		}

		function closeDragElement() {
			moving = false;
			/* stop moving when mouse button is released:*/
			document.onmouseup = null;
			document.onmousemove = null;
		}
	}
</script>

{#if !close}
	<div
		id="popup"
		class="hidden md:block select-none absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2  bottom-auto  z-[9000] pb-4 bg-base-200 rounded-xl overflow-hidden resize-x shadow-2xl "
		use:dragElement
	>
		<div class="w-full flex justify-between p-2 " id="header">
			<div>Drag me</div>
			<button class="btn btn-xs btn-circle" on:click={() => (close = true)}
				><XIcon size="1x" /></button
			>
		</div>

		<div class={moving ? 'pointer-events-none' : 'pointer-events-auto'}>
			<slot />
		</div>
	</div>
{/if}
