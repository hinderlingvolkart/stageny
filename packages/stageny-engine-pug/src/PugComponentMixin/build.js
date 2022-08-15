import Pug from "pug"
import FS from "fs"

const compiled = Pug.compileFile("ComponentMixin.pug", {
	plugins: [
		{
			preCodeGen(ast) {
				const result = JSON.stringify(ast.nodes, null, 2)
				FS.writeFileSync(
					"ComponentMixin.js",
					`export default ${result}`
				)

				return {
					type: "Block",
					nodes: [],
				}
			},
		},
	],
	filename: "ComponentMixin.pug",
})
