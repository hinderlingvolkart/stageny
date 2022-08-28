import ComponentMixin from "../PugComponentMixin/index.js"
import Pug from "pug"
import { StagenyRenderEngine } from "@stageny/types"

const pugEngine: StagenyRenderEngine = {
	compile(file, options = {}) {
		try {
			return Pug.compile(
				file.content || "",
				Object.assign({}, options, {
					plugins: [ComponentMixin()].concat(options.plugins || []),
					filename: file.sourcePath,
					compileDebug: true,
				})
			)
		} catch (e) {
			let message = `Error compiling pug ${file.sourcePath}:\n${e.message}`
			if (e.babylonError) {
				message += `\nBabylon Parser Error: ${e.babylonError.message}`
			}
			throw new Error(message)
		}
	},
	inputFormats: ["pug"],
	outputFormat: "html",
}

export default pugEngine
