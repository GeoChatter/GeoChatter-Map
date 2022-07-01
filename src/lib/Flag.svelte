<script lang="ts">
	export let flag = '';
	export let countryName = '';
</script>

<div class="z-[5999] pointer-events-none absolute top-24 flex justify-center w-full">
	{#if flag}
		<div class="tooltip tooltip-open tooltip-top pointer-events-auto" data-tip={countryName}>
			<div
				style={`background-size: contain;background-position: 50%;background-repeat: no-repeat;background-image: url('${flag}'); height:100px;width:100px`}
			/>
		</div>
	{/if}
</div>
