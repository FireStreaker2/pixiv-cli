<div align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Pixiv_logo.svg/270px-Pixiv_logo.svg.png" />
  <h1>pixiv-cli</h1>
</div>

# About

pixiv-cli is an easy way to interact with pixiv through a terminal. It supports most read only actions, via the usage of [pixiv-node](https://github.com/FireStreaker2/pixiv-node).

<div align="center">
  
https://github.com/user-attachments/assets/6f429187-69ab-4680-aed4-d99340eafb35

</div>  

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

## Images

pixiv-cli supports displaying preview images if the terminal supports the [Kitty Graphics Protocol](https://sw.kovidgoyal.net/kitty/graphics-protocol/). To enable it, use the `-i`/`--image` flag with the info or search command.

## Example

```bash
$ pixiv login $PIXIV_COOKIE
$ pixiv search "gawr gura" -aim "r18"
$ pixiv info 119640517 -i
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
