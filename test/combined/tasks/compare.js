import { readFileSync } from "fs"
import { globbySync } from "globby"
import { join, relative } from "path"

const expectedFiles = globbySync("dist-expected/**/*.html")
const actualFiles = globbySync("dist/**/*.html")

expectedFiles.map((expectedFile) => {
	const actualFile = join("dist", relative("dist-expected", expectedFile))
	if (!actualFiles.includes(actualFile)) {
		logError(`File not found: ${actualFile}`)
	}
	const expectedContents = readFileSync(expectedFile, "utf8")
	const actualContents = readFileSync(actualFile, "utf8")
	if (expectedContents !== actualContents) {
		logError(`Contents do not match: ${actualFile}`)
	} else {
		console.log("✅ " + actualFile)
	}
})
actualFiles.map((actualFile) => {
	const expectedFile = join("dist-expected", relative("dist", actualFile))
	if (!expectedFiles.includes(expectedFile)) {
		logError(`File not expected: ${actualFile}`)
	}
})

function logError(msg) {
	console.error("❌ " + msg)
}
