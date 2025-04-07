"use strict";
// import {Runner} from "./Runner";
// import {ChildProcess, ExecOptions, SpawnOptions, spawnSync} from "node:child_process";
// import * as child_process from "node:child_process";
// import * as os from "node:os";
// import {Client, ClientChannel, ConnectConfig, ShellOptions} from "ssh2";
// import {str} from "ajv";
//
// type FullCommandType = {
//     seen: boolean,
//     command: string,
//     resolve: (data: any) => void,
//     reject: (data: any) => void,
//     delimiter: string,
//     started_at: Date,
// };
// export type CommandReturnType = {
//     command: string,
//     delimiter: string,
//     started_at: Date,
//     ended_at: Date,
//     seconds: number,
//     output: string,
// };
// import {stripVTControlCharacters} from "node:util";
//
// export class SSHRunner extends Runner {
//
//     protected startedReading: boolean = false;
//     protected shell ?: ClientChannel;
//     protected process ?: Client;
//     protected current ?: {
//         command: string,
//         resolve: (data: any) => void,
//         reject: (data: any) => void,
//         delimiter: string
//     };
//     protected outputBuffer: string = '';
//     protected currentId = 0;
//     protected pendingCommands: Map<number, FullCommandType> = new Map();
//     protected connectionRejector?: (e: Error) => void
//
//     private makeProps(): ConnectConfig {
//         return {
//             host: this.props.host ?? '127.0.0.1',
//             port: this.props.port ?? 22,
//             username: this.props.username,
//             password: this.props.password,
//             privateKey: this.props.privateKey,
//             passphrase: this.props.passphrase,
//             keepaliveInterval: this.props.keepaliveInterval,
//             timeout: this.props.timeout,
//         };
//     }
//
//     protected makeClient(): Promise<Client> {
//         return new Promise((resolve, reject) => {
//             const client = new Client();
//             client.on('banner', msg => console.log('banner', msg));
//             client.on('greeting', msg => console.log('greeting', msg));
//             this.process = client;
//             this.onceEvents(client);
//             this.connectionRejector = reject;
//             client.once('ready', () => {
//                 this.log.info({
//                     title: `Ready`
//                 });
//                 this.process = client;
//                 this.connectionRejector = undefined;
//                 resolve(client);
//             });
//
//             client.connect(this.makeProps());
//         });
//     }
//
//     private makeOutputClean(text: string) {
//         return text
//             // .replace(/\x00/g, '')
//             // .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
//             .replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '')
//             .trim();
//     }
//
//     private resolvePendingCommands() {
//         if (!this.startedReading) {
//             const _del = '__COMMAND_START_COMPLETE__';
//             const _index = this.outputBuffer.indexOf(_del);
//             if (_index > -1) {
//                 this.outputBuffer = this.outputBuffer.substring(_index + _del.length);
//                 this.startedReading = true;
//             }
//         }
//         if (!this.startedReading)
//             return;
//         const maxBuffer = this.props.maxBuffer ?? 0;
//         // Process all pending commands
//         for (const [id, {resolve, reject, command, delimiter, started_at, seen}] of this.pendingCommands.entries()) {
//             const delimiterIndex = this.outputBuffer.indexOf(delimiter);
//
//             // If we found the complete delimiter
//             if (delimiterIndex !== -1) {
//                 // Extract output up to the delimiter
//                 let output = this.outputBuffer.substring(0, delimiterIndex).trim();
//                 // Update buffer to remove processed content
//                 this.outputBuffer = this.outputBuffer.substring(delimiterIndex + delimiter.length);
//
//
//                 output = this.makeOutputClean(output);
//
//                 const ended_at = new Date();
//
//                 this.pendingCommands.delete(id);
//                 const resolveData: CommandReturnType = {
//                     command,
//                     delimiter,
//                     started_at,
//                     ended_at,
//                     seconds: (ended_at.getTime() - started_at.getTime()) / 1000,
//                     output
//                 }
//                 this.log.info({
//                     title: 'command result',
//                     description: [
//                         `Started At: ${resolveData.started_at.getTimezoneOffset()} - ${resolveData.started_at.toISOString()}`,
//                         `Ended At: ${resolveData.ended_at.getTimezoneOffset()} - ${resolveData.ended_at.toISOString()}`,
//                         `Seconds: ${resolveData.seconds}`,
//                         `Command : ${command}`,
//                         `Output : ${resolveData.output}`,
//                     ]
//                 });
//                 resolve(resolveData);
//             }
//             // If buffer is getting too large, consider it an error
//             else if (maxBuffer > 0 && this.outputBuffer.length > maxBuffer) {
//                 this.pendingCommands.delete(id);
//                 this.log.error({
//                     title: `Buffer overflow(allowed : ${maxBuffer})`,
//                     description: `Trying to allocate ${this.outputBuffer.length}`
//                 })
//                 this.outputBuffer = '';
//                 reject(new Error(`Buffer overflow(allowed : ${maxBuffer})`));
//             }
//         }
//     }
//
//     private addToBuffer(data: string) {
//         this.outputBuffer += data;
//         this.resolvePendingCommands();
//     }
//
//     protected throwError(data: string | Error) {
//         this.close();
//         throw typeof data === 'string' ? new Error(data) : data;
//     }
//
//     protected onceEvents(client: Client) {
//         client.on('error', error => {
//             console.log('client error', error);
//         });
//         client.on('error', error => {
//             console.log('client error', error);
//         });
//         client.on('close', () => {
//             if (this.process)
//                 this.log.info({
//                     title: `Closed`
//                 });
//             else this.log.error({
//                 title: `Closed`
//             });
//         });
//         client.once('end', () => {
//             if (this.process)
//                 this.log.info({
//                     title: `Ended`
//                 });
//             else this.log.error({
//                 title: `Ended`
//             });
//         });
//         client.once('timeout', () => {
//             this.log.warn({
//                 title: `Timeout`
//             });
//             if (this.connectionRejector)
//                 this.connectionRejector(new Error('Timeout'));
//         });
//     }
//
//     protected makeEvents() {
//
//         this.shell?.once('exit', (code: any, siganl: any) => {
//             this?.callOnOutput(`Exited with code ${code}\n`);
//             if (code) {
//                 this.log.error({
//                     title: `Exited with code ${code} & signal : ${siganl}`
//                 });
//                 this.process?.end();
//                 this.throwError(`Exited with code ${code}`);
//             } else {
//                 this.log.info({
//                     title: `Exited with code ${code}`
//                 });
//                 this.process?.end();
//             }
//         });
//         this.shell?.on('close', () => {
//             this.log.info({
//                 title: `Closed Shell `
//             });
//         });
//         this.shell?.once('eof', () => {
//             this.log.info({
//                 title: `EOF Shell`
//             });
//         });
//         this.shell?.once('end', () => {
//             this.log.info({
//                 title: `END Shell`
//             });
//         });
//         this.shell?.once('finish', () => {
//             this.log.info({
//                 title: `FINISHED Shell`
//             });
//         });
//         this.shell?.on('error', (error: Error) => {
//             console.log('error error', error);
//             this?.callOnOutput('Error' + error.message + '\n');
//             this.log.info({
//                 title: `ERROR Shell`,
//                 description: error.message
//             });
//         });
//         this.shell?.on('data', (data: any) => {
//             const realData = this.makeOutputClean(data.toString('utf8')) + '\n';
//             this?.callOnOutput(realData);
//
//             this.log.debug({
//                 title: 'data',
//                 description: realData,
//             });
//             this.addToBuffer(realData);
//         });
//         this.shell?.stderr.on('data', (data: any) => {
//             console.log('stderr error', data.toString('utf8'));
//             const realData = this.makeOutputClean(data.toString('utf8'));
//             this?.callOnOutput(realData);
//             this.log.error({
//                 title: 'STDERR:data',
//                 description: realData,
//             });
//             this.throwError(realData);
//         });
//         this.shell?.stderr.on('error', (error) => {
//             console.log('error error', error);
//             this?.callOnOutput('Error' + error.message + '\n');
//             this.log.error({
//                 title: `ERROR Shell`,
//                 description: error.message
//             });
//         });
//     }
//
//     public async start(): Promise<SSHRunner> {
//         const client = await this.makeClient();
//
//         return new Promise((resolve, reject) => {
//             this.process?.shell({
//                 modes: {
//                     ECHO: 0,
//                     ECHONL: 1,
//                     // OCRNL:1,
//                 }
//             }, (err, stream) => {
//                 if (err)
//                     reject(err);
//                 this.shell = stream;
//                 this?.callOnOutput(`echo __COMMAND_START_COMPLETE__\n`);
//                 this.shell?.write(`echo __COMMAND_START_COMPLETE__\n`);
//                 this.makeEvents();
//                 resolve(this);
//             });
//         })
//     }
//
//     async execute(command: string): Promise<CommandReturnType> {
//         if (!this.process || !this.shell || this.shell.closed)
//             throw new Error('Shell session is closed');
//
//         const id = ++this.currentId;
//         const delimiter = `__COMMAND_${id}_COMPLETE__`;
//         const wrappedCommand = `${command}\n echo ${delimiter}\n`;
//         return new Promise((resolve, reject) => {
//             const started_at = new Date(Date.now());
//             this.pendingCommands.set(id, {
//                 seen: false,
//                 resolve, reject, command, delimiter, started_at
//             });
//             this?.callOnOutput(wrappedCommand);
//             this.shell?.write(wrappedCommand, (e) => {
//                 console.log('write error', e);
//                 this.log.debug({
//                     title: 'command started',
//                     description: [
//                         `Started At: ${started_at.getTimezoneOffset()} - ${started_at.toISOString()}`,
//                         `Command : ${wrappedCommand}`,
//                     ]
//                 });
//                 if (e)
//                     this.throwError(e);
//             })
//         })
//     }
//
//     async exec(command: string): Promise<CommandReturnType> {
//         return new Promise((resolve, reject) => {
//             const started_at = new Date(Date.now());
//             this.log.debug({
//                 title: 'command started',
//                 description: [
//                     `Started At: ${started_at.getTimezoneOffset()} - ${started_at.toISOString()}`,
//                     `Command : ${command}`,
//                 ]
//             });
//
//             this.process?.exec(command, (error, stream) => {
//                 let buffer = '';
//                 stream.on('close', (code:any, signal:any) => {
//                     this?.callOnOutput(`Closed with code ${code} signal${signal}\n`);
//                     if (code) {
//                         this.log.error({
//                             title: `Closed with code ${code} signal${signal}\n`
//                         });
//                     } else {
//                         this.log.info({
//                             title: `Exited with code ${code}`
//                         });
//                     }
//                 }).on('data', (data : any) => {
//                     const ended_at = new Date;
//                     const realData = this.makeOutputClean(data.toString('utf8')) + '\n';
//                     this?.callOnOutput(realData);
//
//                     this.log.debug({
//                         title: 'data',
//                         description: realData,
//                     });
//                     const resolveData: CommandReturnType = {
//                         command,
//                         delimiter:'',
//                         started_at,
//                         ended_at,
//                         seconds: (ended_at.getTime() - started_at.getTime()) / 1000,
//                         output : realData
//                     }
//                     this.log.info({
//                         title: 'command result',
//                         description: [
//                             `Started At: ${resolveData.started_at.getTimezoneOffset()} - ${resolveData.started_at.toISOString()}`,
//                             `Ended At: ${resolveData.ended_at.getTimezoneOffset()} - ${resolveData.ended_at.toISOString()}`,
//                             `Seconds: ${resolveData.seconds}`,
//                             `Command : ${command}`,
//                             `Output : ${resolveData.output}`,
//                         ]
//                     });
//                 }).stderr.on('data', (data) => {
//
//                 });
//                 if(error){
//                     this?.callOnOutput('Error' + error.message + '\n');
//                     this.log.error({
//                         title: `ERROR Shell`,
//                         description: error.message
//                     });
//                     reject(error);
//                 }else{
//                     channel.
//                 }
//             })
//         });
//     }
//
//     public async close() {
//         return new Promise((resolve, reject) => {
//             this.shell && this.shell.end('\nexit\n', () => {
//                 this.process && this.process?.end();
//                 resolve(undefined);
//             })
//
//         });
//     }
// }
