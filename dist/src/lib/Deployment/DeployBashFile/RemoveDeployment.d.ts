import DeployBashFile from "../DeployBashFile";
export default class RemoveDeployment extends DeployBashFile<{
    name: string;
}> {
    protected bash: string[];
    protected cwd: string;
    protected condition(): Promise<boolean>;
}
