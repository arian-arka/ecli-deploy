import DeployBashFile from "../DeployBashFile";
import make from "../../../command/make";
import {joinPaths} from "ecli-base/dist/src/lib/helper/path";

export default class RemoveDeployment extends DeployBashFile<{
    name: string,
}> {
    protected bash = [
        `#!/bin/bash`,
        `source $HOME/.bashrc`,
        `rm -rf ${this.props.name}`
    ];
    protected cwd = `$Home/.ecli-deploy/deployment` ;

    protected async condition(): Promise<boolean> {
        return true;
    }
}