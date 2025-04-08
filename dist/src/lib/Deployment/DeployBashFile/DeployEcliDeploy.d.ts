import DeployBashFile from "../DeployBashFile";
export default class DeployEcliDeploy extends DeployBashFile<{
    version?: string;
}> {
    protected bash: string[];
    protected cwd: string;
    protected clearCwd: boolean;
    protected condition(): Promise<boolean>;
}
