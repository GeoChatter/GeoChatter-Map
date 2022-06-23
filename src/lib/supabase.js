import { createClient } from '@supabase/supabase-js';
import { readable } from 'svelte/store';

export const supabase = createClient(
	// @ts-ignore
	import.meta.env.VITE_SUPABASEURL,
	// @ts-ignore
	import.meta.env.VITE_SUPABASEANONKEY,	
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
