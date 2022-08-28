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

				return ast
			},
		},
	],
	filename: "ComponentMixin.pug",
	compileDebug: true,
})

FS.writeFileSync(
	"ComponentMixinSource.js",
	`export default \`${FS.readFileSync("ComponentMixin.pug")}\``
)
