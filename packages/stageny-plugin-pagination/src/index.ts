import { StagenyPlugin } from "@stageny/types"

const { cloneDeep } = require("@stageny/util")

export default function (options = {}): StagenyPlugin {
	return {
		sitemap(pages) {
			console.log("Scanning sitemap for pagination")
			const prevPages = [...pages]
			pages.length = 0
			prevPages.forEach((page) => {
				if (page.meta.pagination) {
					const collection = page.meta.pagination.call(
						this,
						this.config().data
					)
					collection.forEach((item: any) => {
						const newPage = cloneDeep(page)
						Object.assign(newPage.meta.data, item)
						const metaAndData = Object.assign(
							{},
							newPage.meta,
							newPage.meta.data
						)
						newPage.url = newPage.url.replace(
							/\{(.+?)\}/g,
							(a, found) => {
								let val = newPage.meta[found]
								return typeof val === "function"
									? val(metaAndData)
									: val
							}
						)
						pages.push(newPage)
					})
				} else {
					pages.push(page)
				}
			})
			return pages
		},
	}
}
