import ts from 'typescript/built/local/typescriptServices.out';

function watchMain() {
	let configPath = ts.findConfigFile('./src', ts.sys.fileExists, 'tsconfig.json');
	if (!configPath) {
		throw new Error('Could not find tsconfig.json');
	}

	let host = ts.createWatchCompilerHost(
		configPath,
		{},
		{
			...ts.sys,
			writeFile(...args) {
				console.log('write file', ...args);
				return ts.sys.writeFile(...args);
			},
		},
		ts.createEmitAndSemanticDiagnosticsBuilderProgram,
		reportDiagnostic,
		reportWatchStatusChanged,
	);
	host.createProgram = (...args) => onProgram(ts.createEmitAndSemanticDiagnosticsBuilderProgram(...args));
	ts.createWatchProgram(host);
	console.log(host);
}

function onProgram(program: ts.EmitAndSemanticDiagnosticsBuilderProgram) {
	var x: ReturnType<typeof program.getSemanticDiagnosticsOfNextAffectedFile>;
	while (x = program.getSemanticDiagnosticsOfNextAffectedFile()) {
		let f = x.affected as ts.SourceFile;
		if (f.isDeclarationFile) {
			continue;
		}
		console.log(f);
		for (let d of x.result) {
			reportDiagnostic(d);
		}
	}
	return program;
}

function reportDiagnostic(diagnostic: ts.Diagnostic) {
	console.error('Error', diagnostic.code, ':', ts.flattenDiagnosticMessageText(diagnostic.messageText, formatHost.getNewLine()));
}

function reportWatchStatusChanged(diagnostic) {
	console.info(ts.formatDiagnostic(diagnostic, formatHost));
}

const formatHost = {
	getCanonicalFileName: path => path,
	getCurrentDirectory: ts.sys.getCurrentDirectory,
	getNewLine: () => ts.sys.newLine
};

watchMain();