# Kyubey

~~Just make a contract with me, and become a Magical Girl! 僕と契約して、魔法少女になってよ!~~

![demo gif](https://i.imgur.com/aoYQxp0.gif)

## Features

- [x] Automatic Mode or Interactive Mode (`-i`)
- [x] Long task with summarized terminal output
- [x] Answer question about repository / directory
- [ ] ~~Make you become a Magical Girl~~

## Installation

```bash
pnpm i -g kyubey
```

> `kyubey` needs `OPENAI_API_KEY` environment variable to work. It will automatically load `.env` recursively from the current directory. You can also pass the key as `--key`.

## Usage

```bash
kyubey "do something"
```

or if you prefer `qb`:

```bash
qb "do something"
```

## Demo

### Interactive Mode

![interactive mode demo](https://i.imgur.com/bN4jI79.gif)

### Ask Question about Repository

![ask question about repository](https://i.imgur.com/fyDO8QO.gif)
