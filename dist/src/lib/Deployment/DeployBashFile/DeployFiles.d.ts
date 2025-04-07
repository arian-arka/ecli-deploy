import DeployBashFile from "../DeployBashFile";
export default class DeployFiles extends DeployBashFile<{
    base: string;
    deployment: string;
    cwd: string;
}> {
    protected bash: never[];
    protected cwd: string;
    protected afterCondition(): Promise<any>;
    protected condition(): Promise<boolean>;
}
