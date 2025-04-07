/// <reference types="node" />
import { Runner } from "./Runner";
import { ChildProcess } from "node:child_process";
type FullCommandType = {
    command: string;
    resolve: (data: any) => void;
    reject: (data: any) => void;
    delimiter: string;
    started_at: Date;
};
type CommandReturnType = {
    command: string;
    delimiter: string;
    started_at: Date;
    ended_at: Date;
    seconds: number;
    output: string;
};
export declare class LocalRunner extends Runner {
    protected process?: ChildProcess;
    protected current?: {
        command: string;
        resolve: (data: any) => void;
        reject: (data: any) => void;
        delimiter: string;
    };
    protected outputBuffer: string;
    protected currentId: number;
    protected pendingCommands: Map<number, FullCommandType>;
    protected makeSpawn(): ChildProcess;
    getState(): {
        isRunning: boolean | undefined;
        currentCommand: string | undefined;
        pid: number | null | undefined;
        bufferLength: number;
    };
    private makeOutputClean;
    private resolvePendingCommands;
    private addToBuffer;
    protected throwError(data: string | Error): void;
    protected onceEvents(): void;
    protected makeEvents(): void;
    start(): this;
    execute(command: string): Promise<CommandReturnType>;
    close(): void;
}
export {};
