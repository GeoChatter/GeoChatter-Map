<script>
	import { user, supabase, auth } from '$lib/supabase';

	import settings from './js/settings';
	import { LogOutIcon, LogInIcon } from 'svelte-feather-icons';
</script>

{#if $user}
	<div on:click={() => auth.signOut()} class="flex items-center ">
		<div class="mask mask-squircle w-10 h-10">
			<img
				src={$user.app_metadata.provider === 'twitch'
					? $user.user_metadata.picture
					: $user.user_metadata.avatar_url}
				alt="Avatar"
			/>
		</div>
		<div class="font-medium">{$user.user_metadata.name}</div>

		<button class="z-[1000]">
			<LogOutIcon size="1x" />
		</button>
	</div>
{:else}
	<li class="btn w-full btn-primary mb-2 text-white text-left uppercase">
		<button
			class="uppercase"
			on:click={async () =>
				await supabase.auth.signIn(
					{
						provider: 'twitch'
					},
					{
						redirectTo: window.location.href
					}
				)}><div class="flex">sign in with twitch <LogInIcon class="ml-2" size="1x" /></div></button
		>
	</li>
	{#if $settings.values.testing}
		<li class="btn w-full btn-primary mb-2 text-white text-left uppercase">
			<button
				on:click={async () =>
					await supabase.auth.signIn(
						{
							provider: 'google'
						},
						{
							redirectTo: window.location.href,
							scopes: 'https://www.googleapis.com/auth/youtube.readonly'
						}
					)}
				class="uppercase"
				><div class="flex items-center">
					<!-- <img src="yt.png" class="h-fit w-6" /> -->
					sign in with youtube <LogInIcon class="ml-2" size="1x" />
				</div></button
			>
		</li>
	{/if}
{/if}
