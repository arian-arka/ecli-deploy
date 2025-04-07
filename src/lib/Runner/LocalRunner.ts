import {Runner} from "./Runner";
import {ChildProcess, ExecOptions, SpawnOptions, spawnSync} from "node:child_process";
import * as child_process from "node:child_process";
import * as os from "node:os";

type FullCommandType = {
    command: string,
    resolve: (data: any) => void,
    reject: (data: any) => void,
    delimiter: string,
    started_at: Date,
};
type CommandReturnType = {
    command: string,
    delimiter: string,
    started_at: Date,
    ended_at: Date,
    seconds : number,
    output: string,
};

export class LocalRunner extends Runner {
    protected process ?: ChildProcess;
    protected current ?: {
        command: string,
        resolve: (data: any) => void,
        reject: (data: any) => void,
        delimiter: string
    };
    protected outputBuffer: string = '';
    protected currentId = 0;
    protected pendingCommands: Map<number, FullCommandType> = new Map();

    protected makeSpawn() {
        const options: SpawnOptions = {
            shell: true,
            stdio: ['pipe', 'pipe', 'pipe'],
            cwd: this.props.cwd ?? process.cwd(),
            timeout: this.props.timeout ?? 1000 * 60 * 3, //3 minutes
        };
        const startCommand = process.platform === 'win32' ? 'wsl' : '/bin/bash';
        const startOptions = ["~", "-e", "sh", "-i"];
        return child_process.spawn(
            startCommand,
            [],
            //startOptions,
            options
        )
    }

    public getState() {
        return {
            isRunning: this.process && this.process.exitCode === null,
            currentCommand: this.current?.command,
            pid: this.process ? this.process.pid : null,
            bufferLength: this.outputBuffer.length
        };
    }

    private makeOutputClean(text: string) {
        return text
            .replace(/\x00/g, '')
            .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
            .trim();
    }

    private resolvePendingCommands() {
        const maxBuffer = this.props.maxBuffer ?? 0;
        // Process all pending commands
        for (const [id, {resolve,reject, command, delimiter, started_at}] of this.pendingCommands.entries()) {
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
                const resolveData : CommandReturnType = {
                    command,
                    delimiter,
                    started_at,
                    ended_at,
                    seconds : (ended_at.getTime() - started_at.getTime()) / 1000,
                    output
                }
                this.log.info({
                    title: 'command result',
                    description: [
                        `Started At: ${resolveData.started_at.getTimezoneOffset()} - ${resolveData.started_at.toISOString()}`,
                        `Ended At: ${resolveData.ended_at.getTimezoneOffset()} - ${resolveData.ended_at.toISOString()}`,
                        `Seconds: ${resolveData.seconds}`,
                        `Command : ${command}`,
                        `Output : ${resolveData.output}`,
                    ]
                })
                resolve(resolveData);
            }
            // If buffer is getting too large, consider it an error
            else if (maxBuffer > 0 && this.outputBuffer.length > maxBuffer) {
                this.pendingCommands.delete(id);
                this.log.error({
                    title : `Buffer overflow(allowed : ${maxBuffer})`,
                    description : `Trying to allocate ${this.outputBuffer.length}`
                })
                this.outputBuffer = '';
                reject(new Error(`Buffer overflow(allowed : ${maxBuffer})`));
            }
        }
    }

    private addToBuffer(data: string) {
        this.outputBuffer += data;
        this.resolvePendingCommands();
    }

    protected throwError(data: string | Error) {
        this.close();
        throw typeof data === 'string' ? new Error(data) : data;
    }

    protected onceEvents() {
        this.process?.once('exit', (code, signal) => {
            if (code) {
                this.log.error({
                    title: `Exited with code ${code} & signal ${signal ?? 'null'}`
                });
                this.throwError(`Exited with code ${code}`);
            } else
                this.log.info({
                    title: `Exited with code ${code}`
                });

        });
        this.process?.once('close', (code, signal) => {
            if (code) {
                this.log.error({
                    title: `Closed with code ${code} & signal ${signal ?? 'null'}`
                });
                this.throwError(`Closed with code ${code}`);
            } else
                this.log.info({
                    title: `Closed with code ${code}`
                });
        });
        this.process?.once('error', error => {
            this.log.error({
                title: `error[${error.name}] : ${error.message}`,
                description: error.stack
            })
            this.throwError(error);
        });

        this.process?.once('disconnect', () => {
            this.log.info({
                title: `Disconnected`
            });
        });
        this.process?.once('spawn', () => {
            this.log.info({
                title: `Spawn`
            });
        });
    }

    protected makeEvents() {
        this.process?.stdout?.on('data', data => {
            const realData = this.makeOutputClean(data.toString('utf8'));
            this.log.debug({
                title: 'STDOUT:data',
                description: realData,
            });
            this.addToBuffer(realData);
        });

        this.process?.stderr?.on('data', data => {
            const realData = this.makeOutputClean(data.toString('utf8'));
            this.log.error({
                title: 'STDERR:data',
                description: realData,
            });
            if(realData === 'wsl: A localhost proxy configuration was detected but not mirrored into WSL. WSL in NAT mode does not support localhost proxies.')
                return;
            this.throwError(realData);
        });
    }

    public start() {
        this.process = this.makeSpawn();
        this.onceEvents();
        this.makeEvents();
        return this;
    }

    async execute(command: string): Promise<CommandReturnType> {
        if (!this.process || this.process.exitCode !== null)
            throw new Error('Shell session is closed');

        const id = ++this.currentId;
        const delimiter = `__COMMAND_${id}_COMPLETE__`;
        const wrappedCommand = `${command}\n echo ${delimiter}\n`;
        return new Promise((resolve, reject) => {
            const started_at = new Date(Date.now());
            this.pendingCommands.set(id, {
                resolve, reject, command, delimiter, started_at
            });
            this.process?.stdin?.write(wrappedCommand, (e) => {
                if (e)
                    this.throwError(e);
                this.log.debug({
                    title: 'command started',
                    description: [
                        `Started At: ${started_at.getTimezoneOffset()} - ${started_at.toISOString()}`,
                        `Command : ${wrappedCommand}`,
                    ]
                });
            })
        })
    }

    public close() {
        if (this.process && this.process?.exitCode === null) {
            this.process?.stdin?.end();
            this.process.kill();
        }
    }
}
