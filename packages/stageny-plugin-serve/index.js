let bs

function start(Stageny, options = {}) {
	const browsersync = require("browser-sync")
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
			const matchExtension = req.url.match(/\w+\.(\w+)$/)
			const potentialPaths = []
			if (matchExtension) {
				potentialPaths.push(req.url)
			} else {
				if (req.url.endsWith("/")) {
					potentialPaths.push(`${req.url}index.html`)
				} else {
					potentialPaths.push(`${req.url}.html`)
					potentialPaths.push(`${req.url}/index.html`)
				}
			}
			const pageFilter = (page) => potentialPaths.includes(page.url)
			const page = Stageny.sitemap.find(pageFilter)
			if (page) {
				Stageny.resume()
				Stageny.run({
					filter: pageFilter,
				}).then(() => {
					next()
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
