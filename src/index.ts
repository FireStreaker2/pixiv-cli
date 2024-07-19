#!/usr/bin/env bun

import { access, mkdir, readFile, writeFile } from "fs/promises";
import { program } from "commander";
import chalk from "chalk";
import pixiv from "pixiv-node";

program.name("pixiv").description("CLI tool for pixiv").version("1.0.6");

interface Data {
	body: any;
	novel: any;
}

const showImage = async (data: Buffer) => {
	let base64Data = data.toString("base64");
	let pos = 0;
	const chunkSize = 4096;

	while (pos < base64Data.length) {
		process.stdout.write("\x1b_G");
		if (pos === 0) process.stdout.write("a=T,f=100,");

		let chunk = base64Data.slice(pos, pos + chunkSize);
		pos += chunkSize;

		if (pos < base64Data.length) process.stdout.write("m=1");
		process.stdout.write(`;${chunk}\x1b\\`);
	}
};

program
	.command("download")
	.description("Download a specific post")
	.alias("d")
	.argument("<id>", "ID of post")
	.option(
		"-t, --type <illust|novel>",
		"Whether the content is an illustration/manga or a novel. Defaults to illustration"
	)
	.option("-d, --directory <directory>", "Directory to download content to")
	.option(
		"-f, --format <thumb_mini|small|regular|original>",
		"Type of image to download"
	)
	.action(
		async (
			id: string,
			options: {
				type: "illust" | "novel";
				directory: string;
				format: "thumb_mini" | "small" | "regular" | "original";
			}
		) => {
			const file = new URL("../settings.json", import.meta.url);

			try {
				await access(file);

				const settings = JSON.parse(await readFile(file, "utf-8"));

				if (settings.cookie) pixiv.login(settings.cookie);
			} catch (error) {}

			if (options.type == "novel") {
				const data = (await pixiv.getNovel(id)) as Data;

				if (options.directory)
					await mkdir(`./${options.directory}`, { recursive: true });

				await writeFile(
					`./${options.directory ? `${options.directory}/` : ""}${id}.txt`,
					`=====\nTitle: ${data.novel[id].title}\nDescription: ${data.novel[id].description}\nNovel ID: ${id}\nAuthor: ${data.novel[id].userName}\n=====\n\n${data.novel[id].content}`
				);

				console.log(
					`\nSuccesfully downloaded to ${
						options.directory
							? `${chalk.bold(`${process.cwd()}/${options.directory}`)}/`
							: ""
					}${chalk.bold(`${id}.txt`)}`
				);
			} else {
				const data = (await pixiv.getIllustImages(id)) as Data;
				console.log(`Downloading post ${chalk.bold(id)}...`);

				if (options.directory)
					await mkdir(`./${options.directory}`, { recursive: true });

				const images = data.body;
				let progress = 0;

				for (let i = 0; i < images.length; i++) {
					const image =
						images[i].urls[options.format ? options.format : "original"];
					const response = await fetch(image, {
						headers: {
							Referer: "http://www.pixiv.net/",
						},
					});

					if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

					const buffer = await response.arrayBuffer();
					await writeFile(
						`./${
							options.directory ? `${options.directory}/` : ""
						}${id}_${i}.${image.substring(image.lastIndexOf(".") + 1)}`,
						new Uint8Array(buffer)
					);

					progress++;

					const percentage = (progress / images.length) * 100;
					const completed = Math.round((percentage / 100) * 20);

					process.stdout.write(
						`\r[${"#".repeat(completed)}${"-".repeat(
							20 - completed
						)}] ${percentage.toFixed(2)}%`
					);
				}

				console.log(
					`\nSuccesfully downloaded ${chalk.bold(images.length)} pages${
						options.directory
							? ` to ${chalk.bold(`${process.cwd()}/${options.directory}`)}`
							: ""
					}!`
				);
			}
		}
	);

program
	.command("info")
	.description("Get info on a specific post")
	.alias("i")
	.argument("<id>", "ID of post")
	.option("-t, --type <illust/novel>", "What to search for. Defaults to illust")
	.option("-c, --comments", "Whether to include comments in the output")
	.option(
		"-i, --image",
		"Whether to display images with the Kitty Graphics Protocol"
	)
	.action(
		async (
			id: string,
			options: {
				type: "illust" | "novel";
				comments: boolean;
				image: boolean;
			}
		) => {
			const file = new URL("../settings.json", import.meta.url);

			try {
				await access(file);

				const settings = JSON.parse(await readFile(file, "utf-8"));

				if (settings.cookie) pixiv.login(settings.cookie);
			} catch (error) {}

			let data: Data;

			if (options.type === "novel") {
				data = (await pixiv.getNovel(id)) as Data;
				const info = data.novel[id];

				console.log(
					`${chalk.bold("Novel ID:")} ${chalk.green(id)}\n` +
						`${chalk.bold("Title:")} ${chalk.green(info.title)}\n` +
						`${chalk.bold("Description:")} ${chalk.green(info.description)}\n` +
						`${chalk.bold("Create Date:")} ${chalk.green(info.createDate)}\n` +
						`${chalk.bold("Upload Date:")} ${chalk.green(info.uploadDate)}\n` +
						`${chalk.bold("Page Count:")} ${chalk.green(info.pageCount)}\n` +
						`${chalk.bold("Bookmark Count:")} ${chalk.green(
							info.bookmarkCount
						)}\n` +
						`${chalk.bold("Like Count:")} ${chalk.green(info.likeCount)}\n` +
						`${chalk.bold("Comment Count:")} ${chalk.green(
							info.commentCount
						)}\n` +
						`${chalk.bold("View Count:")} ${chalk.green(info.viewCount)}\n`
				);
			} else {
				data = (await pixiv.getIllust(id)) as Data;
				const info = data.body;

				console.log(
					`${chalk.bold("Illustration ID:")} ${chalk.green(info.illustId)}\n` +
						`${chalk.bold("Title:")} ${chalk.green(info.illustTitle)}\n` +
						`${chalk.bold("Comment:")} ${chalk.green(info.illustComment)}\n` +
						`${chalk.bold("Description:")} ${chalk.green(info.description)}\n` +
						`${chalk.bold("Illustration Type:")} ${chalk.green(
							info.illustType
						)}\n` +
						`${chalk.bold("Create Date:")} ${chalk.green(info.createDate)}\n` +
						`${chalk.bold("Upload Date:")} ${chalk.green(info.uploadDate)}\n` +
						`${chalk.bold("URLs:")}\n` +
						`  ${chalk.bold("Mini:")} ${chalk.green(info.urls.mini)}\n` +
						`  ${chalk.bold("Thumb:")} ${chalk.green(info.urls.thumb)}\n` +
						`  ${chalk.bold("Small:")} ${chalk.green(info.urls.small)}\n` +
						`  ${chalk.bold("Regular:")} ${chalk.green(info.urls.regular)}\n` +
						`  ${chalk.bold("Original:")} ${chalk.green(
							info.urls.original
						)}\n` +
						`${chalk.bold("Dimensions:")} ${chalk.green(
							`${info.width} x ${info.height}`
						)}\n` +
						`${chalk.bold("Page Count:")} ${chalk.green(info.pageCount)}\n` +
						`${chalk.bold("Bookmark Count:")} ${chalk.green(
							info.bookmarkCount
						)}\n` +
						`${chalk.bold("Like Count:")} ${chalk.green(info.likeCount)}\n` +
						`${chalk.bold("Comment Count:")} ${chalk.green(
							info.commentCount
						)}\n` +
						`${chalk.bold("Response Count:")} ${chalk.green(
							info.responseCount
						)}\n` +
						`${chalk.bold("View Count:")} ${chalk.green(info.viewCount)}\n` +
						`${chalk.bold("Extra info:")}\n` +
						`  ${chalk.bold("Meta Title:")} ${chalk.green(
							info.extraData.meta.title
						)}\n` +
						`  ${chalk.bold("Meta Description:")} ${chalk.green(
							info.extraData.meta.description
						)}\n` +
						`  ${chalk.bold("Canonical URL:")} ${chalk.green(
							info.extraData.meta.canonical
						)}\n` +
						`  ${chalk.bold("Alternate Languages:")}\n` +
						`    ${chalk.bold("Japanese:")} ${chalk.green(
							info.extraData.meta.alternateLanguages.ja
						)}\n` +
						`    ${chalk.bold("English:")} ${chalk.green(
							info.extraData.meta.alternateLanguages.en
						)}\n` +
						`  ${chalk.bold("Description Header:")} ${chalk.green(
							info.extraData.meta.descriptionHeader
						)}\n` +
						`  ${chalk.bold("OGP Description:")} ${chalk.green(
							info.extraData.meta.ogp.description
						)}\n` +
						`  ${chalk.bold("OGP Image:")} ${chalk.green(
							info.extraData.meta.ogp.image
						)}\n` +
						`  ${chalk.bold("OGP Title:")} ${chalk.green(
							info.extraData.meta.ogp.title
						)}\n` +
						`  ${chalk.bold("OGP Type:")} ${chalk.green(
							info.extraData.meta.ogp.type
						)}\n` +
						`  ${chalk.bold("Twitter Description:")} ${chalk.green(
							info.extraData.meta.twitter.description
						)}\n` +
						`  ${chalk.bold("Twitter Image:")} ${chalk.green(
							info.extraData.meta.twitter.image
						)}\n` +
						`  ${chalk.bold("Twitter Title:")} ${chalk.green(
							info.extraData.meta.twitter.title
						)}\n` +
						`  ${chalk.bold("Twitter Card:")} ${chalk.green(
							info.extraData.meta.twitter.card
						)}\n` +
						`${chalk.bold("AI Type:")} ${chalk.green(info.aiType)}`
				);
			}

			if (options.image) {
				const image =
					options.type === "novel"
						? data.novel[id].coverUrl
						: data.body.urls.original;
				const response = await fetch(image, {
					headers: {
						Referer: "http://www.pixiv.net/",
					},
				});

				await showImage(Buffer.from(await response.arrayBuffer()));
			}

			if (options.comments) {
				const data = (
					options.type === "novel"
						? await pixiv.getNovelComments(id)
						: await pixiv.getIllustComments(id)
				) as Data;

				console.log(chalk.bold("\nComments:\n---------"));

				for (const comment of data.body.comments)
					console.log(
						`${chalk.blue(comment.userName)} (${chalk.yellow(
							comment.userId
						)}): ${comment.comment}`
					);
			}
		}
	);

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
			`Succesfully logged in with cookie "${chalk.red(
				cookie.substring("PHPSESSID=".length, "PHPSESSID=".length + 2)
			)}${chalk.bold(
				"*".repeat(cookie.length - "PHPSESSID=".length - 4)
			)}${chalk.red(cookie.slice(-2))}"!`
		);
	});

program
	.command("search")
	.description("Search pixiv for a post")
	.alias("s")
	.argument("<query>", "Topic to search for")
	.option("-m, --mode <all|safe|r18>", "Mode of the search")
	.option(
		"-t, --type <top|manga|illustrations|artworks|novels>",
		"What to search for"
	)
	.option("-a, --ai", "Whether to include AI generated art")
	.option(
		"-i, --image",
		"Whether to display images with the Kitty Graphics Protocol"
	)
	.action(
		async (
			query: string,
			options: {
				mode: "all" | "safe" | "r18";
				type:
					| "manga"
					| "illust_and_ugoira"
					| "illustrations"
					| "top"
					| "artworks"
					| "novels";
				ai: string | boolean | 1;
				image: boolean;
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

			for (const post of data.body.illustManga.data) {
				console.log(
					`${chalk.yellow(`ID: ${post.id}`)}\n` +
						`${chalk.cyan(`Tags: ${post.tags.join(", ")}`)}\n` +
						`${chalk.green(
							`Uploaded by: ${post.userName} (${post.userId})`
						)}\n` +
						`${chalk.magenta(`Dimensions: ${post.width}x${post.height}`)}\n` +
						`${chalk.blue(`Page Count: ${post.pageCount}`)}\n` +
						`${chalk.white(`Alt Text: ${post.alt}`)}\n` +
						`${chalk.gray(`Created At: ${post.createDate}`)}\n` +
						`${chalk.gray(`Updated At: ${post.updateDate}`)}\n`
				);

				if (options.image) {
					const data = (await pixiv.getIllust(post.id)) as Data;

					const response = await fetch(data.body.urls.original, {
						headers: {
							Referer: "http://www.pixiv.net/",
						},
					});

					await showImage(Buffer.from(await response.arrayBuffer()));
				}
			}

			console.log(
				`${chalk.yellow(`Related tags: ${data.body.relatedTags.join(", ")}`)}`
			);
		}
	);

program
	.command("user")
	.description("Get the info of a user")
	.alias("u")
	.argument("<id>", "User ID to look up")
	.option(
		"-t, --type <all|top|bookmarks/illusts|bookmarks/novels>",
		"What to search for. Defaults to all"
	)
	.option("-l, --limit <limit>", "Limit the amount of data for bookmarks")
	.action(
		async (
			id: string,
			options: {
				type: "all" | "top" | "bookmarks/illusts" | "bookmarks/novels";
				limit: number;
			}
		) => {
			const file = new URL("../settings.json", import.meta.url);

			try {
				await access(file);

				const settings = JSON.parse(await readFile(file, "utf-8"));

				if (settings.cookie) pixiv.login(settings.cookie);
			} catch (error) {}

			if (!options.type) options.type = "all";
			const data = (
				options.type.includes("bookmarks")
					? await pixiv.getUser(id, options.type, options.limit)
					: await pixiv.getUser(id, options.type)
			) as Data;

			if (options.type.includes("bookmarks")) {
				console.log(`${data.body.extraData.meta.title}\n`);

				for (const post of data.body.works)
					console.log(
						`${chalk.yellow(`ID: ${post.id}`)}\n` +
							`${chalk.cyan(`Tags: ${post.tags.join(", ")}`)}\n` +
							`${chalk.green(
								`Uploaded by: ${post.userName} (${post.userId})`
							)}\n` +
							`${chalk.magenta(`Dimensions: ${post.width}x${post.height}`)}\n` +
							`${chalk.blue(`Page Count: ${post.pageCount}`)}\n` +
							`${chalk.white(`Alt Text: ${post.alt}`)}\n` +
							`${chalk.gray(`Created At: ${post.createDate}`)}\n` +
							`${chalk.gray(`Updated At: ${post.updateDate}`)}\n`
					);
			} else if (options.type === "all") {
				const objects = [
					"illusts",
					"manga",
					"novels",
					"mangaSeries",
					"novelSeries",
				];

				for (const object of objects) {
					const works = data.body[object];

					if (works.length !== 0) {
						console.log(
							chalk.blue(object) +
								": " +
								chalk.green(Object.keys(works).join(", "))
						);
					}
				}
			} else if (options.type === "top") {
				for (const illust in data.body.illusts) {
					const post = data.body.illusts[illust];

					console.log(
						`${chalk.yellow(`ID: ${post.id}`)}\n` +
							`${chalk.cyan(`Tags: ${post.tags.join(", ")}`)}\n` +
							`${chalk.green(
								`Uploaded by: ${post.userName} (${post.userId})`
							)}\n` +
							`${chalk.magenta(`Dimensions: ${post.width}x${post.height}`)}\n` +
							`${chalk.blue(`Page Count: ${post.pageCount}`)}\n` +
							`${chalk.white(`Alt Text: ${post.alt}`)}\n` +
							`${chalk.gray(`Created At: ${post.createDate}`)}\n` +
							`${chalk.gray(`Updated At: ${post.updateDate}`)}\n`
					);
				}
			}
		}
	);

program.parse();
