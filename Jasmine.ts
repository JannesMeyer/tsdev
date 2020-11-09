import jasmineCore from 'jasmine-core';
import util from 'util';

const writeStdOut = util.promisify(process.stdout.write);
const writeStdErr = util.promisify(process.stderr.write);

export default class Jasmine {

	env;
	jasmineInterface;
	helperFiles = new Set<string>();
	specFiles = new Set<string>();

	constructor() {
		let jasmine = jasmineCore.core(jasmineCore);
		this.env = jasmine.getEnv({
			suppressLoadErrors: true,
		});
		this.env.configure({
			//failSpecWithNoExpectations
			//oneFailurePerSpec
			//failFast
			random: false
        });

        this.jasmineInterface = jasmineCore.interface(jasmine, this.env);
		let { expect, expectAsync, fail, pending, setSpecProperty, setSuiteProperty, spyOn, spyOnAllFunctions, spyOnProperty } = this.jasmineInterface;
		Object.assign(global, { expect, expectAsync, fail, pending, setSpecProperty, setSuiteProperty, spyOn, spyOnAllFunctions, spyOnProperty });
	}

	async execute() {
        await Promise.all(Array.from(this.helperFiles, f => import('file://' + f)));
        await Promise.all(Array.from(this.specFiles, f => import('file://' + f)));
		// this.env.configure({specFilter: function(spec) {
		// return specFilter.matches(spec.getFullName());
		// }});
	}

	exitCodeCompletion(passed: boolean) {
		Promise.all([writeStdErr(''), writeStdOut('')]).then(() => process.exit(passed ? 0 : 1));
	}
}