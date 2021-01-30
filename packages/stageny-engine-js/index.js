const Path = require("path")

module.exports = {
	async read(source) {
		var requirePath = Path.relative(__dirname, source)
		delete require.cache[require.resolve(requirePath)]
		const result = require(requirePath)
		if (result.data) {
			return {
				data:
					typeof result.data === "function"
						? await result.data()
						: result.data,
				content: result.render,
			}
		} else {
			return {
				data: {},
				content: result,
			}
		}
	},
	compile: function (file) {
		return file.content
	},
	inputFormats: ["js"],
	outputFormat: "html",
}
