import { ExecCommandReturnType, SSHRunner } from "../Runner/SSHRunner";
import { SFTPRunner } from "../Runner/SFTPRunner";
export default class DeployBashFile<T> {
    protected readonly ssh: SSHRunner;
    protected readonly sftp?: SFTPRunner | undefined;
    protected readonly props: T;
    constructor(ssh: SSHRunner, sftp?: SFTPRunner | undefined, props?: T);
    protected clearCwd: boolean;
    protected filename: string;
    protected cwd?: string;
    protected bash: string | string[];
    protected clearCwdPath(): Promise<void>;
    protected condition(): Promise<boolean>;
    protected makeSureDirExists(path: string): Promise<void>;
    protected makeSureCwdExists(): Promise<void>;
    protected beforeCondition(): Promise<any>;
    protected afterCondition(): Promise<any>;
    protected onEnd(): Promise<any>;
    protected runExec(command: string): Promise<ExecCommandReturnType>;
    make(): Promise<boolean>;
}
