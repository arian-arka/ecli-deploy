import { DeploymentType } from "./Deployment";
export default class Deploy {
    private readonly props;
    protected deployment: DeploymentType;
    runId: string;
    constructor(props: {
        base?: string;
        name: string;
    });
    deployArchitecture(name: string): Promise<boolean>;
    start(): Promise<boolean>;
}
