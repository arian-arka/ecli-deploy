
import DeployBashFile from "../DeployBashFile";

const defaultVersion = '20.14.0';

export default class DeployNode extends DeployBashFile<{
    version?: string //default ''
}> {
    protected bash = [
        `#!/bin/bash`,
        `source $HOME/.bashrc`,
        `nvm -v`,
        `nvm install v${this.props.version ?? defaultVersion} 2>/dev/null `,
        `node -v`
    ];
    protected cwd = crypto.randomUUID();
    protected clearCwd = true;

    protected async condition(): Promise<boolean> {
        try{
            await this.runExec('node -v');
            return false;
        }catch (e){
            return true;
        }
    }
}