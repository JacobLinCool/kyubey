#!/usr/bin/env node
import chalk from "chalk";
import { program } from "commander";
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
					// ask to run or break;
					console.error(chalk.redBright("Interactive mode is not implemented yet :("));
					break;
				}

				console.log("Kyubey suggests to run", chalk.yellowBright(suggestion.command));
				const result = await suggestion.run?.();
				if (result) {
					console.log("Result:", chalk.cyanBright(result));
				}
			}
		},
	);

program.parse();
