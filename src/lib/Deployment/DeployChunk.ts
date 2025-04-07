import {CommandReturnType, ExecCommandReturnType, SSHRunner} from "../Runner/SSHRunner";
import {SFTPRunner} from "../Runner/SFTPRunner";
type DeployChunkReturnType={
    execute : {[name : string] : CommandReturnType[]},
    exec : {[name : string] : ExecCommandReturnType[]},
};
export default class DeployChunk<T>{
    constructor(protected readonly ssh : SSHRunner,protected readonly sftp ?: SFTPRunner,protected readonly props : T = {} as T) {}

    protected cwd ?: string;
    protected execute : {[name : string]:(string)[]} = {};
    protected exec : {[name : string]:(string)[]} = {};

    protected async condition(): Promise<boolean>{
        return true;
    }

    protected async makeSureDirExists(path : string){
        await this.ssh.exec(`mkdir -p ${path}`);
    }

    protected async makeSureCwdExists(){
        await this.makeSureDirExists(this.cwd ?? '');
    }

    protected async beforeCondition() : Promise<any>{

    }

    protected async afterCondition() : Promise<any>{

    }

    protected async onEnd() : Promise<any>{

    }

    protected async runExec(command : string){
        return await this.ssh.exec(`(cd ${this.cwd}) && (${command})`);;
    }
    public async make() : Promise<boolean> {
        await this.makeSureCwdExists();

        await this.ssh.execute(`cd "${this.cwd}"`);

        await this.beforeCondition();

        const can = await this.condition();
        if(!can)
            return false;

        await this.afterCondition();

        const results : DeployChunkReturnType = {
            execute : {},
            exec : {},
        };

        for(const [name,commands] of Object.entries(this.execute)){
            for(const command of commands){
                const result = await this.ssh.execute(command);
                if(!(name in results.execute))
                    results.execute[name] = [];
                results.execute[name].push(result);
            }
        }

        for(const [name,commands] of Object.entries(this.exec)){
            for(const command of commands){
                const result = await this.runExec(command);
                if(!(name in results.exec))
                    results.exec[name] = [];
                results.exec[name].push(result);
            }
        }

        await this.onEnd();

        return true;
    }
}