import { StagenyHelper, StagenyPlugin } from "@stageny/types"

import { globbySync } from "globby"
import Path from "path"
import { Colorize, importUncached } from "@stageny/util"
var helpers: Record<string, any> = {}
var handlers: Function[]
var savedOptions: {
	path?: string
} = {}

async function update() {
	helpers = {}
	handlers = []
	var files = globbySync(savedOptions.path)
	await Promise.all(
		files.map(async (file: string) => {
			var importPath = Path.resolve(process.cwd(), file)
			var key = Path.basename(file).replace(/\..+$/, "")
			try {
				const helperImport = await importUncached(importPath)
				for (const importKey in helperImport) {
					const helper = helperImport[importKey]
					if (typeof helper !== "function") {
						throw new Error(
							`Helper «${key}» (${importKey}) is not a function.`
						)
					}
					if (importKey === "on") {
						handlers.push(helper)
					} else {
						const helperKey =
							importKey === "default" ? key : importKey
						if (helpers[helperKey]) {
							console.warn(
								"Duplicate Helper «" + helperKey + "»."
							)
						}
						if (typeof helper.on === "function") {
							handlers.push(helper.on)
						}
						helpers[helperKey] = helper
					}
				}
			} catch (error) {
				if (error instanceof Error) {
					console.error(
						'Could not load helpers from "' + file + '": ',
						error.toString()
					)
				}
			}
		})
	)
	console.log(
		Colorize.green(String(Object.values(helpers).length).padStart(6)),
		"helpers"
	)
}

function plugin(options = { path: "helpers/*.js" }): StagenyPlugin {
	savedOptions = options
	update()

	return {
		beforepagedata(file, data) {
			const boundHelpers: Record<string, StagenyHelper> = {}
			Object.keys(helpers).forEach((key) => {
				const helper = helpers[key]
				boundHelpers[key] = helper.bind(data)
			})
			Object.assign(data, boundHelpers, { _helpers: boundHelpers })
		},
		all(...args) {
			Object.keys(handlers).forEach((key) => {
				const handler = handlers[key]
				handler.apply(this, args)
			})
		},
	}
}

plugin.update = update
plugin.get = function (key: string) {
	if (typeof key === "string") {
		return helpers[key]
	}
	return helpers
}

export default plugin
