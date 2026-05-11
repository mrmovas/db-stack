import { spawn } from "node:child_process";

export function runSystemCommand(
	command: string,
	args: string[],
	envVars: NodeJS.ProcessEnv,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, {
			env: envVars,
			stdio: ["ignore", "ignore", "pipe"],
		});

		let stderr = "";
		child.stderr.on("data", (chunk) => {
			stderr += chunk.toString();
		});

		child.on("error", (error) => {
			reject(error);
		});

		child.on("close", (code) => {
			if (code === 0) {
				resolve();
				return;
			}

			reject(
				new Error(
					`${command} failed with exit code ${code}${stderr ? `: ${stderr.trim()}` : ""}`,
				),
			);
		});
	});
}
