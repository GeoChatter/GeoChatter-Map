import { createClient } from '@supabase/supabase-js';
import { readable } from 'svelte/store';

export const supabase = createClient(
	import.meta.env.VITE_SUPABASEURL as string,
	import.meta.env.VITE_SUPABASEANONKEY as string,
	{
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: true

	}
);

export const user = readable(supabase.auth.user(), (set) => {
	supabase.auth.onAuthStateChange((event, session) => {
		if (event == 'SIGNED_OUT') {
			set(null);
		} else {
			set(supabase.auth.user());
		}
	});
});

export const auth = supabase.auth;
