const { default: Stageny } = require(`@stageny/base`)
const { default: StagenyData } = require(`@stageny/plugin-data`)
const { default: StagenyHelpers } = require(`@stageny/plugin-helpers`)
const { default: StagenyLocalisation } = require(`@stageny/plugin-i18n`)
const { default: StagenyPagination } = require(`@stageny/plugin-pagination`)
const rimraf = require("rimraf")

console.dir(Stageny)

rimraf.sync(Stageny.config().dist)

Stageny.config((config) => {
	config.plugins.push(StagenyData({ path: "source/data/*.json" }))
	config.plugins.push(StagenyHelpers({ path: "source/helpers/*.js" }))

	config.plugins.push(
		StagenyLocalisation({
			lang: (page) => {
				const localize = page.meta.localize !== false
				if (localize) return ["en", "de"]
			},
		})
	)
})

module.exports = Stageny
