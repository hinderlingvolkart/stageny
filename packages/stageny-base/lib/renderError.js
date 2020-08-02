module.exports = {
	renderAsHtml(error) {
		return `
		<html>
		<head>
		<style>
			.Stageny-Error {
				border: 14px solid #ffc6d6;
				padding: 20px;
				tab-size: 2;
				margin: 30px;
				box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
				background: #fff5f8;
				background-image: linear-gradient(45deg, #fff5f8 25%, #ffffff 25%, #ffffff 50%, #fff5f8 50%, #fff5f8 75%, #ffffff 75%, #ffffff 100%);
				background-size: 28.28px 28.28px;
			}
			.Stageny-Error > pre {
				font: 13px/20px Monaco, Menlo, monospace;
			}
			.Stageny-Error--message {
				font-style: italic;
				margin-top: 0;
				margin-bottom: 20px;
			}
			.Stageny-Error--stack {
				margin: 0;
			}
		</style>
		</head>

		<body>
		<div class="Stageny-Error">
			${renderMessage(error)}
			${renderStack(error)}
		</div>
		</body>
		</html>
		`
	},
}

function renderMessage(error) {
	if (error.stack && error.stack.indexOf(error.message) >= 0) return ""
	return `<pre class="Stageny-Error--message">${error.message}</pre>`
}

function renderStack(error) {
	return `<pre class="Stageny-Error--stack">${error.stack}</pre>`
}
