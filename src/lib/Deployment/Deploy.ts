import File from "ecli-base/dist/src/lib/sys/File";
import {DeploymentType} from "./Deployment";
import {SFTPRunner} from "../Runner/SFTPRunner";
import Logger from "../Logger/Logger";
import {joinPaths} from "ecli-base/dist/src/lib/helper/path";
import {SSHRunner} from "../Runner/SSHRunner";
import DeployNvm from "./DeployBashFile/DeployNvm";
import DeployNode from "./DeployBashFile/DeployNode";
import DeployGit from "./DeployBashFile/DeployGit";
import DeployEcli from "./DeployBashFile/DeployEcli";
import DeployEcliDeploy from "./DeployBashFile/DeployEcliDeploy";
import RemoveDeployment from "./DeployBashFile/RemoveDeployment";
import DeployDeployment from "./DeployBashFile/DeployDeployment";
import DeployArchitecture from "../Architecture/DeployArchitecture";

export default class Deploy {
    protected deployment : DeploymentType;
    public runId : string;
    constructor(private readonly props: {
        base?: string,
        name: string,
    }) {
        this.runId = crypto.randomUUID();
        this.deployment = File.readJson({path: joinPaths(this.props.base ?? './', this.props.name, 'deploy.json')}) as DeploymentType;
    }


    async deployArchitecture(name : string){
        const deployer = new DeployArchitecture({
            runId : this.runId,
            name,
            architecture : this.deployment.architectures[name],
            bash : this.deployment.bash[name],
            base : joinPaths(this.props.base ?? '$HOME',this.props.name),
            deployment : this.props.name,
        });
        let ok = false;
        try{
            await deployer.start();
            ok = true;
        }catch (e){

        }finally {
            await deployer.saveResult();
            await deployer.close();
        }
        return ok;
    }

    async start(){
        for(const [name,architecture] of Object.entries(this.deployment.architectures)){
            const ok  = await this.deployArchitecture(name);
            if(!ok)
                return false;
        }
        return true;
    }

}