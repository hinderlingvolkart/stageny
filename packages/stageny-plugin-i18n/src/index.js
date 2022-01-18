const cloneDeep = require("clone-deep")
var Path = require("path")

/*
options:
	lang: Array or Function(page) => Array
	exclude: Function(page) => Boolean
*/

module.exports = function (
	options = { lang: ["de", "en", "fr"], exclude: null }
) {
	return {
		sitemap(pages) {
			const prevPages = Object.assign([], pages)
			pages.length = 0
			prevPages.forEach((page) => {
				if (options.exclude && options.exclude(page)) {
					pages.push(page)
				}
				const languages =
					typeof options.lang === "function"
						? options.lang(page)
						: options.lang
				if (languages instanceof Array) {
					languages.forEach((lang) => {
						const newPage = cloneDeep(page)
						newPage.url = Path.join("/", lang, page.url)
						newPage.meta.data.locale = lang
						pages.push(newPage)
					})
				} else {
					pages.push(page) // or not at all?
				}
			})
			return pages
		},
	}
}
