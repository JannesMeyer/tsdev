import ts from 'typescript/built/local/typescript.js';
import { Worker } from 'worker_threads';
import { MessageFromWorker } from './workers/WorkerMessage.js';

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
		runTests(emitResult.emittedFiles?.filter(f => f.endsWith(ext)));
		return emitResult;
	};
	return p;
};

// Start compiling and watching
ts.createWatchProgram(host);

function runTests(suites: string[] | undefined) {
	if (suites == null || suites.length === 0) {
			return;
	}
	let n = new Worker('./workers/JasmineWorker.js', { workerData: suites });
	let { threadId } = n;
	n.on('message', (m: MessageFromWorker) => {
		if (m.message === 'testResult') {
			console.log(n);
		}
	});
	n.on('exit', exitCode => console.log(`worker thread ${threadId} exit`, exitCode));
	n.on('error', e => console.error(`worker thread ${threadId} error`, e));
}