<script lang="ts">
	import { getPlayerNameFromPlayer } from '$lib/js/helpers/getPlayerNameFromPlayer';
    import type {MapRoundResult, MapGameEndResult, z} from "GCSocketClient"
    import {results} from "$lib/stores/gameResults"


    type gamePlayer = z.infer<typeof MapGameEndResult>[0]
    type roundPlayer = z.infer<typeof MapRoundResult>[0]


	// different ways to sort it
	const sortScore = (row1: gamePlayer  | roundPlayer, row2: gamePlayer  | roundPlayer) => row2.score - row1.score;
	const sortDistance = (row1: gamePlayer  | roundPlayer, row2: gamePlayer  | roundPlayer) =>
		row1.distance - row2.distance;

	const sortStreak = (row1: gamePlayer  | roundPlayer, row2: gamePlayer  | roundPlayer) =>
		row2.streak - row1.streak;
    type results= z.infer<typeof MapGameEndResult> | z.infer<typeof MapRoundResult> 
    

	let currSort: (row1: gamePlayer  | roundPlayer, row2: gamePlayer  | roundPlayer) => void;

	currSort = sortScore;
</script>

<table class="table table-compact w-full h-full">
	<thead>
		<tr>
			<th />
			<th>Name</th>
			<th class="cursor-pointer" on:click={() => (currSort = sortDistance)}>Distance</th>
				<th class="cursor-pointer" on:click={() => (currSort = sortScore)}>Score</th>
				<th class="cursor-pointer" on:click={() => (currSort = sortStreak)}>Streak</th>
		</tr>
	</thead>
    <!--  ignoring this type error i would need to constrain a generic to one or the other type  -->
	{#each $results.data.sort(currSort) as player, i}
		<tbody>
			<tr>
				<th>{i + 1}</th>
				<th>
					<a
						href={'https://twitch.tv/' + player.displayName ?? player.userName}
						target="_blank"
					>
						<div class="flex items-center space-x-2">
										{getPlayerNameFromPlayer(player)}
						</div>
					</a>
				</th>
				<th>{Math.round(player.distance)} km</th>

				<!-- not showing score in streaks game  -->
					<th>{player.score} </th>
					<th>{player.streak} </th>
			</tr>
		</tbody>
	{/each}
</table>

