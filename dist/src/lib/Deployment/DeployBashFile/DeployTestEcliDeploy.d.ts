import DeployBashFile from "../DeployBashFile";
export default class DeployTestEcliDeploy extends DeployBashFile<{
    version?: string;
    nodeVersion?: string;
}> {
    protected bash: string[];
    protected cwd: string;
    protected condition(): Promise<boolean>;
}
