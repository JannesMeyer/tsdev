const { compilerOptions } = require('./src/tsconfig.json');
const ts = require('typescript/built/local/typescript');

/**
 * @param fileNames {string[]}
 * @param options {ts.CompilerOptions}
 */
function compile(fileNames, options) {
	let program = ts.createProgram(fileNames, options);
	let emitResult = program.emit();
	for (let diagnostic of emitResult.diagnostics) {
		if (diagnostic.file) {
			let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
			let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
			console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
		} else {
			console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
		}
	}

	process.exit(emitResult.emitSkipped ? 1 : 0);
}

compile(process.argv.slice(2), compilerOptions);