import DeployBashFile from "../DeployBashFile";

export default class DeployEcliDeploy extends DeployBashFile<{
    version?: string //default ''
}> {
    protected bash = [
        `#!/bin/bash`,
        `source $HOME/.bashrc`,
        `mkdir -p .ecli-deploy`,
        `cd .ecli-deploy`,
        `mkdir -p deployment`,
        `git clone https://github.com/arian-arka/ecli-deploy`,
        `cd ecli-deploy`,
        `ecli _alias name:deploy commands:./dist/src/command force:true "build:npm run dev"`
    ];
    protected cwd = "./";
    protected clearCwd = false;

    protected async condition(): Promise<boolean> {
        try {
            await this.runExec('ecli explain command:deploy.hello');
            return false;
        } catch (e) {
            return true;
        }
    }
}