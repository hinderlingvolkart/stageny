import { cloneObject } from "@stageny/util"
import { StagenyData } from "@stageny/types"

import Matter from "gray-matter"

function extract(content: string) {
	return Matter(content)
}

function compileData(data: StagenyData): StagenyData {
	return cloneObject(data, (val: any, key: string) => {
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
				if (error instanceof Error) {
					throw new Error(
						`Error compiling frontmatter "${key}": ${
							error.message
						}\n${val.toString()}`
					)
				}
			}
		}
		return val
	}) as StagenyData
}

function processData(data: StagenyData, input: StagenyData) {
	return cloneObject(data, (val, key) => {
		try {
			if (typeof val === "function") {
				return val(input)
			}
		} catch (error) {
			throw new Error(
				`Error processing frontmatter "${key}": ${
					(error as Error).message
				}\n${val.toString()}`
			)
		}
		return val
	})
}

export default {
	extract,
	compile: compileData,
	process: processData,
}
