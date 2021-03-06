const Stageny = require(`@stageny/base`)
const StagenyData = require(`@stageny/plugin-data`)
const StagenyHelpers = require(`@stageny/plugin-helpers`)
const StagenyLocalisation = require(`@stageny/plugin-i18n`)
const StagenyPagination = require(`@stageny/plugin-pagination`)
const rimraf = require("rimraf")

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
