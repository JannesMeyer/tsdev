type ReadyMessage = { message: 'ready' };
type TestMessage = { message: 'test', suites: string[] };
type TestResultMessage = { message: 'testResult' };
type WorkerMessage = ReadyMessage | TestMessage | TestResultMessage;
export default WorkerMessage;
