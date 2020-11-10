export default class CompletionReporter implements jasmine.CustomReporter {

	completed = false;

	jasmineStarted() {
		console.log('jasmine started');
	}

	jasmineDone(result: any) {
		this.completed = true;
		console.log(result);
	}
}
