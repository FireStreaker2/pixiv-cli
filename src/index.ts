#!/usr/bin/env node

import { access, mkdir, readFile, writeFile } from "fs/promises";
import { program } from "commander";
import pixiv from "pixiv-node";

program.name("pixiv").description("CLI tool for pixiv").version("1.0.3");

interface Data {
	body: any;
}

program
	.command("download")
	.description("Download a specific post")
	.alias("d")
	.argument("<id>", "ID of post")
	.option("-d, --directory <directory>", "Directory to download images to")
	.action(async (id: string, options: { directory: string }) => {
		const file = new URL("../settings.json", import.meta.url);

		try {
			await access(file);

			const settings = JSON.parse(await readFile(file, "utf-8"));

			if (settings.cookie) pixiv.login(settings.cookie);
		} catch (error) {}

		const data = (await pixiv.getImages(id)) as Data;
		console.log(`Downloading post ${id}...`);

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
				await mkdir(`./${options.directory}`, { recursive: true });

			const buffer = await response.arrayBuffer();
			await writeFile(
				`./${
					options.directory ? `${options.directory}/` : ""
				}${id}_${i}.${image.substring(image.lastIndexOf(".") + 1)}`,
				new Uint8Array(buffer)
			);
		}

		console.log("Succesfully downloaded!");
	});

program
	.command("info")
	.description("Get info on a specific post")
	.alias("i")
	.argument("<id>", "ID of post")
	.option("-c, --comments", "Whether to include comments in the output")
	.action(async (id: string, options: { comments: boolean }) => {
		const file = new URL("../settings.json", import.meta.url);

		try {
			await access(file);

			const settings = JSON.parse(await readFile(file, "utf-8"));

			if (settings.cookie) pixiv.login(settings.cookie);
		} catch (error) {}

		const data = (await pixiv.getPost(id)) as Data;
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

		if (options.comments) {
			const data = (await pixiv.getIllustComments(id)) as Data;

			console.log("\nComments:\n----------");

			for (const comment of data.body.comments) {
				console.log(
					`${comment.userName} (${comment.userId}): ${comment.comment}`
				);
			}
		}
	});

program
	.command("login")
	.description("Login to pixiv with your browser cookie")
	.alias("l")
	.argument("<cookie>", "Your browser cookie")
	.action(async (cookie: string) => {
		const file = new URL("../settings.json", import.meta.url);

		try {
			await access(file);
		} catch (error) {
			await writeFile(file, "{}", "utf-8");
		}

		const data = await readFile(file, "utf-8");
		const settings = JSON.parse(data);

		settings.cookie = cookie;
		await writeFile(
			new URL("../settings.json", import.meta.url),
			JSON.stringify(settings, null, 2),
			"utf-8"
		);

		console.log(
			`Succesfully logged in with cookie ${cookie.substring(
				cookie.indexOf("=") + 1,
				cookie.indexOf("ID=") + 5
			)}****${cookie.substring(cookie.length - 2)}!`
		);
	});

program
	.command("search")
	.description("Search pixiv for a post")
	.alias("s")
	.argument("<query>", "Topic to search for")
	.option("-m, --mode <all|safe|r18>", "Mode of the search")
	.option("-t, --type <all|illustrations|manga>", "What to search for")
	.option("-a, --ai", "Whether to include AI generated art")
	.action(
		async (
			query: string,
			options: {
				mode: "all" | "safe" | "r18";
				type: "all" | "illustrations" | "manga" | "illust_and_ugoira";
				ai: string | boolean | 1;
			}
		) => {
			const file = new URL("../settings.json", import.meta.url);

			try {
				await access(file);

				const settings = JSON.parse(await readFile(file, "utf-8"));

				if (settings.cookie) pixiv.login(settings.cookie);
			} catch (error) {}

			if (options.type === "illustrations") options.type = "illust_and_ugoira";

			const data = (await pixiv.search({
				query,
				...(options.mode && { mode: options.mode }),
				...(options.type && { type: options.type }),
				...(options.ai && { ai: 1 }),
			})) as Data;

			const posts = data.body.illustManga.data;

			for (let i = 0; i < posts.length; i++) {
				const post = posts[i];

				console.log(
					`ID: ${post.id}\n` +
						`Tags: ${post.tags.join(", ")}\n` +
						`Uploaded by: ${post.userName} (${post.userId})\n` +
						`Dimensions: ${post.width}x${post.height}\n` +
						`Page Count: ${post.pageCount}\n` +
						`Alt Text: ${post.alt}\n` +
						`Created At: ${post.createDate}\n` +
						`Updated At: ${post.updateDate}\n`
				);
			}

			console.log(`Related tags: ${data.body.relatedTags.join(", ")}`);
		}
	);

program.parse();
