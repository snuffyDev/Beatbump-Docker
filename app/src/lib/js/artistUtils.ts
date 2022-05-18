import {
	MusicResponsiveListItemRenderer,
	MusicTwoRowItemRenderer
} from "$lib/parsers";

export const parseArtistPage = (
	header: {
		musicImmersiveHeaderRenderer?: any;
		musicVisualHeaderRenderer?: any;
	} = {},
	items
) => {
	// console.log(items)
	let head = [];
	if (header?.musicImmersiveHeaderRenderer) {
		head = [header.musicImmersiveHeaderRenderer];
	} else if (header?.musicVisualHeaderRenderer) {
		head = [header.musicVisualHeaderRenderer];
	}
	const parsedHeader = head.map((h) => {
		const notAllowed = ["loggingContext"];
		const name = h?.title.runs[0].text;
		let description;
		let foregroundThumbnails;
		const thumbnail =
			h?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails;
		const mixInfo =
			h?.startRadioButton?.buttonRenderer?.navigationEndpoint
				?.watchPlaylistEndpoint ?? null;
		const shuffle =
			h?.playButton?.buttonRenderer?.navigationEndpoint?.watchEndpoint !==
				undefined &&
			Object.keys(
				h?.playButton?.buttonRenderer?.navigationEndpoint?.watchEndpoint
			)
				.filter((item) => !notAllowed.includes(item))
				.reduce((obj, key) => {
					obj[key] =
						h?.playButton?.buttonRenderer?.navigationEndpoint?.watchEndpoint[
							key
						];
					return obj;
				}, {});

		if (h?.description) {
			description = h?.description.runs[0].text;
		} else {
			description = "";
		}
		if (h?.foregroundThumbnail) {
			foregroundThumbnails =
				h?.foregroundThumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails;
		}
		return {
			name: name,
			thumbnails: thumbnail,
			mixInfo: mixInfo,
			description: description,
			foregroundThumbnails,
			shuffle
		};
	});
	let songs;
	let carouselItems = [];

	items.map((i) => {
		if (i?.musicShelfRenderer) {
			songs = {
				songs: parseSongs(i?.musicShelfRenderer?.contents),
				header: { ...i?.musicShelfRenderer?.bottomEndpoint?.browseEndpoint }
			};
			// console.log(songs)
		}
		if (i?.musicCarouselShelfRenderer) {
			carouselItems = [
				...carouselItems,
				parseCarouselItem(i?.musicCarouselShelfRenderer.contents, [
					i?.musicCarouselShelfRenderer.header
						?.musicCarouselShelfBasicHeaderRenderer
				])
			];
		}
	});
	// console.log(`items`, carouselItems)
	return { ...parsedHeader, songs, carouselItems };
};

function parseSongs(items) {
	let results = [];
	let explicit;
	results = [
		...items.map((song) => {
			const Item = MusicResponsiveListItemRenderer(song);
			return Item;
		})
	];
	return results;
}

function parseCarouselItem(items, header = []) {
	// console.log(items, header)
	// console.log(items)
	const contents = items.map((item) => {
		// console.log(ctx, ctx?.musicTwoRowItemRenderer)\
		const Item = MusicTwoRowItemRenderer(item);
		if (Item.playlistId !== undefined || Item.playlistId !== null) {
			return Item;
		} else {
			return Item;
		}
	});
	// console.log(contents)
	const head = header.map((i) => {
		const title = i?.title?.runs[0].text;
		const endpoint = i?.title?.runs[0].navigationEndpoint;
		const moreButton = i.moreContentButton?.buttonRenderer?.navigationEndpoint;
		const type = title;
		if (endpoint) {
			return {
				title,
				// moreButton,
				// endpoint,
				// i,
				type: type,
				itct: i?.moreContentButton?.buttonRenderer?.trackingParams,
				browseId: moreButton?.browseEndpoint?.browseId,
				params: moreButton?.browseEndpoint?.params
			};
		} else {
			return { title, type: type };
		}
	});
	// console.log(head)
	return { header: head[0], contents };
}
