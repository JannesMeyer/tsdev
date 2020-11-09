import ts from 'typescript/built/local/typescript';

function compile(fileNames: string[], options: ts.CompilerOptions) {
	let program = ts.createProgram(fileNames, options);
	let emitResult = program.emit();
	for (let diagnostic of emitResult.diagnostics) {
		if (diagnostic.file) {
			let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
			let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
			console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
		} else {
			console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
		}
	}

	process.exit(emitResult.emitSkipped ? 1 : 0);
}

let configPath = ts.findConfigFile('./src', ts.sys.fileExists, 'tsconfig.json');
if (!configPath) {
	throw new Error('Could not find tsconfig.json');
}
let { config, error } = ts.readConfigFile(configPath, ts.sys.readFile);
if (error) {
	console.log(ts.flattenDiagnosticMessageText(error.messageText, '\n'));
	process.exit(1);
}
compile(process.argv.slice(2), config.compilerOptions);