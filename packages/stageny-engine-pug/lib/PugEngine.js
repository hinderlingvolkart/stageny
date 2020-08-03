const ComponentMixin = require("../PugComponentMixin/index")
const Pug = require("pug")

module.exports = {
	compile: function (file, options = {}) {
		return Pug.compile(
			file.content,
			Object.assign({}, options, {
				plugins: [ComponentMixin()].concat(options.plugins || []),
				filename: file.sourcePath,
				compileDebug: true,
			})
		)
	},
	inputFormats: ["pug"],
	outputFormat: "html",
}
