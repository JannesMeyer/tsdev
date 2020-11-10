import jasmineCore from 'jasmine-core';
import path from 'path';
import util from 'util';
import CompletionReporter from './CompletionReporter.js';

const writeStdOut = util.promisify(process.stdout.write);
const writeStdErr = util.promisify(process.stderr.write);

export default class Jasmine {

	env;
	specials;
	helperFiles = new Set<string>();
	specFiles = new Set<string>();

	constructor(readonly ext: string) {
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

    clear() {
        this.specFiles.clear();
        this.helperFiles.clear();
    }

	async execute() {
        await Promise.all(Array.from(this.helperFiles, f => import('file://' + f)));
		await Promise.all(Array.from(this.specFiles, f => import('file://' + f).then((suite => {
			describe(path.basename(f, this.ext), () => {
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
		console.log(this.env);
		let reporter = new CompletionReporter();
		this.env.addReporter(reporter);
		await new Promise(resolve => this.env.execute(undefined, resolve));
	}

	exitCodeCompletion(_passed: boolean) {
		//Promise.all([writeStdErr(''), writeStdOut('')]).then(() => process.exit(passed ? 0 : 1));
	}
}