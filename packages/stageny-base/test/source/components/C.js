export function render(data) {
	return `<p class="C">C: ${data.asyncData}</p><p class="cms">${data.cms}</p>`
}

export function data(data) {
	return new Promise((resolve) =>
		setTimeout(() => resolve({ asyncData: "Hello world" }), 1000)
	)
}
