module.exports = {
	data() {
		return new Promise((resolve) => {
			setTimeout(() => resolve({ id: 99 }), 500)
		})
	},
	render(data) {
		return `<p class="B">B: ${data.content}</p><p class="cms">${data.cms}</p>`
	},
}
