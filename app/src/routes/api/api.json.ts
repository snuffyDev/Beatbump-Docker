import Context from "./_modules/context";
import { parseArtist } from "./_modules/parsers/artist";
import { parseNextTrack } from "./_modules/parsers/next";
import { parsePlaylist } from "./_modules/parsers/playlist";
import { sendRequest } from "./_modules/request";

import type { Request, RequestHandler } from "@sveltejs/kit";

type JSON =
	| string
	| number
	| boolean
	| null
	| JSON[]
	| Record<string, { [key: string]: string; value: string }>
	| { [key: string]: JSON };

const Parsers = async (
	endpoint: string,
	{
		data,
		hasContinuation
	}: {
		data: Record<string, any>;
		hasContinuation?: boolean;
	}
) => {
	// console.log(endpoint, { data, hasContinuation })

	const Endpoints = {
		next: () => parseNextTrack(data, hasContinuation),
		player: () => data,
		release: await data,
		playlist: () => parsePlaylist(data),
		artist: () => parseArtist(data)
	};

	return await Endpoints[`${endpoint}`]();
};

export const post: RequestHandler = async ({ request: _req }) => {
	const body = await _req.formData();
	// console.log(JSON.stringify(body))
	const endpoint = (body.get("endpoint") as string) || "";
	const path = (body.get("path") as string) || "";

	if (endpoint === "player") {
		const videoId = (body.get("videoId") as string) || "";
		const playlistId = (body.get("playlistId") as string) || "";
		const ctx = Context.player(videoId, playlistId);
		// console.log(ctx)
		const req = await sendRequest(ctx, {
			endpoint: "player",
			videoId: videoId,
			playlistId: playlistId
		});
		return { status: 200, body: req };
	}
	const type = (body.get("type") as string) || null;
	const playlistId = (body.get("playlistId") as string) || "";
	const browseId = (body.get("browseId") as string) || "";
	const continuation = (body.get("continuation") as string) || null;
	const ctx = Context.base(browseId, type);
	if (path == "playlist" && browseId && continuation) {
		console.log("uh oh!");
		const request = await sendRequest(ctx, {
			endpoint,
			type: "playlist",
			playlistId,
			continuation
		});
		const response = await Parsers(path, {
			data: request,
			hasContinuation: continuation ? true : false
		});
		// console.log('ENDPOINT: ' + response)
		return { status: 200, body: response };
	}
	const request = await sendRequest(ctx, {
		endpoint,
		type,

		browseId: browseId ? browseId : playlistId,
		continuation
	});
	if (type === "release") {
		return { status: 200, body: request };
	}
	// console.log(request)

	const response = await Parsers(path, {
		data: request,
		hasContinuation: continuation ? true : false
	});
	// console.log('ENDPOINT: ' + response)
	return { status: 200, body: response };

	// }
};
