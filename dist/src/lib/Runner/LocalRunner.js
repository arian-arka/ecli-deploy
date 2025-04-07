"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalRunner = void 0;
const Runner_1 = require("./Runner");
const child_process = __importStar(require("node:child_process"));
class LocalRunner extends Runner_1.Runner {
    constructor() {
        super(...arguments);
        this.outputBuffer = '';
        this.currentId = 0;
        this.pendingCommands = new Map();
    }
    makeSpawn() {
        var _a, _b;
        const options = {
            shell: true,
            stdio: ['pipe', 'pipe', 'pipe'],
            cwd: (_a = this.props.cwd) !== null && _a !== void 0 ? _a : process.cwd(),
            timeout: (_b = this.props.timeout) !== null && _b !== void 0 ? _b : 1000 * 60 * 3, //3 minutes
        };
        const startCommand = process.platform === 'win32' ? 'wsl' : '/bin/bash';
        const startOptions = ["~", "-e", "sh", "-i"];
        return child_process.spawn(startCommand, [], 
        //startOptions,
        options);
    }
    getState() {
        var _a;
        return {
            isRunning: this.process && this.process.exitCode === null,
            currentCommand: (_a = this.current) === null || _a === void 0 ? void 0 : _a.command,
            pid: this.process ? this.process.pid : null,
            bufferLength: this.outputBuffer.length
        };
    }
    makeOutputClean(text) {
        return text
            .replace(/\x00/g, '')
            .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
            .trim();
    }
    resolvePendingCommands() {
        var _a;
        const maxBuffer = (_a = this.props.maxBuffer) !== null && _a !== void 0 ? _a : 0;
        // Process all pending commands
        for (const [id, { resolve, reject, command, delimiter, started_at }] of this.pendingCommands.entries()) {
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
                    title: 'command result',
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
                    title: `Buffer overflow(allowed : ${maxBuffer})`,
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
    throwError(data) {
        this.close();
        throw typeof data === 'string' ? new Error(data) : data;
    }
    onceEvents() {
        var _a, _b, _c, _d, _e;
        (_a = this.process) === null || _a === void 0 ? void 0 : _a.once('exit', (code, signal) => {
            if (code) {
                this.log.error({
                    title: `Exited with code ${code} & signal ${signal !== null && signal !== void 0 ? signal : 'null'}`
                });
                this.throwError(`Exited with code ${code}`);
            }
            else
                this.log.info({
                    title: `Exited with code ${code}`
                });
        });
        (_b = this.process) === null || _b === void 0 ? void 0 : _b.once('close', (code, signal) => {
            if (code) {
                this.log.error({
                    title: `Closed with code ${code} & signal ${signal !== null && signal !== void 0 ? signal : 'null'}`
                });
                this.throwError(`Closed with code ${code}`);
            }
            else
                this.log.info({
                    title: `Closed with code ${code}`
                });
        });
        (_c = this.process) === null || _c === void 0 ? void 0 : _c.once('error', error => {
            this.log.error({
                title: `error[${error.name}] : ${error.message}`,
                description: error.stack
            });
            this.throwError(error);
        });
        (_d = this.process) === null || _d === void 0 ? void 0 : _d.once('disconnect', () => {
            this.log.info({
                title: `Disconnected`
            });
        });
        (_e = this.process) === null || _e === void 0 ? void 0 : _e.once('spawn', () => {
            this.log.info({
                title: `Spawn`
            });
        });
    }
    makeEvents() {
        var _a, _b, _c, _d;
        (_b = (_a = this.process) === null || _a === void 0 ? void 0 : _a.stdout) === null || _b === void 0 ? void 0 : _b.on('data', data => {
            const realData = this.makeOutputClean(data.toString('utf8'));
            this.log.debug({
                title: 'STDOUT:data',
                description: realData,
            });
            this.addToBuffer(realData);
        });
        (_d = (_c = this.process) === null || _c === void 0 ? void 0 : _c.stderr) === null || _d === void 0 ? void 0 : _d.on('data', data => {
            const realData = this.makeOutputClean(data.toString('utf8'));
            this.log.error({
                title: 'STDERR:data',
                description: realData,
            });
            if (realData === 'wsl: A localhost proxy configuration was detected but not mirrored into WSL. WSL in NAT mode does not support localhost proxies.')
                return;
            this.throwError(realData);
        });
    }
    start() {
        this.process = this.makeSpawn();
        this.onceEvents();
        this.makeEvents();
        return this;
    }
    async execute(command) {
        if (!this.process || this.process.exitCode !== null)
            throw new Error('Shell session is closed');
        const id = ++this.currentId;
        const delimiter = `__COMMAND_${id}_COMPLETE__`;
        const wrappedCommand = `${command}\n echo ${delimiter}\n`;
        return new Promise((resolve, reject) => {
            var _a, _b;
            const started_at = new Date(Date.now());
            this.pendingCommands.set(id, {
                resolve, reject, command, delimiter, started_at
            });
            (_b = (_a = this.process) === null || _a === void 0 ? void 0 : _a.stdin) === null || _b === void 0 ? void 0 : _b.write(wrappedCommand, (e) => {
                if (e)
                    this.throwError(e);
                this.log.debug({
                    title: 'command started',
                    description: [
                        `Started At: ${started_at.getTimezoneOffset()} - ${started_at.toISOString()}`,
                        `Command : ${wrappedCommand}`,
                    ]
                });
            });
        });
    }
    close() {
        var _a, _b, _c;
        if (this.process && ((_a = this.process) === null || _a === void 0 ? void 0 : _a.exitCode) === null) {
            (_c = (_b = this.process) === null || _b === void 0 ? void 0 : _b.stdin) === null || _c === void 0 ? void 0 : _c.end();
            this.process.kill();
        }
    }
}
exports.LocalRunner = LocalRunner;
