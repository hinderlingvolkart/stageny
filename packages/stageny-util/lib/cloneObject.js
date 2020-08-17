module.exports = function cloneObject(data, valueTransformer = null) {
	return deepClone(data, valueTransformer)
}

function deepClone(obj, valueTransformer = null, hash = new WeakMap()) {
	// Do not try to clone primitives or functions
	if (typeof obj !== "object" || obj === null || obj instanceof Function)
		return obj
	if (hash.has(obj)) return hash.get(obj) // Cyclic reference
	const result = new obj.constructor()
	// Register in hash
	hash.set(obj, result)
	// Clone and assign enumerable own properties recursively
	return Object.assign(
		result,
		...Object.keys(obj).map((key) => {
			let val = valueTransformer
				? valueTransformer(obj[key], key)
				: obj[key]

			// valueTransformer can return { key: String, value: * }
			if (
				valueTransformer &&
				val &&
				typeof val === "object" &&
				val.key &&
				val.value
			) {
				key = val.key
				val = val.value
			}

			return { [key]: deepClone(val, valueTransformer, hash) }
		})
	)
}
