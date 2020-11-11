import jasmineCore from 'jasmine-core';
import CompletionReporter from './CompletionReporter.js';
import type WorkerMessage from './WorkerMessage.js';

process.on('message', handleMessage);
process.send!({ message: 'ready' });

function handleMessage(m: WorkerMessage) {
  console.log('JasmineWorker got message:', m);
	if (m.message === 'test') {
		new JasmineWorker(m.suites).execute();
	}
}

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