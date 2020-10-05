# file-server

An on the go file-server to get you quickøy started on a front-end.

## Features

- TLS
- Custom index files.
- Browse files.
- Embedded-JavaScript
- Built-in TypeScript compilation.
- CORS on demand.
- Caching.

## Installation

```sh
deno install \
	--unstable \
	--allow-read=$(pwd),$(which deno) \
	--allow-net \
	--allow-run \
	-f \
	-n fs \
	https://deno.land/x/fileserver/cli.ts
```

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
