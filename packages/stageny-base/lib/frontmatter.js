const { cloneObject } = require("@stageny/util")
const Matter = require("gray-matter")

function extract(content) {
	return Matter(content)
}

function compileData(data) {
	return cloneObject(data, (val, key) => {
		if (key.endsWith("*")) {
			try {
				return {
					$key: key.substr(0, key.length - 1),
					$value: new Function(
						"__data__",
						`with (__data__) { return ${val} }`
					),
				}
			} catch (error) {
				throw new Error(
					`Error compiling frontmatter "${key}": ${
						error.message
					}\n${val.toString()}`
				)
			}
		}
		return val
	})
}

function processData(data, input) {
	return cloneObject(data, (val, key) => {
		try {
			if (typeof val === "function") {
				return val(input)
			}
		} catch (error) {
			throw new Error(
				`Error processing frontmatter "${key}": ${
					error.message
				}\n${val.toString()}`
			)
		}
		return val
	})
}

module.exports = {
	extract,
	compile: compileData,
	process: processData,
}
