#!/usr/bin/env bun

import { access, mkdir, readFile, writeFile } from "fs/promises";
import { program } from "commander";
import chalk from "chalk";
import pixiv from "pixiv-node";

program.name("pixiv").description("CLI tool for pixiv").version("1.0.4");

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
		console.log(`Downloading post ${chalk.bold(id)}...`);

		const images = data.body;
		let progress = 0;

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
			`${chalk.bold("Illustration ID:")} ${chalk.green(info.illustId)}\n` +
				`${chalk.bold("Title:")} ${chalk.green(info.illustTitle)}\n` +
				`${chalk.bold("Comment:")} ${chalk.green(info.illustComment)}\n` +
				`${chalk.bold("ID:")} ${chalk.green(info.id)}\n` +
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
				`  ${chalk.bold("Original:")} ${chalk.green(info.urls.original)}\n` +
				`${chalk.bold("Dimensions:")} ${chalk.green(
					`${info.width} x ${info.height}`
				)}\n` +
				`${chalk.bold("Page Count:")} ${chalk.green(info.pageCount)}\n` +
				`${chalk.bold("Bookmark Count:")} ${chalk.green(
					info.bookmarkCount
				)}\n` +
				`${chalk.bold("Like Count:")} ${chalk.green(info.likeCount)}\n` +
				`${chalk.bold("Comment Count:")} ${chalk.green(info.commentCount)}\n` +
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

		if (options.comments) {
			const data = (await pixiv.getIllustComments(id)) as Data;

			console.log(chalk.bold("\nComments:\n---------"));

			for (const comment of data.body.comments)
				console.log(
					`${chalk.blue(comment.userName)} (${chalk.yellow(comment.userId)}): ${
						comment.comment
					}`
				);
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

			for (const post of data.body.illustManga.data)
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

			console.log(
				`${chalk.yellow(`Related tags: ${data.body.relatedTags.join(", ")}`)}`
			);
		}
	);

program.parse();
