import type { StagenyPlugin } from "@stageny/types"
import Chokidar from "chokidar"
import { Colorize } from "@stageny/util"
import { normalizeInputs } from "@stageny/util"
import { GlobInputs } from "@stageny/types"
let started = false

type ExtendedGlob = GlobInputs & { key?: string }

function start(Stageny: any, options: any) {
	const config = Stageny.getConfig()
	const toGlob = (key: string) => {
		const inputs: ExtendedGlob[] = normalizeInputs(config[`${key}s`])
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

function watch(glob: string | string[], options = {}) {
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

const plugin = function (options = {}): StagenyPlugin {
	return {
		start() {
			if (!started) {
				start(this, options)
			}
		},
	}
}

export default plugin
