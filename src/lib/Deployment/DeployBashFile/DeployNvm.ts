
import DeployBashFile from "../DeployBashFile";

const defaultVersion = '0.40.2';

export default class DeployNvm extends DeployBashFile<{
    version?: string //default ''
}> {
    protected bash = [
        `#!/bin/bash`,
        `source $HOME/.bashrc`,
        `curl -s -o- https://raw.githubusercontent.com/nvm-sh/nvm/v${this.props.version ?? defaultVersion}/install.sh | bash`,
    ];
    protected cwd = crypto.randomUUID();
    protected clearCwd = true;

    protected async condition(): Promise<boolean> {
        try {
            await this.runExec('nvm -v');
            return false;
        } catch (e) {
            return true;
        }
    }
}