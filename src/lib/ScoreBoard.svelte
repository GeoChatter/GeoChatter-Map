<script lang="ts">
	import { getPlayerNameFromPlayer } from '$lib/js/helpers/getPlayerNameFromPlayer';
    import type {MapRoundResult, MapGameEndResult, z} from "GCSocketClient"
    import {results} from "$lib/stores/gameResults"
    import {svgs} from "$lib/js/helpers/getFeature"


    type gamePlayer = z.infer<typeof MapGameEndResult>[0]
    type roundPlayer = z.infer<typeof MapRoundResult>[0]


	// different ways to sort it
	const sortScore = (row1: gamePlayer  | roundPlayer, row2: gamePlayer  | roundPlayer) => row2.score - row1.score;
	const sortDistance = (row1: gamePlayer  | roundPlayer, row2: gamePlayer  | roundPlayer) =>
		row1.distance - row2.distance;

	const sortStreak = (row1: gamePlayer  | roundPlayer, row2: gamePlayer  | roundPlayer) =>
		row2.streak - row1.streak;
    type results= z.infer<typeof MapGameEndResult> | z.infer<typeof MapRoundResult> 
    

	let currSort: (row1: gamePlayer  | roundPlayer, row2: gamePlayer  | roundPlayer) => number;

	currSort = sortScore;

</script>

<table class="table table-compact w-full h-fit">
	<thead>
		<tr>
			<th />
			<th />
			<th>Name</th>
			<th class="cursor-pointer" on:click={() => (currSort = sortDistance)}>Distance</th>
				<th class="cursor-pointer" on:click={() => (currSort = sortScore)}>Score</th>
				<th class="cursor-pointer" on:click={() => (currSort = sortStreak)}>Streak</th>
		</tr>
	</thead>
	{#each $results.data.sort(currSort) as player, i} <tbody>
			<tr>
				<th>{i + 1}</th>
				<th>
				{#if player?.playerFlag}
			<div
			class="pointer-events-none user-select-none"
				style={`background-size: contain;background-position: 50%;background-repeat: no-repeat;background-image: url('${svgs[player.playerFlag]}'); height:20px;width:20px`}
			/>
			{:else}

			<div
			class="pointer-events-none user-select-none"
				style={`background-size: contain;background-position: 50%;background-repeat: no-repeat; height:20px;width:20px`}
			/>
			{/if}
			</th>
				<th>
					<a
						href={'https://twitch.tv/' + player.displayName ?? player.userName}
						target="_blank"
					>
						<div class="flex items-center space-x-2">
									{player.wasRandom ? "*" : ""}	{getPlayerNameFromPlayer(player)}
						</div>
					</a>
				</th>
				<th>{player.distance.toLocaleString("en", {style: "unit", unit: "meter", unitDisplay: "narrow", notation: "compact"}).toLowerCase()}</th>

				<!-- not showing score in streaks game  -->
					<th>{player.score.toFixed(0)} </th>
					<th>{player.streak} </th>
			</tr>
		</tbody>
	{/each}
</table>

