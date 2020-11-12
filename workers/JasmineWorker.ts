import jasmineCore from 'jasmine-core';
import { workerData, parentPort, isMainThread, threadId } from 'worker_threads';
import type { MessageFromWorker } from './WorkerMessage.js';

console.log('worker thread', threadId);

const send = (message: MessageFromWorker) => parentPort?.postMessage(message);

class JasmineWorker {

	env;
	specials;

	constructor(readonly suites: string[]) {
		let jsm = jasmineCore.core(jasmineCore);
		this.env = jsm.getEnv({
			suppressLoadErrors: true,
		});
		this.env.configure({
			//failSpecWithNoExpectations
			//oneFailurePerSpec
			//failFast
			random: false
		});
		this.specials = jasmineCore.interface(jsm, this.env);
		Object.assign(global, this.specials);
	}

	async execute() {
		await Promise.all(this.suites.map(f => import('file://' + f).then((suite => {
			describe(f, () => {
				for (let [n, fn] of Object.entries<jasmine.ImplementationCallback & { x?: boolean, f?: boolean }>(suite)) {
					if (this.specials.hasOwnProperty(n)) {
						this.specials[n](fn);
					} else if (fn.x) {
						xit(n, fn);
					} else if (fn.f) {
						fit(n, fn);
					} else {
						it(n, fn);
					}
				}
			});
		}))));
		let reporter = new CompletionReporter();
		this.env.addReporter(reporter);
		await new Promise(resolve => this.env.execute(undefined, resolve));
	}

	// exitCodeCompletion(_passed: boolean) {
	// 	//Promise.all([writeStdErr(''), writeStdOut('')]).then(() => process.exit(passed ? 0 : 1));
	// }
}

class CompletionReporter implements jasmine.CustomReporter {

	jasmineStarted() {
	}

	jasmineDone(result: jasmine.RunDetails) {
		send({ message: 'testResult', result })
	}
}

if (isMainThread) {
	throw new Error('Needs to run in a worker thread');
}
new JasmineWorker(workerData).execute();