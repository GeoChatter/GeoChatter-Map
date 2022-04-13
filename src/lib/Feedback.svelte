<script>
	import { supabase } from '$lib/supabase';
	import { HelpCircleIcon } from 'svelte-feather-icons';
	let feedback = '';

	async function sendFeedback() {
		const { data, error } = await supabase.from('Feedback').insert([{ feedback }]);
		feedback = '';
	}
</script>

<div class="dropdown dropdown-top z-[1000]">
	<label tabindex="0" class="btn "> Feedback <HelpCircleIcon class="ml-3" size="1.5x" /></label>
	<div tabindex="0" class="m-2 dropdown-content card card-compact w-64  bg-base-100 shadow ">
		<div class="card-body">
			<h3 class="card-title">Feedback</h3>
			<textarea
				on:keydown={(e) => e.stopImmediatePropagation() }
				bind:value={feedback}
				class="textarea textarea-primary h-48"
				placeholder="Write your feedback here..."
			/>
			<button on:click={sendFeedback} class="btn btn-primary">send feedback</button>
		</div>
	</div>
</div>
