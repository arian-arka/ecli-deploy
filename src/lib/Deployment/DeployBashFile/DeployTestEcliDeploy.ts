
import DeployBashFile from "../DeployBashFile";

export default class DeployTestEcliDeploy
    extends DeployBashFile<{
    version?: string //default ''
    nodeVersion?: string //default ''
}> {
    protected bash = [
        `#!/bin/bash`,
        `source $HOME/.bashrc`,
        `ecli explain:deploy.clear`,
    ];
    protected cwd = `$HOME`;

    protected async condition(): Promise<boolean> {
        return true;
    }
}