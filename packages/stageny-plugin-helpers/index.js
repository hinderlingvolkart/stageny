var globby = require("globby")
var Path = require("path")
const { Colorize } = require("@stageny/util")
var helpers = {}
var savedOptions = {}

function update() {
	helpers = {}
	var files = globby.sync(savedOptions.path)
	files.forEach(function (file) {
		var requirePath = Path.relative(__dirname, file)
		delete require.cache[require.resolve(requirePath)]
		var key = Path.basename(file).replace(/\..+$/, "")
		try {
			helpers[key] = require(requirePath)
			if (typeof helpers[key] !== "function") {
				throw new Error(`Helper «${key}» is not a function.`)
			}
		} catch (error) {
			console.error(
				'Could not load helpers from "' + file + '": ',
				error.toString()
			)
		}
	})
	console.log(
		Colorize.green(String(Object.values(helpers).length).padStart(6)),
		"helpers"
	)
}

function plugin(options = { path: "helpers/*.js" }) {
	savedOptions = options
	update()

	return {
		beforepagedata(file, data) {
			const boundHelpers = {}
			Object.keys(helpers).forEach((key) => {
				const helper = helpers[key]
				boundHelpers[key] = helper.bind(data)
			})
			Object.assign(data, boundHelpers, { _helpers: boundHelpers })
		},
		all(...args) {
			Object.keys(helpers).forEach((key) => {
				const helper = helpers[key]
				if (helper.on) {
					helper.on.apply(this, args)
				}
			})
		},
	}
}

plugin.update = update
plugin.get = function (key) {
	if (typeof key === "string") {
		return helpers[key]
	}
	return helpers
}

module.exports = plugin
