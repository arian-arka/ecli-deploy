import Logger from "../Logger/Logger";
export declare class Runner {
    protected readonly props: {
        host?: string;
        port?: number;
        username?: string;
        password?: string;
        privateKey?: string;
        passphrase?: string;
        keepaliveInterval?: number;
        timeout?: number;
        cwd?: string;
        env?: {
            [key: string]: string;
        };
        closeOnFailure?: boolean;
        maxBuffer?: number;
        logPath?: string;
        logger?: Logger;
    };
    log: Logger;
    protected _onOutput?: (data: string) => void;
    protected callOnOutput(data: string): void;
    onOutput(callback: (data: string) => void): this;
    constructor(props: {
        host?: string;
        port?: number;
        username?: string;
        password?: string;
        privateKey?: string;
        passphrase?: string;
        keepaliveInterval?: number;
        timeout?: number;
        cwd?: string;
        env?: {
            [key: string]: string;
        };
        closeOnFailure?: boolean;
        maxBuffer?: number;
        logPath?: string;
        logger?: Logger;
    });
    start(): Promise<any> | any;
    close(): Promise<any> | any;
    execute(command: string): Promise<any>;
}
