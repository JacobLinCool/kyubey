/**
 * The suggestion from Kyubey
 */
export interface Suggestion {
	/** `true` if Kyubey thinks the task is done */
	done: boolean;
	/** Kyubey wants to run this command */
	command: string;
	/** `true` if Kyubey doesn't know what to do */
	unknown?: boolean;
	/** Let Kyubey to run the command */
	run?: () => Promise<string>;
}
