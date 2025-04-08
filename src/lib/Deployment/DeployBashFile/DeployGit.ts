
import DeployBashFile from "../DeployBashFile";


export default class DeployGit extends DeployBashFile<{
    version?: string //default ''
}> {
    protected bash = [
        `#!/bin/bash`,
        `source $HOME/.bashrc`,
        `sudo apt install git -y 2>/dev/null`,
    ];
    protected cwd = crypto.randomUUID();
    protected clearCwd = true;

    protected async condition(): Promise<boolean> {
        try {
            await this.runExec('git');
            return false;
        } catch (e) {
            return true;
        }
    }
}