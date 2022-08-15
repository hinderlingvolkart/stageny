import engine from "../index.js"

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
