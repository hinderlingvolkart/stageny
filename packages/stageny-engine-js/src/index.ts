import Path from "path"
import { StagenyRenderEngine } from "@stageny/types"
import { importUncached } from "@stageny/util"

const jsEngine: StagenyRenderEngine = {
	async read(source) {
		var importPath = Path.resolve(process.cwd(), source)
		const result = await importUncached(importPath)
		return {
			data:
				typeof result.data === "function"
					? await result.data()
					: typeof result.data === "object"
					? result.data
					: {},
			content: result.default || result.render,
		}
	},
	compile: function (file) {
		return file.content
	},
	inputFormats: ["js"],
	outputFormat: "html",
}

export default jsEngine
