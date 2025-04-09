export default class DeployServer {
    protected readonly props: {
        base?: string;
        nvmVersion?: string;
        nodeVersion?: string;
        remote?: {
            cwd?: string;
            host?: string;
            username?: string;
            password?: string;
            private_key?: string;
            private_key_file?: string;
            passphrase?: string;
            port?: number;
        };
    };
    private sftp?;
    private ssh?;
    private now;
    private isoNow;
    private remoteLogPath;
    constructor(props: {
        base?: string;
        nvmVersion?: string;
        nodeVersion?: string;
        remote?: {
            cwd?: string;
            host?: string;
            username?: string;
            password?: string;
            private_key?: string;
            private_key_file?: string;
            passphrase?: string;
            port?: number;
        };
    });
    install(): Promise<void>;
    send(name: string, force: boolean): Promise<void>;
    remove(name: string): Promise<void>;
    run(name: string): Promise<import("../Runner/SSHRunner").ExecCommandReturnType | undefined>;
    result(name: string): Promise<void>;
    start(): Promise<void>;
    close(): Promise<void>;
}
