import File from "ecli-base/dist/src/lib/sys/File";
import Directory from "ecli-base/dist/src/lib/sys/Directory";
import assert from "node:assert";
import {DeploymentType} from "./Deployment";
import {SFTPRunner} from "../Runner/SFTPRunner";
import Logger from "../Logger/Logger";
import {joinPaths} from "ecli-base/dist/src/lib/helper/path";
import fs from "fs";
import {archiveFolder, Zip} from "zip-lib";
import {Runner} from "../Runner/Runner";
import {CommandReturnType, SSHRunner} from "../Runner/SSHRunner";
import * as zlib from "node:zlib";

type StepsStageType = ({
    done: boolean,
    stage: string,
    started_at?: Date,
    ended_at?: Date,
    seconds: number,
    command: string[],
});

type StepsFlowType = ({
    done: boolean,
    flow: string,
    started_at?: Date,
    ended_at?: Date,
    seconds: number,
    stages: StepsStageType[],
});

type StepsDoneType = ({
    done: boolean,
    architecture: string,
    started_at?: Date,
    ended_at?: Date,
    seconds: number,
    flows: StepsFlowType[]
});


export default class DeployArchitecture {

    private gatherSteps() {
        const steps: StepsDoneType[] = [];

        let indexArchitecture = 0;
        for (const name of this.props.architectures ?? []) {
            const architecture = this.props.deployment.architectures[name];
            const architectureDone = this.stepsDone.at(indexArchitecture);
            steps.push({
                architecture: name,
                done: architectureDone?.done ?? false,
                started_at: architectureDone?.started_at,
                ended_at: architectureDone?.ended_at,
                seconds: architectureDone?.seconds ?? -1,
                flows: [],
            });
            for (const _flows of architecture.flows) {
                let indexFlow = 0;
                for (const flow of _flows) {
                    const flowDone = this.stepsDone.at(indexArchitecture)?.flows?.at(indexFlow);
                    steps[indexArchitecture].flows.push({
                        flow: flow.title,
                        done: flowDone?.done ?? false,
                        started_at: flowDone?.started_at,
                        ended_at: flowDone?.ended_at,
                        seconds: flowDone?.seconds ?? -1,
                        stages: []
                    });

                    let indexStage = 0;
                    for (const stage of flow.stages) {
                        const stageDone = this.stepsDone.at(indexArchitecture)?.flows?.at(indexFlow)?.stages?.at(indexStage);
                        steps[indexArchitecture].flows[indexFlow].stages.push({
                            stage: stage.title,
                            done: stageDone?.done ?? false,
                            started_at: stageDone?.started_at,
                            ended_at: stageDone?.ended_at,
                            seconds: stageDone?.seconds ?? -1,
                            command: []
                        });
                        for (const command of stage.command) {
                            steps[indexArchitecture].flows[indexFlow].stages[indexStage].command.push(command);
                        }
                        indexStage++;
                    }
                    indexFlow++;
                }
            }
            indexArchitecture++;
        }

        return {
            resumable: this.stepsDone.length !== this.props.architectures?.length || !this.stepsDone[this.stepsDone.length - 1].done,
            resumePoint: this.lastRunningStage,
            steps,
        };
    }

    private setStepLastArchitecture(data: { [key in keyof StepsDoneType]?: StepsDoneType[key] }, append = false) {
        const length = this.stepsDone.length + (append ? 1 : 0);
        this.stepsDone[length - 1] = {
            ...this.stepsDone[this.stepsDone.length - 1],
            ...data
        };
        return this;
    }

    private setStepLastFlow(data: { [key in keyof StepsFlowType]?: StepsFlowType[key] }, append = false) {
        const arcLength = this.stepsDone.length;
        const length = this.stepsDone[arcLength - 1].flows.length + (append ? 1 : 0);
        this.stepsDone[arcLength - 1].flows[length - 1] = {
            ...this.stepsDone[arcLength - 1].flows[length - 1],
            ...data
        };
        return this;
    }

    private setStepLastStage(data: { [key in keyof StepsStageType]?: StepsStageType[key] }, append = false) {
        const arcLength = this.stepsDone.length;
        const flowLength = this.stepsDone[arcLength - 1].flows.length;
        const length = this.stepsDone[arcLength - 1].flows[flowLength - 1].stages.length + (append ? 1 : 0);
        this.stepsDone[arcLength - 1].flows[flowLength - 1].stages[length - 1] = {
            ...this.stepsDone[arcLength - 1].flows[flowLength - 1].stages[length - 1],
            ...data
        };
        return this;
    }

    private pushLastStepCommand(command: string) {
        const arcLength = this.stepsDone.length;
        const flowLength = this.stepsDone[arcLength - 1].flows.length;
        const length = this.stepsDone[arcLength - 1].flows[flowLength - 1].stages.length;
        this.stepsDone[arcLength - 1].flows[flowLength - 1].stages[length - 1].command.push(command);
        return this;
    }

    private stepsDone: StepsDoneType[] = [];
    private lastRunningStage: [number, number, number] = [0, 0, 0];
    private architectureCounter = 0;
    private workingDir: string;
    private sftp ?: SFTPRunner;
    private ssh ?: SSHRunner;
    private logBase: string;
    private now = new Date();

    constructor(private readonly props: {
        deployment: DeploymentType

        architectures?: string[],

        remote: {
            user?: string,
            pass?: string,
            host?: string,
            port?: number,
            private_key?: string,
            passphrase?: string,
            cwd?: string
        },

        base: string,

        logBase: string,
    }) {
        //@ts-ignore
        this.logBase = joinPaths(this.props.logBase, `${this.now.toISOString().replaceAll(':', '-')}.${this.now.getTimezoneOffset()}`);

        Directory.create({
            path: this.logBase,
            recursive: true,
            check: false,
        });


        if (this.props.architectures?.length) {
            for (const architecture of this.props.architectures)
                assert(architecture in this.props.deployment.architectures, `Architecture ${architecture} not found.`);
        } else
            this.props.architectures = Object.keys(this.props.deployment.architectures);

        if (!(!!this.props?.remote?.host))
            this.props.remote.host = '127.0.0.1';
        if (!(!!this.props?.remote?.user))
            this.props.remote.user = undefined;
        if (!(!!this.props?.remote?.pass))
            this.props.remote.pass = undefined;
        if (!(!!this.props?.remote?.port))
            this.props.remote.port = 22;
        if (!(!!this.props?.remote?.private_key))
            this.props.remote.private_key = undefined;
        else this.props.remote.private_key = File.read({path: this.props.remote.private_key});
        if (!(!!this.props?.remote?.passphrase))
            this.props.remote.passphrase = undefined;

        this.workingDir = this.props.remote.cwd ?? '~';

        // console.log('props',JSON.stringify(this.props,null,2));
        // console.log('logBase',this.logBase);
        // console.log('architectures',this.props.architectures);
        console.log('base', this.props.base);
        // console.log('remote',this.props.remote);

    }

    private async destroyRunners() {
        for (const runner of [this.sftp, this.ssh]) {
            try {
                await runner?.close();
            } catch (e) {

            }
        }
    }

    private async startRunners() {

        const sftpRawLogger = (new Logger({
            path: joinPaths(this.logBase, '_sftp.raw.log'),
            rewrite: true,
            pipeString: (data) => {
                //console.log(data);
                return data;
            }
        }));
        const sshRawLogger = (new Logger({
            path: joinPaths(this.logBase, '_ssh.raw.log'),
            rewrite: true,
            pipeString: (data) => {
                //console.log(data);
                return data;
            }
        }));


        this.ssh = await (new SSHRunner({
            host: this.props.remote.host,
            username: this.props.remote.user,
            password: this.props.remote.pass,
            privateKey: this.props.remote.private_key,
            passphrase: this.props.remote.passphrase,
            port: this.props.remote.port,
            logger: (new Logger({
                path: joinPaths(this.logBase, '_ssh.log'),
                rewrite: true,
                pipeString: (data) => {
                    //console.log(data);
                    return data;
                }
            }))
        })).onOutput((data) => sshRawLogger.write(data))
            .start();

        if (!!this.props.remote.cwd) {
            await this.ssh.execute(`mkdir -p "${this.props.remote.cwd}"`);
            await this.ssh.execute(`cd "${this.props.remote.cwd}"`);
        }


        this.sftp = await (new SFTPRunner({
            host: this.props.remote.host,
            username: this.props.remote.user,
            password: this.props.remote.pass,
            privateKey: this.props.remote.private_key,
            passphrase: this.props.remote.passphrase,
            port: this.props.remote.port,
            cwd: this.props.remote.cwd ?? '',
            logger: (new Logger({
                path: joinPaths(this.logBase, '_sftp.log'),
                rewrite: true,
                pipeString: (data) => {
                    //console.log(data);
                    return data;
                }
            }))
        }))
            .onOutput((data) => sftpRawLogger.write(data))
            .start();
    }

    private async copyFiles() {
        const zipName = crypto.randomUUID().toString() + '__';
        const zipFile = zipName + '.zip';
        const zipFilePath = joinPaths(this.props.base, zipFile);

        const zip = new Zip();
        zip.addFolder(joinPaths(this.props.base, 'assets'), "assets");
        zip.addFolder(joinPaths(this.props.base, 'bash'), "bash");
        await zip.archive(zipFilePath);

        const remotePath = joinPaths(this.workingDir, zipFile);

        const result = await this.sftp?.putFile(zipFilePath, remotePath);

        Directory.delete({path: zipFilePath});

        return {zipFile, zipName};

    }

    private async makeFiles() {
        const {zipFile, zipName} = await this.copyFiles();

        await this.ssh?.execute(`cd "${this.workingDir}"`);

        await this.ssh?.execute(`rm -rf assets`);

        await this.ssh?.execute(`rm -rf bash`);

        await this.ssh?.execute(`rm -rf "${zipName}"`);

        await this.ssh?.execute(`unzip -o "${zipFile}"`);

        await this.ssh?.execute(`rm -f "${zipFile}"`);

        await this.ssh?.execute(`cd "${this.workingDir}"`);
    }

    private async makeArchitectureRunner(name: string) {
        const architecture = this.props.deployment.architectures[name];
        const rawLogger = (new Logger({
            path: joinPaths(this.logBase, `${++this.architectureCounter}.${name}.raw.log`),
            rewrite: true,
            pipeString: (data) => {
                //console.log(data);
                return data;
            }
        }));
        return await (new SSHRunner({
            host: architecture.host ?? '127.0.0.1',
            username: architecture.user ?? 'root',
            password: architecture.pass,
            privateKey: architecture['private-key'],
            passphrase: architecture.passphrase,
            port: architecture.port ?? 22,
            cwd: architecture.cwd ?? '',
            logger: (new Logger({
                path: joinPaths(this.logBase, `${this.architectureCounter}.${name}.log`),
                rewrite: true,
                pipeString: (data) => {
                    //console.log(data);
                    return data;
                }
            }))
        })).onOutput((data) => rawLogger.write(data))
            .start();
    }

    private async executeArchitecture(name: string, bash: DeploymentType['bash'][keyof DeploymentType['bash']]) {
        const architecture = this.props.deployment.architectures[name];
        const runner = await this.makeArchitectureRunner(name);
        const architectureStartedAt = new Date;

        this.setStepLastArchitecture({
            done: false,
            architecture: name,
            started_at: architectureStartedAt,
            flows: []
        }, true);

        let outFlowIndex = 0;

        for (const _flows of architecture.flows) {
            let flowIndex = 0;
            for (const flow of _flows) {
                const flowStartedAt = new Date;
                this.setStepLastFlow({
                    done: false,
                    started_at: flowStartedAt,
                    flow: flow.title,
                    stages: []
                }, true);
                let stageIndex = 0;
                for (const stage of flow.stages) {
                    const stageStartedAt = new Date;
                    this.setStepLastStage({
                        done: false,
                        started_at: stageStartedAt,
                        stage: stage.title,
                        command: []
                    }, true);
                    const currentBash = bash[`${outFlowIndex}.${flowIndex}.${stageIndex}`];
                    const bashRemotePath = joinPaths(this.workingDir, 'bash', currentBash.filename);

                    await runner.execute(`bash "${bashRemotePath}"`);

                    for (const command of stage.command)
                        this.pushLastStepCommand(command);

                    const stageEndedAt = new Date;
                    this.setStepLastStage({
                        done: true,
                        ended_at: stageEndedAt,
                        seconds: (stageEndedAt.getTime() - stageStartedAt.getTime()) / 1000
                    });
                    this.lastRunningStage[2]++;
                    stageIndex++;
                }
                const flowEndedAt = new Date;
                this.setStepLastFlow({
                    done: true,
                    ended_at: flowEndedAt,
                    seconds: (flowEndedAt.getTime() - flowStartedAt.getTime()) / 1000
                });
                this.lastRunningStage[1]++;
                flowIndex++;
            }
            outFlowIndex++;
        }

        const architectureEndedAt = new Date;
        this.setStepLastArchitecture({
            done: true,
            ended_at: architectureEndedAt,
            seconds: (architectureEndedAt.getTime() - architectureStartedAt.getTime()) / 1000
        });
        this.lastRunningStage[0]++;

        await runner.close();
    }

    private async executeArchitectures() {
        for (const architecture of this.props.architectures ?? [])
            await this.executeArchitecture(architecture, this.props.deployment.bash[architecture]);
    }

    async start() {
        try {
            await this.startRunners();
            await this.makeFiles()
            await this.executeArchitectures();
            const steps = this.gatherSteps();
            File.writeJson({
                path: joinPaths(this.logBase, '_steps.json'),
                data: steps
            });
            this.destroyRunners();
            return !steps.resumable;
        } catch (e) {
            this.destroyRunners();
            throw e;
        }
    }
}