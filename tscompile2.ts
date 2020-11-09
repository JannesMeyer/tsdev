import ts from 'typescript/built/local/typescript';

const formatHost: ts.FormatDiagnosticsHost = {
	getCanonicalFileName: path => path,
	getCurrentDirectory: ts.sys.getCurrentDirectory,
	getNewLine: () => ts.sys.newLine,
};

const reportDiagnostic: ts.DiagnosticReporter = diagnostic => {
	console.error('Error', diagnostic.code, ':', ts.flattenDiagnosticMessageText(diagnostic.messageText, formatHost.getNewLine()));
};

const reportWatchStatusChanged: ts.WatchStatusReporter = diagnostic => {
	console.info(ts.formatDiagnostic(diagnostic, formatHost));
};

function onProgram(program: ts.EmitAndSemanticDiagnosticsBuilderProgram) {
	var x: ReturnType<typeof program.getSemanticDiagnosticsOfNextAffectedFile>;
	while (x = program.getSemanticDiagnosticsOfNextAffectedFile()) {
		let f = x.affected as ts.SourceFile;
		if (!ts.isExternalModule(f)) {
			continue;
		}
		console.log(f.fileName);

		for (let d of x.result) {
			reportDiagnostic(d);
		}
	}
	return program;
}

// Find tsconfig.json
let configPath = ts.findConfigFile('./src', ts.sys.fileExists, 'tsconfig.json');
if (!configPath) {
	throw new Error('Could not find tsconfig.json');
}

// Create WatchCompilerHost
let host = ts.createWatchCompilerHost(
	configPath,
	{},
	{
		...ts.sys,
		writeFile(...args) {
			console.log('write', args[0]);
			return ts.sys.writeFile(...args);
		},
	},
	ts.createEmitAndSemanticDiagnosticsBuilderProgram,
	reportDiagnostic,
	reportWatchStatusChanged,
);
host.createProgram = (...args) => onProgram(ts.createEmitAndSemanticDiagnosticsBuilderProgram(...args));

// Start compiling and watching
ts.createWatchProgram(host);
