module.exports.cloneObject = require("./lib/cloneObject")
module.exports.normalizeInputs = require("./lib/normalizeInputs")
module.exports.Perf = require("./lib/perf")

module.exports.log = function (...rest) {
	console.log.apply(null, rest)
}

module.exports.Colorize = require("ansi-colors")
