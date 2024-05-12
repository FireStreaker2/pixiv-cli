#!/usr/bin/env node

import fs from "fs";
import { program } from "commander";
import pixiv from "pixiv-node";

program.name("pixiv").description("CLI tool for pixiv").version("1.0.0");

program
	.command("download")
	.description("Download a specific post")
	.argument("<id>", "ID of post")
	.option("-d, --directory <directory>")
	.action(async (query, options) => {
		const data = await pixiv.getImages(query);
		console.log(`Downloading post ${query}...`);

		const images = data.body;

		for (let i = 0; i < images.length; i++) {
			const image = images[i].urls.original;
			const response = await fetch(image, {
				headers: {
					Referer: "http://www.pixiv.net/",
				},
			});

			if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

			if (options.directory)
				await fs.promises.mkdir(`./${options.directory}`, { recursive: true });

			const buffer = await response.arrayBuffer();
			await fs.promises.writeFile(
				`./${
					options.directory ? `${options.directory}/` : ""
				}${i}.${image.substring(image.lastIndexOf(".") + 1)}`,
				new Uint8Array(buffer)
			);
		}

		console.log("Succesfully downloaded!");
	});

program
	.command("info")
	.description("Get info on a specific post")
	.argument("<id>", "ID of post")
	.option("-c, --comments")
	.action(async (query, options) => {
		const data = await pixiv.getPost(query);
		const info = data.body;

		console.log(
			`Illustration ID: ${info.illustId}\n` +
				`Title: ${info.illustTitle}\n` +
				`Comment: ${info.illustComment}\n` +
				`ID: ${info.id}\n` +
				`Description: ${info.description}\n` +
				`Illustration Type: ${info.illustType}\n` +
				`Create Date: ${info.createDate}\n` +
				`Upload Date: ${info.uploadDate}\n` +
				`URLs:\n` +
				`  Mini: ${info.urls.mini}\n` +
				`  Thumb: ${info.urls.thumb}\n` +
				`  Small: ${info.urls.small}\n` +
				`  Regular: ${info.urls.regular}\n` +
				`  Original: ${info.urls.original}\n` +
				`Dimensions: ${info.width} x ${info.height}\n` +
				`Page Count: ${info.pageCount}\n` +
				`Bookmark Count: ${info.bookmarkCount}\n` +
				`Like Count: ${info.likeCount}\n` +
				`Comment Count: ${info.commentCount}\n` +
				`Response Count: ${info.responseCount}\n` +
				`View Count: ${info.viewCount}\n` +
				`Extra info:\n` +
				`  Meta Title: ${info.extraData.meta.title}\n` +
				`  Meta Description: ${info.extraData.meta.description}\n` +
				`  Canonical URL: ${info.extraData.meta.canonical}\n` +
				`  Alternate Languages:\n` +
				`    Japanese: ${info.extraData.meta.alternateLanguages.ja}\n` +
				`    English: ${info.extraData.meta.alternateLanguages.en}\n` +
				`  Description Header: ${info.extraData.meta.descriptionHeader}\n` +
				`  OGP Description: ${info.extraData.meta.ogp.description}\n` +
				`  OGP Image: ${info.extraData.meta.ogp.image}\n` +
				`  OGP Title: ${info.extraData.meta.ogp.title}\n` +
				`  OGP Type: ${info.extraData.meta.ogp.type}\n` +
				`  Twitter Description: ${info.extraData.meta.twitter.description}\n` +
				`  Twitter Image: ${info.extraData.meta.twitter.image}\n` +
				`  Twitter Title: ${info.extraData.meta.twitter.title}\n` +
				`  Twitter Card: ${info.extraData.meta.twitter.card}\n` +
				`AI Type: ${info.aiType}`
		);
	});

program
	.command("search")
	.description("Search pixiv for a post")
	.argument("<query>", "Topic to search for")
	.option("-m, --mode <all|safe|r18>")
	.option("-t, --type <all|illustrations|manga>")
	.option("-a, --ai")
	.action(async (query, options) => {
		const data = await pixiv.search({
			query,
			...(options.mode && { mode: options.mode }),
			...(options.type && { type: options.type }),
			...(options.ai && { ai: 1 }),
		});

		const posts = data.body.illustManga.data;

		for (let i = 0; i < posts.length; i++) {
			const post = posts[i];

			console.log(
				`ID: ${post.id}\n` +
					`Tags: ${post.tags.join(", ")}\n` +
					`Uploaded by: ${post.userName} (${post.userId})\n` +
					`Dimensions: ${post.width}x${post.height}\n` +
					`Page Count: ${post.pageCount}` +
					`Alt Text: ${post.alt}\n` +
					`Created At: ${post.createDate}\n` +
					`Updated At: ${post.updateDate}\n`
			);
		}

		console.log(`Related tags: ${data.body.relatedTags.join(", ")}`);
	});

program.parse();
