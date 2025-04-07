import DeployBashFile from "../DeployBashFile";
export default class DeployNvm extends DeployBashFile<{
    version?: string;
}> {
    protected bash: string[];
    protected cwd: `${string}-${string}-${string}-${string}-${string}`;
    protected clearCwd: boolean;
    protected condition(): Promise<boolean>;
}
