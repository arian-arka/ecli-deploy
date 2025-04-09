import {ResolvedArchitectureType} from "./Architecture";
import {DeploymentType} from "../Deployment/Deployment";
import {ExecCommandReturnType, SSHRunner} from "../Runner/SSHRunner";
import Logger from "../Logger/Logger";
import {joinPaths} from "ecli-base/dist/src/lib/helper/path";
import {SFTPRunner} from "../Runner/SFTPRunner";
import File from "ecli-base/dist/src/lib/sys/File";

type ExecutionType = {
    done: boolean,
    title: string,
    started_at?: Date,
    ended_at?: Date,
    seconds: number
};

type ExecutedStageType = ExecutionType & {
    command: string[],
    error?: Error,
};

type ExecutedFlowType = ExecutionType & {
    stages: ExecutedStageType[],
};

type ExecutedOuterFlowType = ExecutionType & {
    flows: ExecutedFlowType[],
};

type ExecutedArchitectureType = ExecutionType & {
    outerFlows: ExecutedOuterFlowType[],
};

export default class DeployArchitecture {

    public lastIndices = [0, 0, 0];

    public results: ExecutedArchitectureType;

    private sftp ?: SFTPRunner;
    private ssh ?: SSHRunner;
    private isoNow: string;
    private remoteLogPath: string;
    private now: Date;

    constructor(private readonly props: {
        startFrom?:[number,number,number],
        name: string,
        architecture: ResolvedArchitectureType,
        bash: DeploymentType['bash'][keyof DeploymentType['bash']],
        base?: string,
        deployment: string,
        now?: Date,
        runId : string,
    }) {
        this.now = props.now ?? new Date;
        // @ts-ignore
        this.isoNow = this.now.toISOString().replaceAll(':', '-');
        this.remoteLogPath = `log/${this.isoNow}`;
        this.results = {
            done: false,
            outerFlows: [],
            title: this.props.name,
            seconds: -1,
            started_at: this.now,
            ended_at: undefined,
        };
    }


    private calcSeconds(a: Date, b: Date) {
        return (b.getTime() - a.getTime()) * 1000;
    }

    private makeExecutionResult(title: string): ExecutionType {
        return {
            title,
            started_at: new Date,
            ended_at: undefined,
            seconds: -1,
            done: false,
        };
    }

    private endExecutionResult(data: ExecutionType) {
        data.ended_at = new Date;
        data.done = true;
        data.seconds = this.calcSeconds(data.started_at as Date, data.ended_at as Date);
    }

    protected async makeRunners() {
        // const sftpRawLogger = (new Logger({
        //     path: joinPaths(this.logBase, '_sftp.raw.log'),
        //     rewrite: true,
        //     pipeString: (data) => {
        //         //console.log(data);
        //         return data;
        //     }
        // }));
        // const sshRawLogger = (new Logger({
        //     path: joinPaths(this.logBase, '_ssh.raw.log'),
        //     rewrite: true,
        //     pipeString: (data) => {
        //         //console.log(data);
        //         return data;
        //     }
        // }));

        this.ssh = await (new SSHRunner({
            host: this.props.architecture.host,
            username: this.props.architecture.username,
            password: this.props.architecture.password,
            privateKey: this.props.architecture["private-key"],
            passphrase: this.props.architecture.passphrase,
            port: this.props.architecture.port,
            logger: (new Logger({
                path: joinPaths(this.props.base ?? './', this.remoteLogPath, `${this.props.architecture}-ssh.log`),
                //path: joinPaths(this.logBase, '_ssh.log'),
                //rewrite: true,
                pipeString: (data) => {
                    //console.log(data);
                    return data;
                }
            }))
        }))
            //.onOutput((data) => sshRawLogger.write(data))
            //.onOutput((data) => console.log(data))
            .start();

        await this.ssh.exec(`mkdir -p ${this.props.architecture.cwd}`);

        this.sftp = await (new SFTPRunner({
            host: this.props.architecture.host,
            username: this.props.architecture.username,
            password: this.props.architecture.password,
            privateKey: this.props.architecture["private-key"],
            passphrase: this.props.architecture.passphrase,
            port: this.props.architecture.port,
            cwd: this.props.architecture.cwd,
            logger: (new Logger({
                path: joinPaths(this.props.base ?? './', this.remoteLogPath, `${this.props.architecture}-sftp.log`),
                //path: joinPaths(this.logBase, '_sftp.log'),
                //rewrite: true,
                pipeString: (data) => {
                    //console.log(data);
                    return data;
                }
            }))
        }))
            //.onOutput((data) => sftpRawLogger.write(data))
            //.onOutput((data) => console.log(data))
            .start();
    }

    protected async sendFile(src: string, dst: string, cwd: string = '$HOME') {
        await this.ssh?.execute(`mkdir -p ${cwd}`);
        await this.sftp?.putFile(src, dst);
    }

    protected async executeStage(outerFlow: number, flow: number, stage: number) {
        const key = `${outerFlow}.${flow}.${stage}`;
        const filename = this.props.bash[key].filename;
        const src = joinPaths(this.props.base ?? './', 'bash', filename);
        const dst = joinPaths(this.props.architecture.cwd ?? '$HOME', filename);

        await this.sendFile(src, dst, this.props.architecture.cwd ?? '$HOME');


        const result = await this.ssh?.exec(`(cd ${this.props.architecture.cwd ?? '$HOME'}) && (bash ${filename})`);

        return result as ExecCommandReturnType;
    }

    protected async executeFlow(outerFlow: number, flow: number) {
        for (let i = this.props?.startFrom?.at(2) ?? 0; i < this.props.architecture.flows[outerFlow][flow].stages.length; i++) {
            this.results.outerFlows[outerFlow].flows[flow].stages.push(
                {
                    ...this.makeExecutionResult(this.props.architecture.flows[outerFlow][flow].stages[i].title),
                    command: this.props.architecture.flows[outerFlow][flow].stages[i].command
                }
            );
            try {
                await this.executeStage(outerFlow, flow, i);
            } catch (e) {
                this.results.outerFlows[outerFlow].flows[flow].stages[i].error = (e as ExecCommandReturnType).error;
            }
            this.lastIndices[2]++;
            this.endExecutionResult(this.results.outerFlows[outerFlow].flows[flow].stages[i]);
        }
    }

    protected async executeOuterFlow(outerFlow: number) {
        for (let i = this.props?.startFrom?.at(1) ?? 0; i < this.props.architecture.flows[outerFlow].length; i++) {
            this.results.outerFlows[outerFlow].flows.push(
                {
                    ...this.makeExecutionResult(this.results.outerFlows[outerFlow].flows[i].title),
                    stages: []
                }
            );
            await this.executeFlow(outerFlow, i);
            this.lastIndices[1]++;
            this.endExecutionResult(this.results.outerFlows[outerFlow].flows[i]);
        }
    }

    protected async execute() {

        for (let i = this.props?.startFrom?.at(0) ?? 0; i < this.props.architecture.flows.length; i++) {
            this.results.outerFlows.push(
                {
                    ...this.makeExecutionResult(`${i}`),
                    flows: []
                }
            );
            await this.executeOuterFlow(i);
            this.lastIndices[0]++;
            this.endExecutionResult(this.results.outerFlows[i]);
        }
    }

    public async start() {
        await this.makeRunners();
        await this.execute();
    }

    public async saveResult(){
        const data =  {
            id : this.props.runId,
            datetime : this.isoNow,
            startingPoint : this.props.startFrom ?? [0,0,0],
            endedPoint : this.lastIndices,
            results : this.results,
            done : this.results.done,
        };
        File.writeJson({
            path: joinPaths(this.props.base ?? './','results',`${this.props.runId}.json`),
            data
        });
        File.writeJson({
            path: joinPaths(this.props.base ?? './', this.remoteLogPath, `${this.props.runId}.json`),
            data
        });
    }
    public async close() {
        for (const runner of [this.sftp, this.ssh]) {
            try {
                await runner?.close();
            } catch (e) {

            }
        }
    }

}