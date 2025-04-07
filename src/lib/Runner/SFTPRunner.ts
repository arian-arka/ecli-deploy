import {Runner} from "./Runner";
import {ChildProcess, ExecOptions, SpawnOptions, spawnSync} from "node:child_process";
import * as child_process from "node:child_process";
import * as os from "node:os";
import {Client, ClientChannel, ConnectConfig, FileEntryWithStats, SFTPWrapper, ShellOptions, Stats} from "ssh2";
import {str} from "ajv";
import {args, command} from "ecli-base/dist/src/lib/command/Args";


type CommandReturnType<T = string> = {
    command: string,
    started_at: Date,
    ended_at: Date,
    seconds: number,
    output: T,
    error?: Error
};


export class SFTPRunner extends Runner {

    protected startedReading: boolean = false;
    protected stfp ?: SFTPWrapper;
    protected process ?: Client;
    protected outputBuffer: string = '';
    protected currentId = 0;
    protected connectionRejector?: (e: Error) => void

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

    protected makeClient(): Promise<Client> {
        return new Promise((resolve, reject) => {
            const client = new Client();
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

    private makeOutputClean(text: string) {
        return text
            // .replace(/\x00/g, '')
            // .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
            .replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '')
            .trim();
    }

    protected throwError(data: string | Error) {
        this.close();
        throw typeof data === 'string' ? new Error(data) : data;
    }

    protected onceEvents(client: Client) {
        client.on('close', () => {
            if (this.process)
                this.log.info({
                    title: `Closed`
                });
            else this.log.error({
                title: `Closed`
            });
        });
        client.once('end', () => {
            if (this.process)
                this.log.info({
                    title: `Ended`
                });
            else this.log.error({
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

    protected makeEvents() {

    }

    public async start(): Promise<SFTPRunner> {
        const client = await this.makeClient();

        return new Promise((resolve, reject) => {
            this.process?.sftp((err, sftp) => {
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
        })
    }

    async execute(): Promise<any> {
        return undefined;
    }

    public close() {
        this.stfp && this.stfp.end();
        this.process?.end();
    }

    private logResult(result: CommandReturnType<any>) {
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

    getFile(remotePath: string, localPath: string): Promise<CommandReturnType> {
        return new Promise((resolve, reject) => {
            const started_at = new Date();
            this.stfp?.fastGet(remotePath, localPath, (error) => {
                const ended_at = new Date();
                const result: CommandReturnType = {
                    command: `Get File "${remotePath}" -> "${localPath}"`,
                    started_at,
                    ended_at,
                    seconds: (ended_at.getTime() - started_at.getTime()) / 1000,
                    output: '',
                    error: error ?? undefined
                };
                this.logResult(result);
                error ? reject(error) : resolve(result);
            })
        })
    }

    putFile( localPath: string,remotePath: string,): Promise<CommandReturnType> {
        return new Promise((resolve, reject) => {
            const started_at = new Date();
            this.stfp?.fastPut(localPath, remotePath, (error) => {
                const ended_at = new Date();
                const result: CommandReturnType = {
                    command: `Put File "${localPath}" -> "${remotePath}"`,
                    started_at,
                    ended_at,
                    seconds: (ended_at.getTime() - started_at.getTime()) / 1000,
                    output: '',
                    error: error ?? undefined
                };
                this.logResult(result);
                error ? reject(error) : resolve(result);
            })
        })
    }

    readFile(remotePath: string): Promise<CommandReturnType> {
        return new Promise((resolve, reject) => {
            const started_at = new Date();
            this.stfp?.readFile(remotePath, {
                encoding: 'utf-8',
            }, (error, handle) => {
                const ended_at = new Date();
                const result: CommandReturnType = {
                    command: `Read File "${remotePath}" `,
                    started_at,
                    ended_at,
                    seconds: (ended_at.getTime() - started_at.getTime()) / 1000,
                    output: handle.toString('utf8'),
                    error: error ?? undefined
                };
                this.logResult(result);
                error ? reject(error) : resolve(result);
            })
        })
    }

    writeFile(remotePath: string, data: string | Buffer): Promise<CommandReturnType> {
        return new Promise((resolve, reject) => {
            const started_at = new Date();
            this.stfp?.writeFile(remotePath, data, {
                encoding: 'utf-8',
            }, (error) => {
                const ended_at = new Date();
                const result: CommandReturnType = {
                    command: `Write File "${remotePath}" `,
                    started_at,
                    ended_at,
                    seconds: (ended_at.getTime() - started_at.getTime()) / 1000,
                    output: '',
                    error: error ?? undefined
                };
                this.logResult(result);
                error ? reject(error) : resolve(result);
            })
        })
    }

    appendFile(remotePath: string, data: string | Buffer): Promise<CommandReturnType> {
        return new Promise((resolve, reject) => {
            const started_at = new Date();
            this.stfp?.appendFile(remotePath, data, (error) => {
                const ended_at = new Date();
                const result: CommandReturnType = {
                    command: `Append File "${remotePath}" `,
                    started_at,
                    ended_at,
                    seconds: (ended_at.getTime() - started_at.getTime()) / 1000,
                    output: '',
                    error: error ?? undefined
                };
                this.logResult(result);
                error ? reject(error) : resolve(result);
            })
        })
    }

    opendir(path: string): Promise<CommandReturnType> {
        return new Promise((resolve, reject) => {
            const started_at = new Date();
            this.stfp?.opendir(path, (error, handle) => {
                const ended_at = new Date();
                const result: CommandReturnType = {
                    command: `Open Dir "${path}" `,
                    started_at,
                    ended_at,
                    seconds: (ended_at.getTime() - started_at.getTime()) / 1000,
                    output: handle.toString('utf8'),
                    error: error ?? undefined
                };
                this.logResult(result);
                error ? reject(error) : resolve(result);
            })
        })
    }

    readdir(path: string): Promise<CommandReturnType<FileEntryWithStats[]>> {
        return new Promise((resolve, reject) => {
            const started_at = new Date();
            this.stfp?.readdir(path, (error, list) => {
                const ended_at = new Date();
                const result: CommandReturnType<FileEntryWithStats[]> = {
                    command: `Read Dir "${path}" `,
                    started_at,
                    ended_at,
                    seconds: (ended_at.getTime() - started_at.getTime()) / 1000,
                    output: list,
                    error: error ?? undefined
                };
                this.logResult(result);
                error ? reject(error) : resolve(result);
            })
        })
    }

    unlink(path: string): Promise<CommandReturnType> {
        return new Promise((resolve, reject) => {
            const started_at = new Date();
            this.stfp?.unlink(path, (error) => {
                const ended_at = new Date();
                const result: CommandReturnType = {
                    command: `Unlink "${path}" `,
                    started_at,
                    ended_at,
                    seconds: (ended_at.getTime() - started_at.getTime()) / 1000,
                    output: '',
                    error: error ?? undefined
                };
                this.logResult(result);
                error ? reject(error) : resolve(result);
            })
        })
    }

    rename(src: string, dst: string): Promise<CommandReturnType> {
        return new Promise((resolve, reject) => {
            const started_at = new Date();
            this.stfp?.rename(src, dst, (error) => {
                const ended_at = new Date();
                const result: CommandReturnType = {
                    command: `Rename "${src}" -> "${dst}"`,
                    started_at,
                    ended_at,
                    seconds: (ended_at.getTime() - started_at.getTime()) / 1000,
                    output: '',
                    error: error ?? undefined
                };
                this.logResult(result);
                error ? reject(error) : resolve(result);
            })
        })
    }

    mkdir(path: string): Promise<CommandReturnType> {
        return new Promise((resolve, reject) => {
            const started_at = new Date();
            this.stfp?.mkdir(path, (error) => {
                const ended_at = new Date();
                const result: CommandReturnType = {
                    command: `Mkdir "${path}"`,
                    started_at,
                    ended_at,
                    seconds: (ended_at.getTime() - started_at.getTime()) / 1000,
                    output: '',
                    error: error ?? undefined
                };
                this.logResult(result);
                error ? reject(error) : resolve(result);
            })
        })
    }

    rmdir(path: string): Promise<CommandReturnType> {
        return new Promise((resolve, reject) => {
            const started_at = new Date();
            this.stfp?.rmdir(path, (error) => {
                const ended_at = new Date();
                const result: CommandReturnType = {
                    command: `Rmdir "${path}"`,
                    started_at,
                    ended_at,
                    seconds: (ended_at.getTime() - started_at.getTime()) / 1000,
                    output: '',
                    error: error ?? undefined
                };
                this.logResult(result);
                error ? reject(error) : resolve(result);
            })
        })
    }

    stat(path: string): Promise<CommandReturnType<{
        isDirectory: boolean,
        isFile: boolean,
        isCharacterDevice: boolean,
        isBlockDevice: boolean,
        isSymbolicLink: boolean,
        isFIFO: boolean,
        isSocket: boolean,
        gid: number,
        size: number,
        uid: number,
        mode: number,
        mtime: number,
        atime: number,
    }>> {
        return new Promise((resolve, reject) => {
            const started_at = new Date();
            this.stfp?.stat(path, (error, stats) => {
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
                    error: error ?? undefined
                };
                this.logResult(result);
                error ? reject(error) : resolve(result);
            })
        })
    }

    exists(path: string): Promise<CommandReturnType<boolean>> {
        return new Promise((resolve, reject) => {
            const started_at = new Date();
            this.stfp?.exists(path, (hasError,) => {
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
            })
        })
    }

    chown(path: string, uid: number, gid: number,): Promise<CommandReturnType> {
        return new Promise((resolve, reject) => {
            const started_at = new Date();
            this.stfp?.chown(path, uid, gid, (error) => {
                const ended_at = new Date();
                const result: CommandReturnType = {
                    command: `chown "${path}" - uid:${uid} - gid:${gid}`,
                    started_at,
                    ended_at,
                    seconds: (ended_at.getTime() - started_at.getTime()) / 1000,
                    output: '',
                    error: error ?? undefined
                };
                this.logResult(result);
                error ? reject(error) : resolve(result);
            })
        })
    }

    chmod(path: string, mode: number | string): Promise<CommandReturnType> {
        return new Promise((resolve, reject) => {
            const started_at = new Date();
            this.stfp?.chmod(path, mode, (error) => {
                const ended_at = new Date();
                const result: CommandReturnType = {
                    command: `chmod "${path}" - mode:${mode}`,
                    started_at,
                    ended_at,
                    seconds: (ended_at.getTime() - started_at.getTime()) / 1000,
                    output: '',
                    error: error ?? undefined
                };
                this.logResult(result);
                error ? reject(error) : resolve(result);
            })
        })
    }

    realpath(path: string): Promise<CommandReturnType> {
        return new Promise((resolve, reject) => {
            const started_at = new Date();
            this.stfp?.realpath(path, (error, absPath) => {
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
            })
        })
    }
}
