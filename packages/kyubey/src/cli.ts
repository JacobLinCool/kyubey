#!/usr/bin/env node
import chalk from "chalk";
import { program } from "commander";
import prompts from "prompts";
import { QB } from "./kyubey";
import { pkg } from "./pkg";

program
	.name(pkg.name)
	.description(pkg.description)
	.version(pkg.version)
	.option("-i, --interactive", "Run Kyubey in interactive mode", false)
	.argument("<prompt...>", "Ask Kyubey to do something")
	.action(
		async (
			prompt: string[],
			opt: {
				interactive: boolean;
			},
		) => {
			const task = prompt.map((x) => x.trim()).join(" ");

			const qb = new QB(task);
			while (!qb.done) {
				const suggestion = await qb.next();

				if (suggestion.unknown) {
					console.error(
						chalk.redBright("Kyubey doesn't know what to do :("),
						chalk.yellowBright(suggestion.command),
					);
					break;
				}

				if (suggestion.done) {
					console.log(
						chalk.greenBright("Kyubey thinks the task is done! ／人◕ ‿‿ ◕人＼"),
					);
					break;
				}

				if (opt.interactive) {
					const { action } = await prompts([
						{
							type: "select",
							name: "action",
							message: `Kyubey wants to run ${chalk.yellowBright(
								suggestion.command,
							)}?`,
							choices: [
								{
									title: "Yes",
									value: "yes",
									selected: true,
								},
								{
									title: "No, I want to edit",
									value: "edit",
								},
								{
									title: "No, just stop",
									value: "no",
								},
							],
						},
					]);

					if (action === "no") {
						console.log(chalk.redBright("You don't want Kyubey to do that :("));
						break;
					}

					if (action === "edit") {
						const { edit } = await prompts([
							{
								type: "text",
								name: "edit",
								message: "What do you want Kyubey to do?",
								initial: suggestion.command,
							},
						]);
						suggestion.command = edit;
					}
				}

				console.log("Kyubey runs", chalk.yellowBright(suggestion.command));
				const result = await suggestion.run?.();
				if (result) {
					console.log(chalk.cyanBright(result));
				}
			}
		},
	);

program.parse();
