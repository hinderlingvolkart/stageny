/**
 * Measure the execution time of multiple sections of your code, then
 * effortlessly print all the timer results at once to the console.
 */

class MeasureTime {
	constructor() {
		this.data = {}
	}

	/**
	 * Begin the timer.
	 * @param {string} what - Label, e.g. "loading file".
	 */
	start(what) {
		return {
			name: what,
			start: Date.now(),
		}
	}

	/**
	 * End the timer.
	 * @param {object} what - Label, e.g. "loading file".
	 */
	end(measurement) {
		const what = measurement.name
		if (!this.data[what]) {
			this.data[what] = {
				name: what,
				total: 0,
				count: 0,
			}
		}
		const item = this.data[what]
		measurement.end = Date.now()
		item.total += measurement.end - measurement.start
		item.count++
	}

	/**
	 * Print the results to the console.
	 * @returns {str} - The formatted result, same as those printed to console.
	 */
	print(sorted = false) {
		const items = Object.values(this.data)
		if (sorted) {
			items.sort((a, b) => b.total - a.total)
		}
		let str = items
			.map(
				(item) =>
					`${item.name}: ${item.total} ms ${
						item.count > 1 ? " | " + item.count + " times" : ""
					}`
			)
			.join("\r\n")

		console.log(str)
		return str
	}

	clean() {
		let cleaned = {}
		this.data = cleaned
	}
}

module.exports = MeasureTime
