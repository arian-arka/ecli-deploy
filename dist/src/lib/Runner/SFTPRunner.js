"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SFTPRunner = void 0;
const Runner_1 = require("./Runner");
const ssh2_1 = require("ssh2");
class SFTPRunner extends Runner_1.Runner {
    constructor() {
        super(...arguments);
        this.startedReading = false;
        this.outputBuffer = '';
        this.currentId = 0;
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
    makeClient() {
        return new Promise((resolve, reject) => {
            const client = new ssh2_1.Client();
            client.on('banner', msg => console.log('banner', msg));
            client.on('greeting', msg => console.log('v', msg));
            this.process = client;
            this.onceEvents(client);
            this.connectionRejector = reject;
            client.once('ready', () => {
                this.log.info({
                    title: `Ready`
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
    throwError(data) {
        this.close();
        throw typeof data === 'string' ? new Error(data) : data;
    }
    onceEvents(client) {
        client.on('close', () => {
            if (this.process)
                this.log.info({
                    title: `Closed`
                });
            else
                this.log.error({
                    title: `Closed`
                });
        });
        client.once('end', () => {
            if (this.process)
                this.log.info({
                    title: `Ended`
                });
            else
                this.log.error({
                    title: `Ended`
                });
        });
        client.once('timeout', () => {
            this.log.warn({
                title: `Timeout`
            });
            if (this.connectionRejector)
                this.connectionRejector(new Error('Timeout'));
        });
    }
    makeEvents() {
    }
    async start() {
        const client = await this.makeClient();
        return new Promise((resolve, reject) => {
            var _a;
            (_a = this.process) === null || _a === void 0 ? void 0 : _a.sftp((err, sftp) => {
                if (err)
                    reject(err);
                this.stfp = sftp;
                this.connectionRejector = reject;
                this.makeEvents();
                this.log.info({
                    title: `Ready`
                });
                resolve(this);
            });
        });
    }
    async execute() {
        return undefined;
    }
    close() {
        var _a;
        this.stfp && this.stfp.end();
        (_a = this.process) === null || _a === void 0 ? void 0 : _a.end();
    }
    logResult(result) {
        if (result.error)
            this.log.error({
                title: result.command,
                description: [
                    `Started At: ${result.started_at.getTimezoneOffset()} - ${result.started_at.toISOString()}`,
                    `Ended At: ${result.ended_at.getTimezoneOffset()} - ${result.ended_at.toISOString()}`,
                    `Seconds: ${result.seconds}`,
                    `Error : ${result.error.message}`,
                    `Stack : ${result.error.stack}`,
                    `Name : ${result.error.name}`,
                ]
            });
        else
            this.log.info({
                title: result.command,
                description: [
                    `Started At: ${result.started_at.getTimezoneOffset()} - ${result.started_at.toISOString()}`,
                    `Ended At: ${result.ended_at.getTimezoneOffset()} - ${result.ended_at.toISOString()}`,
                    `Seconds: ${result.seconds}`,
                    `Output : ${JSON.stringify(result.output, null, 2)}`,
                ]
            });
    }
    getFile(remotePath, localPath) {
        return new Promise((resolve, reject) => {
            var _a;
            const started_at = new Date();
            (_a = this.stfp) === null || _a === void 0 ? void 0 : _a.fastGet(remotePath, localPath, (error) => {
                const ended_at = new Date();
                const result = {
                    command: `Get File "${remotePath}" -> "${localPath}"`,
                    started_at,
                    ended_at,
                    seconds: (ended_at.getTime() - started_at.getTime()) / 1000,
                    output: '',
                    error: error !== null && error !== void 0 ? error : undefined
                };
                this.logResult(result);
                error ? reject(error) : resolve(result);
            });
        });
    }
    putFile(localPath, remotePath) {
        return new Promise((resolve, reject) => {
            var _a;
            const started_at = new Date();
            (_a = this.stfp) === null || _a === void 0 ? void 0 : _a.fastPut(localPath, remotePath, (error) => {
                const ended_at = new Date();
                const result = {
                    command: `Put File "${localPath}" -> "${remotePath}"`,
                    started_at,
                    ended_at,
                    seconds: (ended_at.getTime() - started_at.getTime()) / 1000,
                    output: '',
                    error: error !== null && error !== void 0 ? error : undefined
                };
                this.logResult(result);
                error ? reject(error) : resolve(result);
            });
        });
    }
    readFile(remotePath) {
        return new Promise((resolve, reject) => {
            var _a;
            const started_at = new Date();
            (_a = this.stfp) === null || _a === void 0 ? void 0 : _a.readFile(remotePath, {
                encoding: 'utf-8',
            }, (error, handle) => {
                const ended_at = new Date();
                const result = {
                    command: `Read File "${remotePath}" `,
                    started_at,
                    ended_at,
                    seconds: (ended_at.getTime() - started_at.getTime()) / 1000,
                    output: handle.toString('utf8'),
                    error: error !== null && error !== void 0 ? error : undefined
                };
                this.logResult(result);
                error ? reject(error) : resolve(result);
            });
        });
    }
    writeFile(remotePath, data) {
        return new Promise((resolve, reject) => {
            var _a;
            const started_at = new Date();
            (_a = this.stfp) === null || _a === void 0 ? void 0 : _a.writeFile(remotePath, data, {
                encoding: 'utf-8',
            }, (error) => {
                const ended_at = new Date();
                const result = {
                    command: `Write File "${remotePath}" `,
                    started_at,
                    ended_at,
                    seconds: (ended_at.getTime() - started_at.getTime()) / 1000,
                    output: '',
                    error: error !== null && error !== void 0 ? error : undefined
                };
                this.logResult(result);
                error ? reject(error) : resolve(result);
            });
        });
    }
    appendFile(remotePath, data) {
        return new Promise((resolve, reject) => {
            var _a;
            const started_at = new Date();
            (_a = this.stfp) === null || _a === void 0 ? void 0 : _a.appendFile(remotePath, data, (error) => {
                const ended_at = new Date();
                const result = {
                    command: `Append File "${remotePath}" `,
                    started_at,
                    ended_at,
                    seconds: (ended_at.getTime() - started_at.getTime()) / 1000,
                    output: '',
                    error: error !== null && error !== void 0 ? error : undefined
                };
                this.logResult(result);
                error ? reject(error) : resolve(result);
            });
        });
    }
    opendir(path) {
        return new Promise((resolve, reject) => {
            var _a;
            const started_at = new Date();
            (_a = this.stfp) === null || _a === void 0 ? void 0 : _a.opendir(path, (error, handle) => {
                const ended_at = new Date();
                const result = {
                    command: `Open Dir "${path}" `,
                    started_at,
                    ended_at,
                    seconds: (ended_at.getTime() - started_at.getTime()) / 1000,
                    output: handle.toString('utf8'),
                    error: error !== null && error !== void 0 ? error : undefined
                };
                this.logResult(result);
                error ? reject(error) : resolve(result);
            });
        });
    }
    readdir(path) {
        return new Promise((resolve, reject) => {
            var _a;
            const started_at = new Date();
            (_a = this.stfp) === null || _a === void 0 ? void 0 : _a.readdir(path, (error, list) => {
                const ended_at = new Date();
                const result = {
                    command: `Read Dir "${path}" `,
                    started_at,
                    ended_at,
                    seconds: (ended_at.getTime() - started_at.getTime()) / 1000,
                    output: list,
                    error: error !== null && error !== void 0 ? error : undefined
                };
                this.logResult(result);
                error ? reject(error) : resolve(result);
            });
        });
    }
    unlink(path) {
        return new Promise((resolve, reject) => {
            var _a;
            const started_at = new Date();
            (_a = this.stfp) === null || _a === void 0 ? void 0 : _a.unlink(path, (error) => {
                const ended_at = new Date();
                const result = {
                    command: `Unlink "${path}" `,
                    started_at,
                    ended_at,
                    seconds: (ended_at.getTime() - started_at.getTime()) / 1000,
                    output: '',
                    error: error !== null && error !== void 0 ? error : undefined
                };
                this.logResult(result);
                error ? reject(error) : resolve(result);
            });
        });
    }
    rename(src, dst) {
        return new Promise((resolve, reject) => {
            var _a;
            const started_at = new Date();
            (_a = this.stfp) === null || _a === void 0 ? void 0 : _a.rename(src, dst, (error) => {
                const ended_at = new Date();
                const result = {
                    command: `Rename "${src}" -> "${dst}"`,
                    started_at,
                    ended_at,
                    seconds: (ended_at.getTime() - started_at.getTime()) / 1000,
                    output: '',
                    error: error !== null && error !== void 0 ? error : undefined
                };
                this.logResult(result);
                error ? reject(error) : resolve(result);
            });
        });
    }
    mkdir(path) {
        return new Promise((resolve, reject) => {
            var _a;
            const started_at = new Date();
            (_a = this.stfp) === null || _a === void 0 ? void 0 : _a.mkdir(path, (error) => {
                const ended_at = new Date();
                const result = {
                    command: `Mkdir "${path}"`,
                    started_at,
                    ended_at,
                    seconds: (ended_at.getTime() - started_at.getTime()) / 1000,
                    output: '',
                    error: error !== null && error !== void 0 ? error : undefined
                };
                this.logResult(result);
                error ? reject(error) : resolve(result);
            });
        });
    }
    rmdir(path) {
        return new Promise((resolve, reject) => {
            var _a;
            const started_at = new Date();
            (_a = this.stfp) === null || _a === void 0 ? void 0 : _a.rmdir(path, (error) => {
                const ended_at = new Date();
                const result = {
                    command: `Rmdir "${path}"`,
                    started_at,
                    ended_at,
                    seconds: (ended_at.getTime() - started_at.getTime()) / 1000,
                    output: '',
                    error: error !== null && error !== void 0 ? error : undefined
                };
                this.logResult(result);
                error ? reject(error) : resolve(result);
            });
        });
    }
    stat(path) {
        return new Promise((resolve, reject) => {
            var _a;
            const started_at = new Date();
            (_a = this.stfp) === null || _a === void 0 ? void 0 : _a.stat(path, (error, stats) => {
                const ended_at = new Date();
                const result = {
                    command: `Stat "${path}"`,
                    started_at,
                    ended_at,
                    seconds: (ended_at.getTime() - started_at.getTime()) / 1000,
                    output: {
                        isDirectory: stats.isDirectory(),
                        isFile: stats.isDirectory(),
                        isCharacterDevice: stats.isCharacterDevice(),
                        isBlockDevice: stats.isBlockDevice(),
                        isSymbolicLink: stats.isSymbolicLink(),
                        isFIFO: stats.isFIFO(),
                        isSocket: stats.isSocket(),
                        uid: stats.uid,
                        gid: stats.gid,
                        size: stats.size,
                        mode: stats.mode,
                        mtime: stats.mtime,
                        atime: stats.atime,
                    },
                    error: error !== null && error !== void 0 ? error : undefined
                };
                this.logResult(result);
                error ? reject(error) : resolve(result);
            });
        });
    }
    exists(path) {
        return new Promise((resolve, reject) => {
            var _a;
            const started_at = new Date();
            (_a = this.stfp) === null || _a === void 0 ? void 0 : _a.exists(path, (hasError) => {
                const ended_at = new Date();
                const result = {
                    command: `Exists "${path}" `,
                    started_at,
                    ended_at,
                    seconds: (ended_at.getTime() - started_at.getTime()) / 1000,
                    output: !hasError,
                    error: undefined
                };
                this.logResult(result);
                resolve(result);
            });
        });
    }
    chown(path, uid, gid) {
        return new Promise((resolve, reject) => {
            var _a;
            const started_at = new Date();
            (_a = this.stfp) === null || _a === void 0 ? void 0 : _a.chown(path, uid, gid, (error) => {
                const ended_at = new Date();
                const result = {
                    command: `chown "${path}" - uid:${uid} - gid:${gid}`,
                    started_at,
                    ended_at,
                    seconds: (ended_at.getTime() - started_at.getTime()) / 1000,
                    output: '',
                    error: error !== null && error !== void 0 ? error : undefined
                };
                this.logResult(result);
                error ? reject(error) : resolve(result);
            });
        });
    }
    chmod(path, mode) {
        return new Promise((resolve, reject) => {
            var _a;
            const started_at = new Date();
            (_a = this.stfp) === null || _a === void 0 ? void 0 : _a.chmod(path, mode, (error) => {
                const ended_at = new Date();
                const result = {
                    command: `chmod "${path}" - mode:${mode}`,
                    started_at,
                    ended_at,
                    seconds: (ended_at.getTime() - started_at.getTime()) / 1000,
                    output: '',
                    error: error !== null && error !== void 0 ? error : undefined
                };
                this.logResult(result);
                error ? reject(error) : resolve(result);
            });
        });
    }
    realpath(path) {
        return new Promise((resolve, reject) => {
            var _a;
            const started_at = new Date();
            (_a = this.stfp) === null || _a === void 0 ? void 0 : _a.realpath(path, (error, absPath) => {
                const ended_at = new Date();
                const result = {
                    command: `realpath "${path}" `,
                    started_at,
                    ended_at,
                    seconds: (ended_at.getTime() - started_at.getTime()) / 1000,
                    output: absPath,
                    error: error
                };
                this.logResult(result);
                error ? reject(error) : resolve(result);
            });
        });
    }
}
exports.SFTPRunner = SFTPRunner;
