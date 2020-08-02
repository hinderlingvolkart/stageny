module.exports = function normalizeInputs(inputs) {
	if (
		typeof inputs === "string" ||
		(inputs instanceof Array && typeof inputs[0] === "string")
	) {
		inputs = {
			glob: inputs,
		}
	}
	if (!(inputs instanceof Array)) {
		inputs = [inputs]
	}
	inputs.forEach((input) => {
		if (!input.base) {
			input.base = ""
		}
		if (!input.dest) {
			input.dest = ""
		}
		if (!input.glob) {
			input.glob = "**/*.*"
		}
	})
	return inputs
}
