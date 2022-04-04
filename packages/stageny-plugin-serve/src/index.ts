import type { StagenyBase, StagenyFile, StagenyPlugin } from "@stageny/types"
import type * as http from "http"
import browsersync from "browser-sync"
import parseUrl from "url-parse"

let bs: ReturnType<typeof browsersync.create>

interface Options {
	immediate?: boolean
	middleware?: StagenyMiddleware[] | StagenyMiddleware
}

export type Middleware = (
	req: http.IncomingMessage,
	res: http.ServerResponse,
	next: () => void
) => void

export type StagenyMiddleware = {
	route: string
	handle: Middleware
}

function start(Stageny: StagenyBase, options: Options = {}) {
	const config = Stageny.config()
	const dist = config.dist

	let middleware = [
		(
			req: http.IncomingMessage,
			res: http.ServerResponse,
			next: () => void
		) => {
			bs.pause()
			Stageny.pause()
			next()
		},
		// that is where we'll insert middleware from options
		(
			req: http.IncomingMessage,
			res: http.ServerResponse,
			next: () => void
		) => {
			const unicodeUrl = decodeURIComponent(req.url!)
			const parsedUrl = parseUrl(unicodeUrl).pathname
			const matchExtension = parsedUrl.match(/\w+\.(\w+)$/)
			const potentialPaths: string[] = []
			if (matchExtension) {
				potentialPaths.push(parsedUrl)
			} else {
				if (parsedUrl.endsWith("/")) {
					potentialPaths.push(`${parsedUrl}index.html`)
				} else {
					potentialPaths.push(parsedUrl)
					potentialPaths.push(`${parsedUrl}.html`)
					potentialPaths.push(`${parsedUrl}/index.html`)
				}
			}
			const pageFilter = (page: StagenyFile) =>
				potentialPaths.includes(page.url)
			const page = Stageny.sitemap.find(pageFilter)
			if (page) {
				Stageny.resume()
				const runMethod = config.alwaysRebuildSitemap ? "run" : "render"
				Stageny[runMethod]({
					filter: pageFilter,
				}).then(() => {
					try {
						const send = require("send")
						const page = Stageny.sitemap.find(pageFilter)
						send(req, page.destination).pipe(res)
						bs.resume()
					} catch (e) {
						next()
					}
				})
			} else {
				next()
			}
		},
		(
			req: http.IncomingMessage,
			res: http.ServerResponse,
			next: () => void
		) => {
			Stageny.resume()
			bs.resume()
			next()
		},
	].map((handle) => ({
		route: "",
		// override: true, // this will put our middleware to the beginning, before serve-static
		handle,
	}))

	if (options.middleware) {
		let args: [a: number, b: number, ...rest: StagenyMiddleware[]] = [1, 0]
		if (Array.isArray(options.middleware)) {
			args.push.apply(args, options.middleware)
		} else {
			args.push(options.middleware)
		}
	}

	const bsOptions = Object.assign(
		{
			server: {
				baseDir: dist,
				serveStaticOptions: {
					extensions: ["html"],
				},
			},
			files: [dist, "!**/*.html"],
			open: true,
			port: (process.env.PORT && parseInt(process.env.PORT, 10)) || 3000,
		},
		options,
		{
			middleware: middleware,
		}
	)

	bs = browsersync.create()
	bs.init(bsOptions)
}

function plugin(options: Options = { immediate: false }): StagenyPlugin {
	const immediate = options.immediate
	delete options.immediate

	function startIfNot(this: StagenyBase) {
		if (!bs) {
			start(this, options)
		}
	}

	if (immediate) {
		return {
			start: startIfNot,
		}
	} else {
		return {
			end: startIfNot,
		}
	}
}

Object.assign(plugin, {
	getBrowsersync() {
		return bs
	},
})

export default plugin
