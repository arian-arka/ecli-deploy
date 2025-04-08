import { DeploymentType } from "./Deployment";
export default class Deploy {
    private readonly props;
    private sftp?;
    private ssh?;
    private now;
    private remote;
    private deployment;
    private isoNow;
    private remoteLogPath;
    constructor(props: {
        nvmVersion?: string;
        nodeVersion: string;
        base?: string;
        deployment: string;
        now?: Date;
    });
    protected findDeployment(): DeploymentType;
    protected destroyRunners(): Promise<void>;
    close(): Promise<void>;
    start(): Promise<void>;
    protected makeRunners(): Promise<void>;
    deployRepo(): Promise<void>;
    protected runArchitectures(): Promise<void>;
    run(): Promise<void>;
}
