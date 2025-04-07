import { ResolvedArchitectureType } from "../Architecture/Architecture";
type DeploymentInputType = {
    name: string;
    description: string;
    version: string;
    architectures: {
        [key: string]: string;
    };
    env: string;
    script?: string[];
};
export type DeploymentType = {
    filename: string;
    full_name: string;
    name: string;
    description: string;
    tag: string;
    version: string;
    architectures: {
        [key: string]: ResolvedArchitectureType;
    };
    bash: {
        [key: string]: {
            [path: string]: {
                outerFlow: number;
                flow: number;
                stage: number;
                filename: string;
            };
        };
    };
    env: {
        [key: string]: string | null | number | boolean;
    };
    script: string[];
};
export default class Deployment {
    private readonly deploymentInput;
    private readonly base;
    private readonly filename;
    static of(base: string, deployment: string): Promise<Deployment>;
    constructor(deploymentInput: DeploymentInputType, base: string, filename: string);
    make(): Promise<{
        assets: Set<string>;
        deployment: DeploymentType;
    }>;
    makeBashFiles(base: string, deployment: DeploymentType): Promise<void>;
    save(): Promise<string>;
    zip(): Promise<string>;
}
export {};
