import ComponentMixin from "./ComponentMixin.js"
import ComponentMixinSource from "./ComponentMixinSource.js"
import generateCode from "pug-code-gen"

export default function () {
	return {
		preCodeGen(ast, options) {
			ast.nodes.unshift.apply(ast.nodes, ComponentMixin)
			return ast
		},
		generateCode(ast, options) {
			if (typeof options.includeSources !== "object") {
				options.includeSources = {}
			}
			options.includeSources["ComponentMixin.pug"] = ComponentMixinSource
			return generateCode(ast, options)
		},
	}
}
