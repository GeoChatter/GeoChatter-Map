<script context="module" lang="ts">
	import { writable } from 'svelte/store';

	import { fade, fly } from 'svelte/transition';

	const showing = writable(false);
	const text = writable('');

	let oldTimout: ReturnType<typeof setTimeout>;
	export const show = (seconds: number, message: string) => {
		text.set(message);
		showing.set(true);
		// maybe flash once every time so you know its new
		clearTimeout(oldTimout);
		oldTimout = setTimeout(() => {
			showing.set(false);
		}, seconds * 1000);
	};
</script>

{#if $showing}
	<div
		in:fly
		out:fly
		class="absolute bottom-24 md:bottom-8 pointer-events-none  w-full flex justify-center z-[80000]"
	>
		<div class="w-fit alert alert-success shadow-2xl">
			<div>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="stroke-current flex-shrink-0 h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
					/></svg
				>
				<span>{$text}</span>
			</div>
		</div>
	</div>
{/if}
