import { MinimalGlobInputs, GlobInputs } from "@stageny/types"

export default function normalizeInputs(inputs: any): GlobInputs[] {
	let normalizeInputs: MinimalGlobInputs[]
	if (
		typeof inputs === "string" ||
		(inputs instanceof Array && typeof inputs[0] === "string")
	) {
		normalizeInputs = [
			{
				glob: inputs instanceof Array ? (inputs as string[]) : [inputs],
			},
		]
	} else if (inputs instanceof Array) {
		normalizeInputs = inputs as GlobInputs[]
	} else {
		normalizeInputs = [inputs as GlobInputs]
	}
	return normalizeInputs.map((input) => {
		return {
			glob: input.glob || "**/*.*",
			base: input.base || "",
			dest: input.dest || "",
		}
	})
}
