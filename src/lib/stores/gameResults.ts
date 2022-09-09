
import type { MapRoundResult, MapGameEndResult, z } from "GCSocketClient"
type results = z.infer<typeof MapGameEndResult> | z.infer<typeof MapRoundResult>
import { writable } from 'svelte/store';
export const results = writable<results>([])