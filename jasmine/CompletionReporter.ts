export default class CompletionReporter {

	onCompleteCallback: (passed: boolean) => void = () => {};
	exitHandler?: () => void;
	completed = false;

	isComplete = () => this.completed;

	onComplete = (callback: (passed: boolean) => void) => {
		this.onCompleteCallback = callback;
	};

	jasmineStarted = () => {
		if (this.exitHandler) {
			process.on('exit', this.exitHandler);
		}
	};

	jasmineDone = (result: any) => {
		this.completed = true;
		if (this.exitHandler) {
			process.removeListener('exit', this.exitHandler);
		}

		this.onCompleteCallback(result.overallStatus === 'passed');
	};
}
