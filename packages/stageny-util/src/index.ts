import { default as cloneObject } from "./lib/cloneObject.js"
import { default as normalizeInputs } from "./lib/normalizeInputs.js"
import { default as Perf } from "./lib/perf.js"

export { cloneObject, normalizeInputs, Perf }

export function log(...rest: any) {
	console.log.apply(null, rest)
}

export * as Colorize from "ansi-colors"
