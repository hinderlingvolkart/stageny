const Chokidar = require("chokidar")
const { Colorize } = require("@stageny/util")
const { normalizeInputs } = require("@stageny/util")
let started = false

function start(Stageny, options) {
	const config = Stageny.config()
	const toGlob = (key) => {
		const inputs = normalizeInputs(config[`${key}s`])
		inputs.forEach((input) => {
			input.key = key
		})
		return inputs
	}
	const templatePaths = [
		toGlob("component"),
		toGlob("layout"),
		toGlob("page"),
	]
	let reloadTimeout

	function reload() {
		return _reload()
		if (reloadTimeout) {
			clearTimeout(reloadTimeout)
		}
		reloadTimeout = setTimeout(() => {
			reloadTimeout = null
			_reload()
		}, 50)
	}

	function _reload() {
		const browsersync = options.server.getBrowsersync()
		if (browsersync) {
			if (!browsersync.paused) browsersync.reload()
		} else {
			Stageny.run()
		}
	}

	templatePaths.forEach((templateInputs) => {
		templateInputs.forEach((templateInput) => {
			const templateWatcher = watch(templateInput.glob, {
				cwd: templateInput.base,
			})

			templateWatcher.on("all", (event, filepath) => {
				if (Stageny.isSupportedFile(filepath)) {
					console.log(
						templateInput.key,
						"has changed",
						Colorize.magenta(filepath)
					)
					reload()
				}
			})
		})
	})

	const otherWatcher = watch(options.path || [])

	otherWatcher.on("all", (event, filepath) => {
		console.log("File has changed", Colorize.magenta(filepath))
		reload()
	})

	started = true
}

function watch(glob, options = {}) {
	return Chokidar.watch(
		glob,
		Object.assign(
			{
				ignoreInitial: true,
			},
			options
		)
	)
}

const plugin = function (options = {}) {
	return {
		start() {
			if (!started) {
				start(this, options)
			}
		},
	}
}

module.exports = plugin
