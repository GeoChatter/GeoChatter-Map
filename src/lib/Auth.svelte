<script>
	import { user, supabase, auth } from '$lib/supabase';

	import settings from './js/settings';
	import { LogOutIcon, LogInIcon } from 'svelte-feather-icons';
</script>

{#if $user}
	<div on:click={() => auth.signOut()} class="flex items-center ">
		<div class="mask mask-squircle w-10 h-10">
			<img src={$user.app_metadata.provider === "twitch"?  $user.user_metadata.picture : $user.user_metadata.avatar_url} alt="Avatar" />
		</div>
		<div class="font-medium">{$user.user_metadata.name}</div>

		<button class="z-[1000]">
			<LogOutIcon size="1x" />
		</button>
	</div>
{:else}
	<li class="btn btn-primary mb-2 text-white text-left uppercase">
		<button class="uppercase"
			on:click={async () =>
				await supabase.auth.signIn(
					{
						provider: 'twitch'
					},
					{
						redirectTo: window.location.href
					}
				)}>sign in with twitch <LogInIcon size="1x" /></button
		>
	</li>
	{#if $settings.values.testing}
	 <li class="btn hover:bg-white bg-white text-black text-left mb-2">
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
			class="uppercase"><img src="yt.png" class="w-6" /> sign in with youtube <LogInIcon size="1x" /></button
		>
	</li>
	{/if}
{/if}
