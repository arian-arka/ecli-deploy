import {CommandReturnType, ExecCommandReturnType, SSHRunner} from "../../Runner/SSHRunner";
import {SFTPRunner} from "../../Runner/SFTPRunner";
import DeployChunk from "../DeployChunk";
import DeployBashFile from "../DeployBashFile";

const defaultVersion = '0.0.0';

export default class DeployEcli extends DeployBashFile<{
    version?: string //default ''
}> {
    protected bash = [
        `#!/bin/bash`,
        `source $HOME/.bashrc`,
        `npm install -g `,
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