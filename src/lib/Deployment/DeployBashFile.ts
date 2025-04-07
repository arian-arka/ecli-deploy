import {CommandReturnType, ExecCommandReturnType, SSHRunner} from "../Runner/SSHRunner";
import {SFTPRunner} from "../Runner/SFTPRunner";
import {joinPaths} from "ecli-base/dist/src/lib/helper/path";

type DeployBashFileReturnType = ExecCommandReturnType;
export default class DeployBashFile<T> {
    constructor(protected readonly ssh: SSHRunner, protected readonly sftp ?: SFTPRunner, protected readonly props: T = {} as T) {
        this.filename = crypto.randomUUID() + '.bash';
    }

    protected clearCwd : boolean = false;
    protected filename :string;
    protected cwd ?: string;
    protected bash: string|string[] = '';

    protected async clearCwdPath(){
        if(!!this.cwd)
            await this.ssh.exec(`rm -rf "${this.cwd}"`);
    }

    protected async condition(): Promise<boolean> {
        return true;
    }

    protected async makeSureDirExists(path: string) {
        await this.ssh.exec(`mkdir -p ${path}`);
    }

    protected async makeSureCwdExists() {
        await this.makeSureDirExists(this.cwd ?? '');
    }

    protected async beforeCondition(): Promise<any> {

    }

    protected async afterCondition(): Promise<any> {

    }

    protected async onEnd(): Promise<any> {

    }

    protected async runExec(command: string) {
        return await this.ssh.exec(`(cd ${this.cwd}) && (${command})`);
    }

    public async make(): Promise<boolean> {
        await this.makeSureCwdExists();

        await this.ssh.execute(`cd "${this.cwd}"`);

        await this.beforeCondition();

        const can = await this.condition();
        if (!can) {
            if(this.clearCwd)
                await this.clearCwdPath();
            return false;
        }

        await this.afterCondition();
        const strBash = Array.isArray(this.bash) ? this.bash.join('\n') : this.bash;

        if(!!strBash){
            const remotePath = joinPaths(this.cwd ?? '',this.filename);

            await this.sftp?.writeFile(remotePath,strBash);

            const result = await this.runExec(`bash ${remotePath}`);

            await this.runExec(`rm -rf ${remotePath}`);
        }

        if(this.clearCwd)
            await this.clearCwdPath();

        await this.onEnd();

        return true;
    }
}