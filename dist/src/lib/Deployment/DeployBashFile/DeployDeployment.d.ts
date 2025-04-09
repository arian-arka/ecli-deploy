import DeployBashFile from "../DeployBashFile";
export default class DeployDeployment extends DeployBashFile<{
    base: string;
    name: string;
    force?: boolean;
}> {
    protected cwd: string;
    protected bash: string[];
    afterCondition(): Promise<void>;
    protected condition(): Promise<boolean>;
}
