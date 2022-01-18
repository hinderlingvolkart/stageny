import ComponentMixin from "./ComponentMixin"

export default function () {
	return {
		preCodeGen(ast, options) {
			ast.nodes.unshift.apply(ast.nodes, ComponentMixin)
			return ast
		},
	}
}
