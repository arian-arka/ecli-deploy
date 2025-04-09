import { ResolvedArchitectureType } from "./Architecture";
import { DeploymentType } from "../Deployment/Deployment";
import { ExecCommandReturnType } from "../Runner/SSHRunner";
type ExecutionType = {
    done: boolean;
    title: string;
    started_at?: Date;
    ended_at?: Date;
    seconds: number;
};
type ExecutedStageType = ExecutionType & {
    command: string[];
    error?: Error;
};
type ExecutedFlowType = ExecutionType & {
    stages: ExecutedStageType[];
};
type ExecutedOuterFlowType = ExecutionType & {
    flows: ExecutedFlowType[];
};
type ExecutedArchitectureType = ExecutionType & {
    outerFlows: ExecutedOuterFlowType[];
};
export default class DeployArchitecture {
    private readonly props;
    lastIndices: number[];
    results: ExecutedArchitectureType;
    private sftp?;
    private ssh?;
    private isoNow;
    private remoteLogPath;
    private now;
    constructor(props: {
        startFrom?: [number, number, number];
        name: string;
        architecture: ResolvedArchitectureType;
        bash: DeploymentType['bash'][keyof DeploymentType['bash']];
        base?: string;
        deployment: string;
        now?: Date;
        runId: string;
    });
    private calcSeconds;
    private makeExecutionResult;
    private endExecutionResult;
    protected makeRunners(): Promise<void>;
    protected sendFile(src: string, dst: string, cwd?: string): Promise<void>;
    protected executeStage(outerFlow: number, flow: number, stage: number): Promise<ExecCommandReturnType>;
    protected executeFlow(outerFlow: number, flow: number): Promise<void>;
    protected executeOuterFlow(outerFlow: number): Promise<void>;
    protected execute(): Promise<void>;
    start(): Promise<void>;
    saveResult(): Promise<void>;
    close(): Promise<void>;
}
export {};
