const tests = [
	{
		input: "p.Paragraph(data-text=input)= input",
		output: '<p class="Paragraph" data-text="Hello world">Hello world</p>',
	},
	{
		input: "+Component('a', { msg: input })",
		output: "Component a says: Hello world",
	},
]

const engine = require("../index")

tests.forEach((test) => {
	const renderFn = engine.compile({
		content: test.input,
	})
	const rendered = renderFn({
		input: "Hello world",
		component: (name, data = {}) => `Component ${name} says: ${data.msg}`,
	})
	console.log(rendered === test.output ? "✅" : "🔴", rendered)
})
