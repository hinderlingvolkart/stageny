const Path = require("path")

const defaultOptions = {
	stripHtmlExtension: !process.env.KEEP_HTML,
	relative: true,
}

module.exports = function (path, userOptions = {}) {
	if (!path && path !== "") return path
	const options = { ...defaultOptions, ...userOptions }

	var page = this._page
	var isAbsolute = path.charAt(0) === "/"
	let relativePath = path

	// /path/to/page.html --> ../to/page.html
	if (isAbsolute && options.relative !== false) {
		var pageDirectory = Path.dirname(page.url)
		relativePath = Path.relative(pageDirectory, path) || "./"
		if (path.endsWith("/") && !relativePath.endsWith("/")) {
			relativePath += "/"
		}
	}

	// path/to/index.html --> path/to/
	relativePath = relativePath.replace(/\/index\.html$/, "/")

	// path/to/page.html --> path/to/page
	if (options.stripHtmlExtension) {
		relativePath = relativePath.replace(/\.html$/, "")
	}
	return relativePath
}
