module.exports = function cloneObject(data, valueTransformer = null) {
	if (!(typeof data === "object") || !data) return data
	const result = data instanceof Array ? [] : {}
	Object.keys(data).forEach((key) => {
		let val = data[key]
		val = valueTransformer ? valueTransformer(val, key) : val
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
		if (val && typeof val === "object") {
			val = cloneObject(val, valueTransformer)
		}
		result[key] = val
	})
	return result
}
