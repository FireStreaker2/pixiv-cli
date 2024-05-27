<div align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Pixiv_logo.svg/270px-Pixiv_logo.svg.png" />
  <h1>pixiv-cli</h1>
</div>

# About

pixiv-cli is an easy way to interact with pixiv through a terminal. It supports most read only actions, via the usage of [pixiv-node](https://github.com/FireStreaker2/pixiv-node).

# Usage

## Installation

```bash
$ npm i -g pixiv-cli
```

## Commands

```console
Usage: pixiv [options] [command]

CLI tool for pixiv

Options:
  -V, --version               output the version number
  -h, --help                  display help for command

Commands:
  download|d [options] <id>   Download a specific post
  info|i [options] <id>       Get info on a specific post
  login|l <cookie>            Login to pixiv with your browser cookie
  search|s [options] <query>  Search pixiv for a post
  help [command]              display help for command
```

## Example

```bash
$ pixiv login $PIXIV_COOKIE
$ pixiv search "gawr gura" -am "r18"
$ pixiv info 119640517
$ pixiv download 119640517 -d homework
```

# Development

```bash
$ git clone https://github.com/FireStreaker2/pixiv-cli.git
$ cd pixiv-cli
$ npm i
$ npm run build
```

# License

[MIT](https://github.com/FireStreaker2/hentairead-cli/blob/main/README.md)
