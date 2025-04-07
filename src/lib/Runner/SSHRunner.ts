import {Runner} from "./Runner";
import {ChildProcess, ExecOptions, SpawnOptions, spawnSync} from "node:child_process";
import * as child_process from "node:child_process";
import * as os from "node:os";
import {Client, ClientChannel, ConnectConfig, ShellOptions} from "ssh2";
import {str} from "ajv";

type FullCommandType = {
    seen: boolean,
    command: string,
    resolve: (data: any) => void,
    reject: (data: any) => void,
    delimiter: string,
    started_at: Date,
};
export type CommandReturnType = {
    command: string,
    delimiter: string,
    started_at: Date,
    ended_at: Date,
    seconds: number,
    output: string,
};
export type ExecCommandReturnType = {
    command: string,
    started_at: Date,
    ended_at: Date,
    seconds: number,
    output: string,
    error?: Error,
    code?: number,
    signal?: string | number,
};

export class SSHRunner extends Runner {

    protected startedReading: boolean = false;
    protected shell ?: ClientChannel;
    protected process ?: Client;
    protected outputBuffer: string = '';
    protected currentId = 0;
    protected pendingCommands: Map<number, FullCommandType> = new Map();
    protected connectionRejector?: (e: Error) => void

    protected throwError(data: string | Error) {
        throw typeof data === 'string' ? new Error(data) : data;
    }

    protected closeShellOnError(error: string | Error) {
        let description = error;
        if (description instanceof Error)
            description = (error as Error).message;
        this.log.error({
            title: `Shell -> error`,
            description: error,
        });
        this.close().then(() => this.throwError(error));
    }

    private makeProps(): ConnectConfig {
        return {
            host: this.props.host ?? '127.0.0.1',
            port: this.props.port ?? 22,
            username: this.props.username,
            password: this.props.password,
            privateKey: this.props.privateKey,
            passphrase: this.props.passphrase,
            keepaliveInterval: this.props.keepaliveInterval,
            timeout: this.props.timeout,
        };
    }

    protected onceEvents(client: Client) {
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
            })
            throw error;
        });
        client.on('close', () => {
            if (this.process)
                this.log.debug({
                    title: `Client -> Closed`
                });
            else this.log.error({
                title: `Client -> Closed`
            });
        });
        client.once('end', () => {
            if (this.process)
                this.log.info({
                    title: `Client -> Ended`
                });
            else this.log.error({
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

    protected makeClient(): Promise<Client> {
        return new Promise((resolve, reject) => {
            const client = new Client();
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

    protected makeOutputClean(text: string) {
        return text
            // .replace(/\x00/g, '')
            // .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
            .replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '')
            .trim();
    }

    protected resolvePendingCommands() {
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
        const maxBuffer = this.props.maxBuffer ?? 0;
        // Process all pending commands
        for (const [id, {resolve, reject, command, delimiter, started_at, seen}] of this.pendingCommands.entries()) {
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
                const resolveData: CommandReturnType = {
                    command,
                    delimiter,
                    started_at,
                    ended_at,
                    seconds: (ended_at.getTime() - started_at.getTime()) / 1000,
                    output
                }
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
                })
                this.outputBuffer = '';
                reject(new Error(`Buffer overflow(allowed : ${maxBuffer})`));
            }
        }
    }

    protected addToBuffer(data: string) {
        this.outputBuffer += data;
        this.resolvePendingCommands();
    }

    protected makeEvents() {

        this.shell?.once('exit', (code: any, siganl: any) => {
            this?.callOnOutput(`Exited with code ${code}\n`);
            if (code)
                this.closeShellOnError(`Exited with code ${code} & signal : ${siganl}`);
            else {
                this.log.debug({
                    title: `Exited with code ${code} & signal : ${siganl}`
                });
                this.process?.end();
            }
        });
        this.shell?.on('close', () => {
            this.log.debug({
                title: `Shell -> close`
            });
        });
        this.shell?.once('eof', () => {
            this.log.debug({
                title: `Shell -> EOF`
            });
        });
        this.shell?.once('end', () => {
            this.log.debug({
                title: `Shell -> end`
            });
        });
        this.shell?.once('finish', () => {
            this.log.debug({
                title: `Shell -> finish`
            });
        });
        this.shell?.on('error', (error: Error) => {
            this?.callOnOutput('Error' + error.message + '\n');
            this.log.info({
                title: `Shell -> error`,
                description: error.message
            });
        });
        this.shell?.on('data', (data: any) => {
            const realData = this.makeOutputClean(data.toString('utf8')) + '\n';
            this?.callOnOutput(realData);

            this.log.debug({
                title: 'Shell -> data',
                description: realData,
            });

            this.addToBuffer(realData);
        });
        this.shell?.stderr.on('data', (data: any) => {
            const realData = this.makeOutputClean(data.toString('utf8'));
            this?.callOnOutput(realData);
            this.closeShellOnError(new Error('stderr \n' + realData));
        });
    }

    public async start(): Promise<SSHRunner> {
        const client = await this.makeClient();

        return new Promise((resolve, reject) => {
            this.process?.shell({
                modes: {
                    ECHO: 0,
                    ECHONL: 1,
                    // OCRNL:1,
                }
            }, (err, stream) => {
                if (err)
                    reject(err);
                this.shell = stream;
                this?.callOnOutput(`echo __COMMAND_START_COMPLETE__\n`);
                this.shell?.write(`echo __COMMAND_START_COMPLETE__\n`);
                this.makeEvents();
                resolve(this);
            });
        })
    }

    async execute(command: string): Promise<CommandReturnType> {
        if (!this.process || !this.shell || this.shell.closed)
            throw new Error('Shell session is closed');

        const id = ++this.currentId;
        const delimiter = `__COMMAND_${id}_COMPLETE__`;
        const wrappedCommand = `${command}\n echo ${delimiter}\n`;
        return new Promise((resolve, reject) => {
            const started_at = new Date(Date.now());
            this.pendingCommands.set(id, {
                seen: false,
                resolve, reject, command, delimiter, started_at
            });
            this?.callOnOutput(wrappedCommand);
            this.shell?.write(wrappedCommand, (e) => {
                this.log.debug({
                    title: 'command started',
                    description: [
                        `Started At: ${started_at.getTimezoneOffset()} - ${started_at.toISOString()}`,
                        `Command : ${wrappedCommand}`,
                    ]
                });
                if (e)
                    this.throwError(e);
            })
        })
    }

    async exec(command: string): Promise<ExecCommandReturnType> {
        return new Promise((resolve, reject) => {
            const result: ExecCommandReturnType = {
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
                } else {
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

            this.process?.exec(command, {
                // @ts-ignore
                maxBuffer: this.props.maxBuffer ?? 1024 * 1024 * 20,

            }, (error, stream) => {
                if (error) {
                    result.error = error;
                    this?.callOnOutput('Error' + error.message + '\n');
                    sendResult();
                    return;
                }

                stream.on('close', (code: any, signal: any) => {
                    this.log.debug({
                        title: `Exec -> close code ${code} signal ${signal}`,
                    });
                    this?.callOnOutput(`Exec -> Closed with code ${code} signal${signal}\n`);
                    sendResult();
                })

                stream.on('data', (data: any) => {
                    const realData = this.makeOutputClean(data.toString('utf8'));
                    result.output += realData;
                    this?.callOnOutput(realData);
                    this.log.debug({
                        title: 'Exec -> data',
                        description: realData,
                    });
                })

                stream.stderr.on('data', (data) => {
                    const realData = this.makeOutputClean(data.toString('utf8'));
                    console.log('data',realData);
                    this?.callOnOutput(realData);
                    this.log.error({
                        title: 'Exec -> STDERR',
                        description: realData,
                    });
                    result.error = new Error(realData);
                    sendResult();
                });
            })
        });
    }

    public async close() {
        return new Promise((resolve, reject) => {
            this.shell && this.shell.end('\nexit\n', () => {
                this.process && this.process?.end();
                resolve(undefined);
            })

        });
    }
}
