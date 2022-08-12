import { StagenyPlugin } from "@stageny/types"

import { cloneObject } from "@stageny/util";

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
						this.getConfig().data
					)
					collection.forEach((item: any) => {
						const newPage = cloneObject(page)
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
		},
	}
}
