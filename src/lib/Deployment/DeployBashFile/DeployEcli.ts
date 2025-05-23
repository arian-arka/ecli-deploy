
import DeployBashFile from "../DeployBashFile";

const defaultVersion = '0.0.0';
const defaultNodeVersion = '20.14.0';
export default class DeployEcli extends DeployBashFile<{
    version?: string //default ''
    nodeVersion?: string //default ''
}> {
    protected bash = [
        `#!/bin/bash`,
        `source $HOME/.bashrc`,
        `npm install -g https://github.com/arian-arka/ecli/tarball/master`,
        `cd $HOME/.nvm/versions/node/v${this.props.nodeVersion ?? defaultNodeVersion}/lib && chmod -R a+x node_modules `,
    ];
    protected cwd = crypto.randomUUID();
    protected clearCwd = true;

    protected async condition(): Promise<boolean> {
        try {
            await this.runExec('ecli');
            return false;
        } catch (e) {
            return true;
        }
    }
}