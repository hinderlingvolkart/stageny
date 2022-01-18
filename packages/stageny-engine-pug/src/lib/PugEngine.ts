import ComponentMixin from "../PugComponentMixin/index"
import Pug from "pug"
import { StagenyRenderEngine } from "@stageny/types"

const pugEngine: StagenyRenderEngine = {
	compile(file, options = {}) {
		return Pug.compile(
			file.content || "",
			Object.assign({}, options, {
				plugins: [ComponentMixin()].concat(options.plugins || []),
				filename: file.sourcePath,
				compileDebug: true,
			})
		)
	},
	inputFormats: ["pug"],
	outputFormat: "html",
}

export default pugEngine
