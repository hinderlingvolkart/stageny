import { default as Stageny } from "@stageny/base"
import { default as StagenyData } from "@stageny/plugin-data"
import { default as StagenyHelpers } from "@stageny/plugin-helpers"
import { default as StagenyLocalisation } from "@stageny/plugin-i18n"
import { default as StagenyPagination } from "@stageny/plugin-pagination"
import rimraf from "rimraf"

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

export default Stageny
