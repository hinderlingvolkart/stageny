const Path = require("path")

class StagenyConfig {
	constructor() {
		this.reset()
	}

	reset() {
		this.components = { glob: "**/*.*", base: "source/components" }
		this.pages = { glob: "**/*.*", base: "source/pages/" }
		this.layouts = { glob: "**/*.*", base: "source/layouts" }
		this.componentName = getFileName
		this.layoutName = getFileName
		this.data = {}
		this.formats = ["pug", "js"]
		this.engineOptions = {}
		this.plugins = []
		this.dist = "dist"
		this.verbose = false
	}
}

function getFileName(file) {
	return (
		(file.rawMeta && file.rawMeta.name) ||
		(file.meta && file.meta.name) ||
		Path.basename(file.url)
			.replace(/\.\w+$/, "")
			.replace(/^_/, "")
	)
}

module.exports = StagenyConfig
