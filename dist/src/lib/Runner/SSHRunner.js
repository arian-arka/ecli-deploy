"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSHRunner = void 0;
const Runner_1 = require("./Runner");
const ssh2_1 = require("ssh2");
class SSHRunner extends Runner_1.Runner {
    constructor() {
        super(...arguments);
        this.startedReading = false;
        this.outputBuffer = '';
        this.currentId = 0;
        this.pendingCommands = new Map();
    }
    throwError(data) {
        throw typeof data === 'string' ? new Error(data) : data;
    }
    closeShellOnError(error) {
        let description = error;
        if (description instanceof Error)
            description = error.message;
        this.log.error({
            title: `Shell -> error`,
            description: error,
        });
        this.close().then(() => this.throwError(error));
    }
    makeProps() {
        var _a, _b;
        return {
            host: (_a = this.props.host) !== null && _a !== void 0 ? _a : '127.0.0.1',
            port: (_b = this.props.port) !== null && _b !== void 0 ? _b : 22,
            username: this.props.username,
            password: this.props.password,
            privateKey: this.props.privateKey,
            passphrase: this.props.passphrase,
            keepaliveInterval: this.props.keepaliveInterval,
            timeout: this.props.timeout,
        };
    }
    onceEvents(client) {
        client.on('error', error => {
            this.log.error({
                title: `Client -> error`,
                description: [
                    `Message : ${error.message}`,
                    `Name : ${error.name}`,
                    `Description : ${error.description}`,
                    `Stack : ${error.stack}`,
                    `Level : ${error.level}`,
                ],
            });
            throw error;
        });
        client.on('close', () => {
            if (this.process)
                this.log.debug({
                    title: `Client -> Closed`
                });
            else
                this.log.error({
                    title: `Client -> Closed`
                });
        });
        client.once('end', () => {
            if (this.process)
                this.log.info({
                    title: `Client -> Ended`
                });
            else
                this.log.error({
                    title: `Client -> Ended`
                });
        });
        client.once('timeout', () => {
            this.log.warn({
                title: `Client -> Timeout`
            });
            throw new Error('Timeout');
        });
    }
    makeClient() {
        return new Promise((resolve, reject) => {
            const client = new ssh2_1.Client();
            client.on('banner', msg => console.log('banner', msg));
            client.on('greeting', msg => console.log('greeting', msg));
            this.process = client;
            this.onceEvents(client);
            this.connectionRejector = reject;
            client.once('ready', () => {
                this.log.debug({
                    title: `Client -> Ready`
                });
                this.process = client;
                this.connectionRejector = undefined;
                resolve(client);
            });
            client.connect(this.makeProps());
        });
    }
    makeOutputClean(text) {
        return text
            // .replace(/\x00/g, '')
            // .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
            .replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '')
            .trim();
    }
    resolvePendingCommands() {
        var _a;
        if (!this.startedReading) {
            const _del = '__COMMAND_START_COMPLETE__';
            const _index = this.outputBuffer.indexOf(_del);
            if (_index > -1) {
                this.outputBuffer = this.outputBuffer.substring(_index + _del.length);
                this.startedReading = true;
            }
        }
        if (!this.startedReading)
            return;
        const maxBuffer = (_a = this.props.maxBuffer) !== null && _a !== void 0 ? _a : 0;
        // Process all pending commands
        for (const [id, { resolve, reject, command, delimiter, started_at, seen }] of this.pendingCommands.entries()) {
            const delimiterIndex = this.outputBuffer.indexOf(delimiter);
            // If we found the complete delimiter
            if (delimiterIndex !== -1) {
                // Extract output up to the delimiter
                let output = this.outputBuffer.substring(0, delimiterIndex).trim();
                // Update buffer to remove processed content
                this.outputBuffer = this.outputBuffer.substring(delimiterIndex + delimiter.length);
                output = this.makeOutputClean(output);
                const ended_at = new Date();
                this.pendingCommands.delete(id);
                const resolveData = {
                    command,
                    delimiter,
                    started_at,
                    ended_at,
                    seconds: (ended_at.getTime() - started_at.getTime()) / 1000,
                    output
                };
                this.log.info({
                    title: 'Shell -> result',
                    description: [
                        `Started At: ${resolveData.started_at.getTimezoneOffset()} - ${resolveData.started_at.toISOString()}`,
                        `Ended At: ${resolveData.ended_at.getTimezoneOffset()} - ${resolveData.ended_at.toISOString()}`,
                        `Seconds: ${resolveData.seconds}`,
                        `Command : ${command}`,
                        `Output : ${resolveData.output}`,
                    ]
                });
                resolve(resolveData);
            }
            // If buffer is getting too large, consider it an error
            else if (maxBuffer > 0 && this.outputBuffer.length > maxBuffer) {
                this.pendingCommands.delete(id);
                this.log.error({
                    title: `Shell -> Buffer overflow(allowed : ${maxBuffer})`,
                    description: `Trying to allocate ${this.outputBuffer.length}`
                });
                this.outputBuffer = '';
                reject(new Error(`Buffer overflow(allowed : ${maxBuffer})`));
            }
        }
    }
    addToBuffer(data) {
        this.outputBuffer += data;
        this.resolvePendingCommands();
    }
    makeEvents() {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        (_a = this.shell) === null || _a === void 0 ? void 0 : _a.once('exit', (code, siganl) => {
            var _a;
            this === null || this === void 0 ? void 0 : this.callOnOutput(`Exited with code ${code}\n`);
            if (code)
                this.closeShellOnError(`Exited with code ${code} & signal : ${siganl}`);
            else {
                this.log.debug({
                    title: `Exited with code ${code} & signal : ${siganl}`
                });
                (_a = this.process) === null || _a === void 0 ? void 0 : _a.end();
            }
        });
        (_b = this.shell) === null || _b === void 0 ? void 0 : _b.on('close', () => {
            this.log.debug({
                title: `Shell -> close`
            });
        });
        (_c = this.shell) === null || _c === void 0 ? void 0 : _c.once('eof', () => {
            this.log.debug({
                title: `Shell -> EOF`
            });
        });
        (_d = this.shell) === null || _d === void 0 ? void 0 : _d.once('end', () => {
            this.log.debug({
                title: `Shell -> end`
            });
        });
        (_e = this.shell) === null || _e === void 0 ? void 0 : _e.once('finish', () => {
            this.log.debug({
                title: `Shell -> finish`
            });
        });
        (_f = this.shell) === null || _f === void 0 ? void 0 : _f.on('error', (error) => {
            this === null || this === void 0 ? void 0 : this.callOnOutput('Error' + error.message + '\n');
            this.log.info({
                title: `Shell -> error`,
                description: error.message
            });
        });
        (_g = this.shell) === null || _g === void 0 ? void 0 : _g.on('data', (data) => {
            const realData = this.makeOutputClean(data.toString('utf8')) + '\n';
            this === null || this === void 0 ? void 0 : this.callOnOutput(realData);
            this.log.debug({
                title: 'Shell -> data',
                description: realData,
            });
            this.addToBuffer(realData);
        });
        (_h = this.shell) === null || _h === void 0 ? void 0 : _h.stderr.on('data', (data) => {
            const realData = this.makeOutputClean(data.toString('utf8'));
            this === null || this === void 0 ? void 0 : this.callOnOutput(realData);
            this.closeShellOnError(new Error('stderr \n' + realData));
        });
    }
    async start() {
        const client = await this.makeClient();
        return new Promise((resolve, reject) => {
            var _a;
            (_a = this.process) === null || _a === void 0 ? void 0 : _a.shell({
                modes: {
                    ECHO: 0,
                    ECHONL: 1,
                    // OCRNL:1,
                }
            }, (err, stream) => {
                var _a;
                if (err)
                    reject(err);
                this.shell = stream;
                this === null || this === void 0 ? void 0 : this.callOnOutput(`echo __COMMAND_START_COMPLETE__\n`);
                (_a = this.shell) === null || _a === void 0 ? void 0 : _a.write(`echo __COMMAND_START_COMPLETE__\n`);
                this.makeEvents();
                resolve(this);
            });
        });
    }
    async execute(command) {
        if (!this.process || !this.shell || this.shell.closed)
            throw new Error('Shell session is closed');
        const id = ++this.currentId;
        const delimiter = `__COMMAND_${id}_COMPLETE__`;
        const wrappedCommand = `${command}\n echo ${delimiter}\n`;
        return new Promise((resolve, reject) => {
            var _a;
            const started_at = new Date(Date.now());
            this.pendingCommands.set(id, {
                seen: false,
                resolve, reject, command, delimiter, started_at
            });
            this === null || this === void 0 ? void 0 : this.callOnOutput(wrappedCommand);
            (_a = this.shell) === null || _a === void 0 ? void 0 : _a.write(wrappedCommand, (e) => {
                this.log.debug({
                    title: 'command started',
                    description: [
                        `Started At: ${started_at.getTimezoneOffset()} - ${started_at.toISOString()}`,
                        `Command : ${wrappedCommand}`,
                    ]
                });
                if (e)
                    this.throwError(e);
            });
        });
    }
    async exec(command) {
        return new Promise((resolve, reject) => {
            var _a, _b;
            const result = {
                started_at: new Date(Date.now()),
                ended_at: new Date(Date.now()),
                command,
                output: '',
                seconds: 0,
            };
            const sendResult = () => {
                result.ended_at = new Date;
                result.seconds = (result.ended_at.getTime() - result.started_at.getTime()) / 1000;
                if (result.error) {
                    this.log.error({
                        title: 'command result',
                        description: [
                            `Started At: ${result.started_at.getTimezoneOffset()} - ${result.started_at.toISOString()}`,
                            `Ended At: ${result.ended_at.getTimezoneOffset()} - ${result.ended_at.toISOString()}`,
                            `Seconds: ${result.seconds}`,
                            `Command : ${result.command}`,
                            `Output : ${result.output}`,
                            `Code : ${result.code}`,
                            `Signal : ${result.signal}`,
                            `Error : ${result.error}`
                        ]
                    });
                    reject(result);
                }
                else {
                    this.log.info({
                        title: 'command result',
                        description: [
                            `Started At: ${result.started_at.getTimezoneOffset()} - ${result.started_at.toISOString()}`,
                            `Ended At: ${result.ended_at.getTimezoneOffset()} - ${result.ended_at.toISOString()}`,
                            `Seconds: ${result.seconds}`,
                            `Command : ${result.command}`,
                            `Output : ${result.output}`,
                            `Code : ${result.code}`,
                            `Signal : ${result.signal}`,
                        ]
                    });
                    resolve(result);
                }
            };
            this.log.debug({
                title: 'Exec -> command started',
                description: [
                    `Started At: ${result.started_at.getTimezoneOffset()} - ${result.started_at.toISOString()}`,
                    `Command : ${command}`,
                ]
            });
            this.callOnOutput(command);
            (_a = this.process) === null || _a === void 0 ? void 0 : _a.exec(command, {
                // @ts-ignore
                maxBuffer: (_b = this.props.maxBuffer) !== null && _b !== void 0 ? _b : 1024 * 1024 * 20,
            }, (error, stream) => {
                if (error) {
                    result.error = error;
                    this === null || this === void 0 ? void 0 : this.callOnOutput('Error' + error.message + '\n');
                    sendResult();
                    return;
                }
                stream.on('close', (code, signal) => {
                    this.log.debug({
                        title: `Exec -> close code ${code} signal ${signal}`,
                    });
                    this === null || this === void 0 ? void 0 : this.callOnOutput(`Exec -> Closed with code ${code} signal${signal}\n`);
                    sendResult();
                });
                stream.on('data', (data) => {
                    const realData = this.makeOutputClean(data.toString('utf8'));
                    result.output += realData;
                    this === null || this === void 0 ? void 0 : this.callOnOutput(realData);
                    this.log.debug({
                        title: 'Exec -> data',
                        description: realData,
                    });
                });
                stream.stderr.on('data', (data) => {
                    const realData = this.makeOutputClean(data.toString('utf8'));
                    console.log('data', realData);
                    this === null || this === void 0 ? void 0 : this.callOnOutput(realData);
                    this.log.error({
                        title: 'Exec -> STDERR',
                        description: realData,
                    });
                    result.error = new Error(realData);
                    sendResult();
                });
            });
        });
    }
    async close() {
        return new Promise((resolve, reject) => {
            this.shell && this.shell.end('\nexit\n', () => {
                var _a;
                this.process && ((_a = this.process) === null || _a === void 0 ? void 0 : _a.end());
                resolve(undefined);
            });
        });
    }
}
exports.SSHRunner = SSHRunner;
