const mkdirp = require("mkdirp")
const FS = require("fs")
const Path = require("path")
const rimraf = require("rimraf")

rimraf.sync("source")

const componentCategories = ["base", "global", "content"]
const components = []
for (var i = 0; i < 90; i++) {
	const componentName = `Component${i + 1}`
	const componentPath = `source/components/${
		componentCategories[i % componentCategories.length]
	}/${componentName}/${componentName}.pug`
	components.push({
		name: componentName,
		path: componentPath,
		descendants: {},
		children: [],
		parents: [],
	})
}

function saveFile(path, content) {
	path = Path.join(__dirname, path)
	mkdirp.sync(Path.dirname(path))
	FS.writeFileSync(path, content)
}

function rand(max) {
	return Math.floor(Math.random() * max)
}
function setDescendant(node, descendant) {
	node.descendants[descendant.path] = true
	Object.keys(descendant.descendants).forEach((p) => {
		node.descendants[p] = true
	})
	node.parents.forEach((p) => setDescendant(p, descendant))
}
function getRandomComponent(myPath) {
	const origin = components.find((c) => c.path === myPath)
	const availableComponents = components.filter(
		(c) => c.path !== myPath && !c.descendants[myPath]
	)
	// console.log(
	// 	'available for',
	// 	origin.name,
	// 	':',
	// 	availableComponents.map((c) => c.name)
	// );
	if (availableComponents.length === 0) return

	const randomComponent =
		availableComponents[rand(availableComponents.length)]

	if (origin) {
		if (randomComponent.parents.indexOf(origin) === -1) {
			randomComponent.parents.push(origin)
		}
		setDescendant(origin, randomComponent)
	}

	return randomComponent
}

const contentSnippets = [
	() => `
h2 Another Title
p Mr. Bennet was among the earliest of those who waited on Mr. Bingley. He had always intended to visit him, though to the last always assuring his wife that he should not go; and till the evening after the visit was paid she had no knowledge of it. It was then disclosed in the following manner.
`,
	() => `
.Card
	h2.Card--title Great stuff
	.Card--text: p You really should believe it is!
`,
	(randomComponent) => {
		return !randomComponent
			? ""
			: `
h2 ${randomComponent.name}
+Component('${randomComponent.name}', { title: '${randomComponent.name}' })
	p Mrs. Bennet deigned not to make any reply, but, unable to contain herself, began scolding one of her daughters.
`
	},
	(randomComponent) => {
		return !randomComponent
			? ""
			: `
h2 ${randomComponent.name}
+Component('${randomComponent.name}', { title: '${randomComponent.name}' })
`
	},
	() => `
h2 List
ul
	- for (var i=0; i<20; i++)
		li: a(href=('#' + i)) I am list item #{i+1}
`,
]

function createRandomCode(myPath, parts = 10) {
	let code = ""
	const a = getRandomComponent(myPath)
	const b = getRandomComponent(myPath)
	const c = getRandomComponent(myPath)
	console.log(
		"Adding",
		[a, b, c].map((c) => c && c.name),
		"to",
		myPath
	)

	for (var i = 0; i < parts; i++) {
		const component = [a, b, c][i % 3]
		code += contentSnippets[i % contentSnippets.length](component)
	}
	return code
}

function createSimpleCode(myPath, parts = 10) {
	let code = ""
	for (var i = 0; i < parts; i++) {
		code += contentSnippets[i % contentSnippets.length]()
	}
	return code
}

function prefixLines(prefix, str) {
	return str.replace(/^(.)/gm, `${prefix}$1`)
}

components.forEach((c, i) => {
	c.code = i % 3 === 0 ? createRandomCode(c.path) : createSimpleCode(c.path)
	saveFile(c.path, c.code)
})

FS.unlinkSync(components[50].path)
saveFile(
	components[50].path.replace(".pug", ".swig"),
	`<h3>I am swig: {{ title }}</h3>`
)

for (let i = 0; i < 100; i++) {
	const pagePath = `source/pages/page-${i + 1}.html.pug`
	let code = `---
title: Page ${i + 1}
layout: default
---

`
	code += createRandomCode(pagePath)
	saveFile(pagePath, code)
}

saveFile(
	"source/layouts/base.pug",
	`
html
	head
		title= title
	body
		!= content

		${prefixLines("		", createRandomCode())}
`
)

saveFile(
	"source/layouts/default.pug",
	`---
layout: base
---

${prefixLines("", createRandomCode())}

!= content
`
)
