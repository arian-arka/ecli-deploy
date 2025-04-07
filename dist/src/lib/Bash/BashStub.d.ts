type FlowType = {
    title: string;
    stages: ({
        title: string;
        command: string[] | string;
    })[];
};
export type ResolvedFlowType = {
    title: string;
    stages: ({
        title: string;
        command: string[];
    })[];
};
export declare function makeEnvObject(text: string): any;
export declare function readEnv(path: string): any;
export default class BashStub {
    private readonly props;
    private cache;
    private resolvedFlows;
    constructor(props?: {
        env?: {
            [key: string]: string;
        };
        js?: string[];
        stubs?: {
            [key: string]: string;
        };
        flows?: {
            [key: string]: FlowType;
        };
    });
    private generateEnv;
    private generateResolverFunction;
    private generateFunctions;
    private getCache;
    private getResolvedFlow;
    private makeJs;
    make(stubs?: string[]): Promise<string[]>;
    resolveFlows(flows: (string[])[]): Promise<ResolvedFlowType[][]>;
    static of(base: string, env?: string): Promise<BashStub>;
}
export {};
