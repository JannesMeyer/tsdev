import ts from 'typescript/built/local/typescript.js';
import Jasmine from './workers/Jasmine.js';

const ext = '.test.js';

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

// Find tsconfig.json
let configPath = ts.findConfigFile('./src', ts.sys.fileExists, 'tsconfig.json');
if (!configPath) {
	throw new Error('Could not find tsconfig.json');
}

// Create WatchCompilerHost
let host = ts.createWatchCompilerHost(
	configPath,
	{ listEmittedFiles: true },
	ts.sys,
	ts.createEmitAndSemanticDiagnosticsBuilderProgram,
	reportDiagnostic,
	reportWatchStatusChanged,
);
host.createProgram = (...args) => {
	let p = ts.createEmitAndSemanticDiagnosticsBuilderProgram(...args);
	//let x: ts.AffectedFileResult<readonly ts.Diagnostic[]>;
	var jasmine = new Jasmine(ext);
	// while (x = p.getSemanticDiagnosticsOfNextAffectedFile()) {
	// 	let f = x.affected as ts.SourceFile;
	// 	if (!ts.isExternalModule(f)) {
	// 		continue;
	// 	}
	// 	console.log(f.fileName);
	// 	for (let d of x.result) {
	// 		reportDiagnostic(d);
	// 	}
	// }
	let { emit } = p;
	p.emit = function myEmit(...emitArgs) {
		let emitResult = emit(...emitArgs);
		for (let f of emitResult.emittedFiles ?? []) {
			if (f.endsWith(jasmine.ext)) {
				jasmine.specFiles.add(f);
			}
		}
		jasmine.execute(); // Start async run
		return emitResult;
	};
	return p;
};

// Start compiling and watching
ts.createWatchProgram(host);
