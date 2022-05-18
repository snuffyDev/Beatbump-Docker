/* eslint-disable @typescript-eslint/no-explicit-any */
import { browser } from "$app/env";
import { sort } from "./endpoints/playerUtils";
import {
	alertHandler,
	currentId,
	preferWebM,
	updateTrack
} from "./stores/stores";
import { findFirst } from "./utils/collections";

// notifications
export const notify = (
	msg: string,
	type: "success" | "error",
	action?: string
): void => {
	alertHandler.set({
		msg: msg,
		type: type,
		action
	});
};
// Shuffle array positions
export function seededShuffle<T>(array: T[], _seed?: number): T[] {
	let rand: () => number;

	if (typeof _seed === "number") {
		let seed = _seed;
		// Seeded random number generator in JS. Modified from:
		// https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
		rand = () => {
			const x = Math.sin(seed++) * 179426549; // throw away most significant digits and reduce any potential bias
			return x - Math.floor(x);
		};
	} else {
		rand = Math.random;
	}

	for (let i = array.length - 1; i > 0; i -= 1) {
		const j = Math.floor(rand() * (i + 1));
		const temp = array[i];
		array[i] = array[j];
		array[j] = temp;
	}
	return array;
}

export function shuffle(array: any[], index: number): any[] {
	array = [
		...array.slice(0, index),
		array[index],
		...array.slice(index + 1).sort(() => Math.random() - 0.5)
	];
	// array.sort(() => Math.random() - 0.5)
	return array;
}
function format(seconds) {
	if (isNaN(seconds)) return "...";

	const minutes = Math.floor(seconds / 60);
	seconds = Math.floor(seconds % 60);
	if (seconds < 10) seconds = "0" + seconds;

	return `${minutes}:${seconds}`;
}

// Fetches a song length for adding to queue
export const addToQueue = async (videoId: string): Promise<string> => {
	const url = `/api/player.json${videoId ? `?videoId=${videoId}` : ""}`;
	const data = await fetch(url, { headers: { accept: "application/json" } })
		.then((json) => json.json())
		.catch((err) => console.log(err));
	const length = format(data.videoDetails.lengthSeconds);
	return length;
};

// Get source URLs
export const getSrc = async (
	videoId?: string,
	playlistId?: string,
	params?: string
): Promise<{ body: string; error?: boolean }> => {
	let webM;
	const unsubscribe = preferWebM.subscribe((v) => {
		webM = v ? true : false;
	});
	unsubscribe();
	const res = await fetch(
		`/api/player.json?videoId=${videoId}${
			playlistId ? `&playlistId=${playlistId}` : ""
		}${params ? `&playerParams=${params}` : ""}`
	);
	const data = await res.json();
	const formats = sort(data, webM);
	currentId.set(videoId);
	console.log(formats);
	const src = formats[0].url !== null ? setTrack(formats, webM) : handleError();

	return src;
};

function setTrack(formats = [], webM) {
	if (webM) {
		const item = findFirst(formats, (v) => v.mimeType === "webm");
		const parsedURL = item !== undefined ? item.url : formats[0].url;
		updateTrack.set({
			originalUrl: formats[0].original_url,
			url: parsedURL
		});
		return { body: parsedURL, error: false };
	}
	const parsedURL = formats[0].url;
	updateTrack.set({
		originalUrl: formats[0].original_url,
		url: parsedURL
	});
	return { body: parsedURL, error: false };
}
function handleError() {
	console.log("error");

	notify(
		"An error occurred while initiating playback, skipping...",
		"error",
		"getNextTrack"
	);
	return {
		body: null,
		error: true
	};
}

export const queryParams = (params: Record<any, any>): string =>
	Object.keys(params)
		.map((k) => {
			if (params[k] == undefined) return;
			return k + "=" + params[k];
		})
		.join("&");
// parse array object input for child

export const pb = (input: string, query: string, justOne = false): any => {
	const iterate = (x: string | any, y: string | number) => {
		let r = [];

		Object.prototype.hasOwnProperty.call(x, y) && r.push(x[y]);
		if (justOne && Object.prototype.hasOwnProperty.call(x, y)) {
			return r.shift();
		}

		if (x instanceof Array) {
			for (let i = 0; i < x.length; i++) {
				r = r.concat(iterate(x[i], y));
			}
		} else if (x instanceof Object) {
			const c = Object.keys(x);
			if (c.length > 0) {
				for (let i = 0; i < c.length; i++) {
					r = r.concat(iterate(x[c[i]], y));
				}
			}
		}
		return r.length == 1 ? r.shift() : r;
	};

	let d = query.split(":"),
		v = input;
	for (let i = 0; i < d.length; i++) {
		v = iterate(v, d[i]);
	}
	return v;
};
