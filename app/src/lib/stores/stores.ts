import { browser } from "$app/env";
import type { Item } from "$lib/types";
import type { Writable } from "svelte/store";
import { derived, get, writable } from "svelte/store";
import { settings } from "./settings";

export const updateTrack = writable<{ originalUrl?: string; url?: string }>({
	url: null,
	originalUrl: null
});
export const ctxKey = {};
export const currentTitle = writable(undefined);

type Alert = {
	msg?: string;
	action?: string;
	type?: string;
};
type AlertStore = {
	subscribe: Writable<Alert>["subscribe"];
	set: Writable<Alert>["set"];
	update: Writable<Alert>["update"];
};

// Derived from Settings
export const theme = derived(settings, ($settings) => $settings.theme);
export const filterAutoPlay = derived(
	settings,
	($settings) => $settings?.dedupe
);
export const preferWebM = derived(
	settings,
	($settings) => $settings?.preferWebM
);

// Alert
export const alertHandler: AlertStore = writable({
	msg: undefined,
	type: undefined,
	action: undefined
});

export const isPagePlaying = writable();
export const key = writable<number>(0);
export const currentId = writable("");
export const playerLoading = writable(false);

export const showAddToPlaylistPopper = writable<{
	state: boolean;
	item?: Item | Item[] | unknown;
}>({ state: false });

export const currentMix = writable({
	videoId: "",
	playlistId: "",
	list: [
		{ id: "", videoId: "", thumbnail: "", artist: "", title: "", length: "" }
	]
});
