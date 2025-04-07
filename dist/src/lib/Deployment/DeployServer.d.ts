import { DeploymentType } from "./Deployment";
export default class DeployArchitecture {
    private readonly props;
    private gatherSteps;
    private setStepLastArchitecture;
    private setStepLastFlow;
    private setStepLastStage;
    private pushLastStepCommand;
    private stepsDone;
    private lastRunningStage;
    private architectureCounter;
    private workingDir;
    private sftp?;
    private ssh?;
    private logBase;
    private now;
    constructor(props: {
        deployment: DeploymentType;
        architectures?: string[];
        remote: {
            user?: string;
            pass?: string;
            host?: string;
            port?: number;
            private_key?: string;
            passphrase?: string;
            cwd?: string;
        };
        base: string;
        logBase: string;
    });
    private destroyRunners;
    private startRunners;
    private copyFiles;
    private makeFiles;
    private makeArchitectureRunner;
    private executeArchitecture;
    private executeArchitectures;
    start(): Promise<boolean>;
}
