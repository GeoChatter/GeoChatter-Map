<script lang="ts">
	export let flag = '';
	export let countryName = '';
</script>

<div class="z-[3999] user-select-none pointer-events-none absolute top-24 flex justify-center w-full  hover:opacity-60">
	{#if flag}
		<div class="tooltip user-select-none tooltip-open tooltip-top pointer-events-auto" data-tip={countryName}>
			<div
			class="pointer-events-none user-select-none"
				style={`background-size: contain;background-position: 50%;background-repeat: no-repeat;background-image: url('${flag}'); height:100px;width:100px`}
			/>
		</div>
	{/if}
</div>
