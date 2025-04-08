
import DeployBashFile from "../DeployBashFile";
import {joinPaths} from "ecli-base/dist/src/lib/helper/path";
import {Zip} from "zip-lib";
import Directory from "ecli-base/dist/src/lib/sys/Directory";


export default class DeployFiles extends DeployBashFile<{
    base : string,
    deployment : string,
    cwd : string,
}> {
    protected bash = [];
    protected cwd = "$HOME/.ecli-deploy";
    protected async afterCondition(): Promise<any> {
        const localZipFile = this.props.deployment + '.zip';
        const localZipFilePath = joinPaths(this.props.base,'dist',this.props.deployment, localZipFile);

        const zip = new Zip();
        zip.addFolder(joinPaths(this.props.base,'dist',this.props.deployment,'assets'), "assets");
        zip.addFolder(joinPaths(this.props.base,'dist',this.props.deployment,'bash'), "bash");
        await zip.archive(localZipFilePath);

        const remoteBase =  joinPaths(this.cwd,this.props.deployment);
        const remoteZipPath = joinPaths(remoteBase, localZipFile);

        await this.makeSureDirExists(remoteBase);

        await this.sftp?.putFile(localZipFilePath,remoteZipPath);

        Directory.delete({path: localZipFilePath});

        await this.runExec(`cd "${remoteBase}" && zip -o "${localZipFile}" `); //&& rm "${localZipFile}"
    }

    protected async condition(){
        return true;
    }
}