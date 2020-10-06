# file-server

An on the go file-server to get you quickly started on a front-end.

## Installation

```sh
deno install \
	--unstable \
	--allow-read=.,$(which deno) \
	--allow-net \
	--allow-run \
	-f \
	-n fs \
	https://deno.land/x/fileserver/cli.ts
```

## Features

- **Secure by default.** [FileServer](https://deno.land/x/fileserver) runs on [Deno](https://deno.land) which is a secure runtime for JavaScript and TypeScript. [FileServer](https://deno.land/x/fileserver) will ask for permissions to read from the directory to serve files, and will not be able to read from anywhere outside of that directory. (See screenshot: https://i.loli.net/2020/10/06/PhyrdQWBaKSoRlY.png).

- **Random port by default.** If you don't know where you want to serve your files, [FileServer](https://deno.land/x/fileserver) will choose a random open port. You can choose a custom port by using `-p <port>` and/or a custom host by using `-H <host>`. (See screenshot: https://i.loli.net/2020/10/06/u2jCV4Wq3wlaOXn.png)

- **Directory listing.** If no indexes are found a directory listing will be served instead. This can be disabled by using `-N` (See screenshot: https://i.loli.net/2020/10/06/iHUdObvQ6YK4aWx.png)

- **CORS.** Enable CORS via the "Access-Control-Allow-Origin" header. Enable using `-C`.

- **TypeScript/JavaScript (.ts, .js, .tsx, .jsx) bundler.** Deno comes built-in with a code bundler for JavaScript and TypeScript. Enable by using `-t`. If the requested resource has one of the mentioned extensions, [FileServer](https://deno.land/x/fileserver) wiill bundle all those files. (See screenshots: https://i.loli.net/2020/10/06/Z3uFJYMenaRiyOk.png, https://i.loli.net/2020/10/06/snjpcwVPkRAUQ9J.png)

- **Caching**. [FileServer](https://deno.land/x/fileserver) can cache requested resources in memory to serve them faster. Enable using `--cache`, you can also set the amount of time resources are cached on the server by using `-L <time>`, `<time>` defaults to `30m`. (See screenshot: https://i.loli.net/2020/10/06/JHDPfEMapm1yces.png)

- **Embedded JavaScript**. [FileServer](https://deno.land/x/fileserver) can serve embedded javascript (server side) files. Enable using `-e`. **Note:** The output of `.ejs` files aren't cached. (See screenshot: https://i.loli.net/2020/10/06/J46OQ5BRCpKeNAo.png)

- **TLS**. Enable HTTPS by including a certificate and a key file. Enable by using both `-c <certFile> -k <keyFile>`. (See screenshots: https://i.loli.net/2020/10/06/jCfspmAeBRgN57G.png, https://i.loli.net/2020/10/06/UzMo78QXdwkYOls.png)

## Usage

To start a file-server simply run:

```sh
fs
```

To start a file-server with a custom directory:

```
fs subdir
```

To start a file-server with a custom port:

```sh
fs -p 3000
```

To start a file-server with a custom host:

```sh
fs -H 0.0.0.0
```

To start a file-server with a custom port & host:

```sh
fs -H 0.0.0.0 -p 3000
```

To start a file-server with Embedded-JavaScript enabled:

```sh
fs -e
```

To start a file-server with TypeScript enabled:

```sh
fs -t
```

To start a file-server with Embedded-JavaScript & TpeScript enabled:

```sh
fs -et
```

To enable cors:

```sh
fs -C
```

To enable TLS (https):

```sh
fs -c ./path/to/cert.pem -k ./path/to/key.pem
```

To enable caching:

```sh
fs --cache
```
