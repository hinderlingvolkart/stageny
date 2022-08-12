import Pug from "pug"
import ComponentMixinPlugin from "./index.js"
;["a", "b", "c", "d", "e", "f"].forEach((key) => {
	try {
		const html = Pug.renderFile(`test/${key}.pug`, {
			plugins: [ComponentMixinPlugin()],
			component(name, options = {}) {
				return `***${name}: ${JSON.stringify(options)}***`
			},
		})
		assert(
			key,
			html.indexOf("Sesam öffne dich") >= 0 &&
				html.indexOf("***Paragraph") >= 0
		)
		console.log(html)
	} catch (error) {
		assert(key, false)
		console.log(error)
	}
})

try {
	const html = Pug.renderFile(`test/b.pug`, {
		plugins: [ComponentMixinPlugin()],
	})
	console.log(html)
} catch (error) {
	assert(
		"function missing",
		error.toString().indexOf("component function is missing") >= 0
	)
}

function assert(key, condition) {
	console.log(condition ? "✅" : "🛑", key)
}
