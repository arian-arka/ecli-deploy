import DeployBashFile from "../DeployBashFile";
import make from "../../../command/make";
import {joinPaths} from "ecli-base/dist/src/lib/helper/path";

export default class DeployDeployment extends DeployBashFile<{
    base: string,
    name: string,
    force?: boolean,
}> {
    protected cwd = '$Home/.ecli-deploy/deployment/' ;

    protected bash = [
        `#!/bin/bash`,
        `source $HOME/.bashrc`,
        `cd ${joinPaths(this.cwd,this.props.name)}`
    ];

    async afterCondition() {
        const maker = new make();

        const zippedPath = await maker.zip({
            base: this.props.base,
            name: this.props.name,
        });

        const remoteZipfile = `${this.props.name}.zip`;

        await this.runExec(`mkdir -p ${this.props.name}`);

        this.sftp?.putFile(zippedPath, joinPaths(this.cwd,this.props.name, remoteZipfile));

        await this.ssh.execute(`cd ${joinPaths(this.cwd,this.props.name)}`);
        await this.ssh.execute(`zip -o ${remoteZipfile}`);
        await this.ssh.execute(`rm -f ${remoteZipfile}`);


    }

    protected async condition(): Promise<boolean> {
        if (this.props.force)
            return true;
        try {
            await this.runExec( `mkdir ${this.props.name}`);
            return true;
        } catch (e) {
            return false;
        }
    }
}