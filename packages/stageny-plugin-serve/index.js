let bs

function start(Stageny, options = {}) {
	const browsersync = require("browser-sync")
	const parseUrl = require("url-parse")
	const config = Stageny.config()
	const dist = config.dist

	let middleware = [
		(req, res, next) => {
			bs.pause()
			Stageny.pause(true)
			next()
		},
		// that is where we'll insert middleware from options
		(req, res, next) => {
			const unicodeUrl = decodeURIComponent(req.url)
			const parsedUrl = parseUrl(unicodeUrl).pathname
			const matchExtension = parsedUrl.match(/\w+\.(\w+)$/)
			const potentialPaths = []
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
			const pageFilter = (page) => potentialPaths.includes(page.url)
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
					} catch (e) {
						next()
					}
				})
			} else {
				next()
			}
		},
		(req, res, next) => {
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
		middleware.splice.apply(middleware, [1, 0].concat(options.middleware))
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
			port: parseInt(process.env.PORT, 10) || 3000,
		},
		options,
		{
			middleware: middleware,
		}
	)

	bs = browsersync.create()
	bs.init(bsOptions)
}

function plugin(options = { immediate: false }) {
	const immediate = options.immediate
	delete options.immediate

	function startIfNot() {
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

module.exports = plugin
