import { config } from "dotenv";

let cached_key: string | undefined;

export function OPENAI_API_KEY(key?: string, force?: boolean): string {
	if (cached_key && !force) {
		return cached_key;
	}

	if (key) {
		cached_key = key;
		return key;
	}

	if (process.env.OPENAI_API_KEY) {
		cached_key = process.env.OPENAI_API_KEY;
		return process.env.OPENAI_API_KEY;
	}

	recursive_config(process.cwd());

	if (process.env.OPENAI_API_KEY) {
		cached_key = process.env.OPENAI_API_KEY;
		return process.env.OPENAI_API_KEY;
	}

	throw new Error("OPENAI_API_KEY not found");
}

function recursive_config(dir: string): void {
	const path = `${dir}/.env`;
	try {
		config({ path });
	} catch (e) {
		const parent = dir.split("/").slice(0, -1).join("/");
		if (parent !== dir) {
			recursive_config(parent);
		}
	}
}
