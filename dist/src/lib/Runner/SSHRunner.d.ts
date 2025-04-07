import { Runner } from "./Runner";
import { Client, ClientChannel } from "ssh2";
type FullCommandType = {
    seen: boolean;
    command: string;
    resolve: (data: any) => void;
    reject: (data: any) => void;
    delimiter: string;
    started_at: Date;
};
export type CommandReturnType = {
    command: string;
    delimiter: string;
    started_at: Date;
    ended_at: Date;
    seconds: number;
    output: string;
};
export type ExecCommandReturnType = {
    command: string;
    started_at: Date;
    ended_at: Date;
    seconds: number;
    output: string;
    error?: Error;
    code?: number;
    signal?: string | number;
};
export declare class SSHRunner extends Runner {
    protected startedReading: boolean;
    protected shell?: ClientChannel;
    protected process?: Client;
    protected outputBuffer: string;
    protected currentId: number;
    protected pendingCommands: Map<number, FullCommandType>;
    protected connectionRejector?: (e: Error) => void;
    protected throwError(data: string | Error): void;
    protected closeShellOnError(error: string | Error): void;
    private makeProps;
    protected onceEvents(client: Client): void;
    protected makeClient(): Promise<Client>;
    protected makeOutputClean(text: string): string;
    protected resolvePendingCommands(): void;
    protected addToBuffer(data: string): void;
    protected makeEvents(): void;
    start(): Promise<SSHRunner>;
    execute(command: string): Promise<CommandReturnType>;
    exec(command: string): Promise<ExecCommandReturnType>;
    close(): Promise<unknown>;
}
export {};
