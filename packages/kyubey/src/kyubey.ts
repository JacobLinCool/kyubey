import EventEmitter from "node:events";
import path from "node:path";
import debug from "debug";
import { commandSync } from "execa";
import type { ExecaReturnBase } from "execa";
import {
	ChatCompletionRequestMessage,
	ChatCompletionResponseMessage,
	Configuration,
	OpenAIApi,
} from "openai";
import { SYSTEM_PROMPT } from "./constants";
import { OPENAI_API_KEY } from "./key";
import { Suggestion } from "./types";

const log = debug("kyubey");

/** Summon a new Kyubey ／人◕ ‿‿ ◕人＼ */
export class Kyubey extends EventEmitter {
	public task: string;
	public ready: Promise<unknown>;
	public done: boolean;
	protected api: OpenAIApi;
	protected messages: ChatCompletionRequestMessage[];
	protected cwd: string;

	constructor(task: string, opt?: { key?: string }) {
		super();
		this.task = task;
		this.ready = Promise.resolve();
		this.done = false;

		const config = new Configuration({ apiKey: OPENAI_API_KEY(opt?.key) });
		this.api = new OpenAIApi(config);
		this.messages = [];
		this.cwd = process.cwd();
	}

	async next(): Promise<Suggestion> {
		await this.ready;

		if (this.done) {
			throw new Error("task is already done");
		}

		if (this.messages.length === 0) {
			return this.first();
		}

		const promise = (async () => {
			const result = await this.api.createChatCompletion({
				model: "gpt-3.5-turbo",
				messages: this.messages,
				temperature: 0,
				max_tokens: 512,
			});

			log.extend("token")(result.data.usage?.total_tokens);

			const response = result.data.choices[0].message;
			if (response) {
				this.messages.push(response);
				return this.to_suggestion(response);
			}

			throw new Error("No response");
		})();

		this.ready = promise;
		return promise;
	}

	async first(): Promise<Suggestion> {
		await this.ready;

		const promise = (async () => {
			const ls = await this.exec("ls");

			this.messages = [
				{ role: "system", content: SYSTEM_PROMPT },
				{ role: "user", content: `[task] ${this.task}` },
				{ role: "assistant", content: "[run] pwd" },
				{ role: "user", content: `[terminal] code 0, ${this.cwd}` },
				{ role: "assistant", content: "[run] ls" },
				{ role: "user", content: `[terminal] code 0, ${ls}` },
			];

			const result = await this.api.createChatCompletion({
				model: "gpt-3.5-turbo",
				messages: this.messages,
				temperature: 0.1,
				max_tokens: 512,
			});

			log.extend("token")(result.data.usage?.total_tokens);

			const response = result.data.choices[0].message;
			if (response) {
				this.messages.push(response);
				return this.to_suggestion(response);
			}

			throw new Error("No response");
		})();

		this.ready = promise;
		return promise;
	}

	protected async exec(command: string): Promise<string> {
		let out: string;
		let code: number;

		try {
			const result = commandSync(command, { shell: true, cwd: this.cwd });
			out = result.stdout.trim() || result.stderr.trim();
			code = result.exitCode;
		} catch (error) {
			const err = error as ExecaReturnBase<string>;
			out = err.stderr.trim() || err.stdout.trim();
			code = err.exitCode;
		}

		this.messages.push(
			{ role: "assistant", content: `[run] ${command}` },
			{ role: "user", content: `[terminal] code ${code}, ${out}` },
		);
		log("[run]", command, this.cwd);
		log("[terminal]", `code ${code}, ${out}`);

		const commands = command.split("&&").map((c) => c.trim());
		for (const c of commands) {
			if (c.startsWith("cd")) {
				const dir = c.slice(2).trim();
				this.cwd = path.resolve(this.cwd, dir);
			}
		}

		return out;
	}

	protected to_suggestion(response: ChatCompletionResponseMessage): Suggestion {
		const content = response.content.trim();
		log.extend("response")(content);

		if (content.startsWith("[done]")) {
			return { done: true, command: "" };
		}

		const commands = content
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line.startsWith("[run]"));
		if (commands.length > 0) {
			const command = commands.map((line) => line.slice(5).trim()).join(" && ");
			const exec = this.exec.bind(this);
			return {
				done: false,
				command,
				run: function () {
					return exec(this.command);
				},
			};
		}

		return { done: false, command: content, unknown: true };
	}
}

/** `QB` is an alias of `Kyubey` */
export const QB = Kyubey;
