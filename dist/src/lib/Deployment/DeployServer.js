"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const File_1 = __importDefault(require("ecli-base/dist/src/lib/sys/File"));
const Directory_1 = __importDefault(require("ecli-base/dist/src/lib/sys/Directory"));
const node_assert_1 = __importDefault(require("node:assert"));
const SFTPRunner_1 = require("../Runner/SFTPRunner");
const Logger_1 = __importDefault(require("../Logger/Logger"));
const path_1 = require("ecli-base/dist/src/lib/helper/path");
const zip_lib_1 = require("zip-lib");
const SSHRunner_1 = require("../Runner/SSHRunner");
class DeployArchitecture {
    gatherSteps() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        const steps = [];
        let indexArchitecture = 0;
        for (const name of (_a = this.props.architectures) !== null && _a !== void 0 ? _a : []) {
            const architecture = this.props.deployment.architectures[name];
            const architectureDone = this.stepsDone.at(indexArchitecture);
            steps.push({
                architecture: name,
                done: (_b = architectureDone === null || architectureDone === void 0 ? void 0 : architectureDone.done) !== null && _b !== void 0 ? _b : false,
                started_at: architectureDone === null || architectureDone === void 0 ? void 0 : architectureDone.started_at,
                ended_at: architectureDone === null || architectureDone === void 0 ? void 0 : architectureDone.ended_at,
                seconds: (_c = architectureDone === null || architectureDone === void 0 ? void 0 : architectureDone.seconds) !== null && _c !== void 0 ? _c : -1,
                flows: [],
            });
            for (const _flows of architecture.flows) {
                let indexFlow = 0;
                for (const flow of _flows) {
                    const flowDone = (_e = (_d = this.stepsDone.at(indexArchitecture)) === null || _d === void 0 ? void 0 : _d.flows) === null || _e === void 0 ? void 0 : _e.at(indexFlow);
                    steps[indexArchitecture].flows.push({
                        flow: flow.title,
                        done: (_f = flowDone === null || flowDone === void 0 ? void 0 : flowDone.done) !== null && _f !== void 0 ? _f : false,
                        started_at: flowDone === null || flowDone === void 0 ? void 0 : flowDone.started_at,
                        ended_at: flowDone === null || flowDone === void 0 ? void 0 : flowDone.ended_at,
                        seconds: (_g = flowDone === null || flowDone === void 0 ? void 0 : flowDone.seconds) !== null && _g !== void 0 ? _g : -1,
                        stages: []
                    });
                    let indexStage = 0;
                    for (const stage of flow.stages) {
                        const stageDone = (_l = (_k = (_j = (_h = this.stepsDone.at(indexArchitecture)) === null || _h === void 0 ? void 0 : _h.flows) === null || _j === void 0 ? void 0 : _j.at(indexFlow)) === null || _k === void 0 ? void 0 : _k.stages) === null || _l === void 0 ? void 0 : _l.at(indexStage);
                        steps[indexArchitecture].flows[indexFlow].stages.push({
                            stage: stage.title,
                            done: (_m = stageDone === null || stageDone === void 0 ? void 0 : stageDone.done) !== null && _m !== void 0 ? _m : false,
                            started_at: stageDone === null || stageDone === void 0 ? void 0 : stageDone.started_at,
                            ended_at: stageDone === null || stageDone === void 0 ? void 0 : stageDone.ended_at,
                            seconds: (_o = stageDone === null || stageDone === void 0 ? void 0 : stageDone.seconds) !== null && _o !== void 0 ? _o : -1,
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
            resumable: this.stepsDone.length !== ((_p = this.props.architectures) === null || _p === void 0 ? void 0 : _p.length) || !this.stepsDone[this.stepsDone.length - 1].done,
            resumePoint: this.lastRunningStage,
            steps,
        };
    }
    setStepLastArchitecture(data, append = false) {
        const length = this.stepsDone.length + (append ? 1 : 0);
        this.stepsDone[length - 1] = {
            ...this.stepsDone[this.stepsDone.length - 1],
            ...data
        };
        return this;
    }
    setStepLastFlow(data, append = false) {
        const arcLength = this.stepsDone.length;
        const length = this.stepsDone[arcLength - 1].flows.length + (append ? 1 : 0);
        this.stepsDone[arcLength - 1].flows[length - 1] = {
            ...this.stepsDone[arcLength - 1].flows[length - 1],
            ...data
        };
        return this;
    }
    setStepLastStage(data, append = false) {
        const arcLength = this.stepsDone.length;
        const flowLength = this.stepsDone[arcLength - 1].flows.length;
        const length = this.stepsDone[arcLength - 1].flows[flowLength - 1].stages.length + (append ? 1 : 0);
        this.stepsDone[arcLength - 1].flows[flowLength - 1].stages[length - 1] = {
            ...this.stepsDone[arcLength - 1].flows[flowLength - 1].stages[length - 1],
            ...data
        };
        return this;
    }
    pushLastStepCommand(command) {
        const arcLength = this.stepsDone.length;
        const flowLength = this.stepsDone[arcLength - 1].flows.length;
        const length = this.stepsDone[arcLength - 1].flows[flowLength - 1].stages.length;
        this.stepsDone[arcLength - 1].flows[flowLength - 1].stages[length - 1].command.push(command);
        return this;
    }
    constructor(props) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        this.props = props;
        this.stepsDone = [];
        this.lastRunningStage = [0, 0, 0];
        this.architectureCounter = 0;
        this.now = new Date();
        //@ts-ignore
        this.logBase = (0, path_1.joinPaths)(this.props.logBase, `${this.now.toISOString().replaceAll(':', '-')}.${this.now.getTimezoneOffset()}`);
        Directory_1.default.create({
            path: this.logBase,
            recursive: true,
            check: false,
        });
        if ((_a = this.props.architectures) === null || _a === void 0 ? void 0 : _a.length) {
            for (const architecture of this.props.architectures)
                (0, node_assert_1.default)(architecture in this.props.deployment.architectures, `Architecture ${architecture} not found.`);
        }
        else
            this.props.architectures = Object.keys(this.props.deployment.architectures);
        if (!(!!((_c = (_b = this.props) === null || _b === void 0 ? void 0 : _b.remote) === null || _c === void 0 ? void 0 : _c.host)))
            this.props.remote.host = '127.0.0.1';
        if (!(!!((_e = (_d = this.props) === null || _d === void 0 ? void 0 : _d.remote) === null || _e === void 0 ? void 0 : _e.user)))
            this.props.remote.user = undefined;
        if (!(!!((_g = (_f = this.props) === null || _f === void 0 ? void 0 : _f.remote) === null || _g === void 0 ? void 0 : _g.pass)))
            this.props.remote.pass = undefined;
        if (!(!!((_j = (_h = this.props) === null || _h === void 0 ? void 0 : _h.remote) === null || _j === void 0 ? void 0 : _j.port)))
            this.props.remote.port = 22;
        if (!(!!((_l = (_k = this.props) === null || _k === void 0 ? void 0 : _k.remote) === null || _l === void 0 ? void 0 : _l.private_key)))
            this.props.remote.private_key = undefined;
        else
            this.props.remote.private_key = File_1.default.read({ path: this.props.remote.private_key });
        if (!(!!((_o = (_m = this.props) === null || _m === void 0 ? void 0 : _m.remote) === null || _o === void 0 ? void 0 : _o.passphrase)))
            this.props.remote.passphrase = undefined;
        this.workingDir = (_p = this.props.remote.cwd) !== null && _p !== void 0 ? _p : '~';
        // console.log('props',JSON.stringify(this.props,null,2));
        // console.log('logBase',this.logBase);
        // console.log('architectures',this.props.architectures);
        console.log('base', this.props.base);
        // console.log('remote',this.props.remote);
    }
    async destroyRunners() {
        for (const runner of [this.sftp, this.ssh]) {
            try {
                await (runner === null || runner === void 0 ? void 0 : runner.close());
            }
            catch (e) {
            }
        }
    }
    async startRunners() {
        var _a;
        const sftpRawLogger = (new Logger_1.default({
            path: (0, path_1.joinPaths)(this.logBase, '_sftp.raw.log'),
            rewrite: true,
            pipeString: (data) => {
                //console.log(data);
                return data;
            }
        }));
        const sshRawLogger = (new Logger_1.default({
            path: (0, path_1.joinPaths)(this.logBase, '_ssh.raw.log'),
            rewrite: true,
            pipeString: (data) => {
                //console.log(data);
                return data;
            }
        }));
        this.ssh = await (new SSHRunner_1.SSHRunner({
            host: this.props.remote.host,
            username: this.props.remote.user,
            password: this.props.remote.pass,
            privateKey: this.props.remote.private_key,
            passphrase: this.props.remote.passphrase,
            port: this.props.remote.port,
            logger: (new Logger_1.default({
                path: (0, path_1.joinPaths)(this.logBase, '_ssh.log'),
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
        this.sftp = await (new SFTPRunner_1.SFTPRunner({
            host: this.props.remote.host,
            username: this.props.remote.user,
            password: this.props.remote.pass,
            privateKey: this.props.remote.private_key,
            passphrase: this.props.remote.passphrase,
            port: this.props.remote.port,
            cwd: (_a = this.props.remote.cwd) !== null && _a !== void 0 ? _a : '',
            logger: (new Logger_1.default({
                path: (0, path_1.joinPaths)(this.logBase, '_sftp.log'),
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
    async copyFiles() {
        var _a;
        const zipName = crypto.randomUUID().toString() + '__';
        const zipFile = zipName + '.zip';
        const zipFilePath = (0, path_1.joinPaths)(this.props.base, zipFile);
        const zip = new zip_lib_1.Zip();
        zip.addFolder((0, path_1.joinPaths)(this.props.base, 'assets'), "assets");
        zip.addFolder((0, path_1.joinPaths)(this.props.base, 'bash'), "bash");
        await zip.archive(zipFilePath);
        const remotePath = (0, path_1.joinPaths)(this.workingDir, zipFile);
        const result = await ((_a = this.sftp) === null || _a === void 0 ? void 0 : _a.putFile(zipFilePath, remotePath));
        Directory_1.default.delete({ path: zipFilePath });
        return { zipFile, zipName };
    }
    async makeFiles() {
        var _a, _b, _c, _d, _e, _f, _g;
        const { zipFile, zipName } = await this.copyFiles();
        await ((_a = this.ssh) === null || _a === void 0 ? void 0 : _a.execute(`cd "${this.workingDir}"`));
        await ((_b = this.ssh) === null || _b === void 0 ? void 0 : _b.execute(`rm -rf assets`));
        await ((_c = this.ssh) === null || _c === void 0 ? void 0 : _c.execute(`rm -rf bash`));
        await ((_d = this.ssh) === null || _d === void 0 ? void 0 : _d.execute(`rm -rf "${zipName}"`));
        await ((_e = this.ssh) === null || _e === void 0 ? void 0 : _e.execute(`unzip -o "${zipFile}"`));
        await ((_f = this.ssh) === null || _f === void 0 ? void 0 : _f.execute(`rm -f "${zipFile}"`));
        await ((_g = this.ssh) === null || _g === void 0 ? void 0 : _g.execute(`cd "${this.workingDir}"`));
    }
    async makeArchitectureRunner(name) {
        var _a, _b, _c, _d;
        const architecture = this.props.deployment.architectures[name];
        const rawLogger = (new Logger_1.default({
            path: (0, path_1.joinPaths)(this.logBase, `${++this.architectureCounter}.${name}.raw.log`),
            rewrite: true,
            pipeString: (data) => {
                //console.log(data);
                return data;
            }
        }));
        return await (new SSHRunner_1.SSHRunner({
            host: (_a = architecture.host) !== null && _a !== void 0 ? _a : '127.0.0.1',
            username: (_b = architecture.user) !== null && _b !== void 0 ? _b : 'root',
            password: architecture.pass,
            privateKey: architecture['private-key'],
            passphrase: architecture.passphrase,
            port: (_c = architecture.port) !== null && _c !== void 0 ? _c : 22,
            cwd: (_d = architecture.cwd) !== null && _d !== void 0 ? _d : '',
            logger: (new Logger_1.default({
                path: (0, path_1.joinPaths)(this.logBase, `${this.architectureCounter}.${name}.log`),
                rewrite: true,
                pipeString: (data) => {
                    //console.log(data);
                    return data;
                }
            }))
        })).onOutput((data) => rawLogger.write(data))
            .start();
    }
    async executeArchitecture(name, bash) {
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
                    const bashRemotePath = (0, path_1.joinPaths)(this.workingDir, 'bash', currentBash.filename);
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
    async executeArchitectures() {
        var _a;
        for (const architecture of (_a = this.props.architectures) !== null && _a !== void 0 ? _a : [])
            await this.executeArchitecture(architecture, this.props.deployment.bash[architecture]);
    }
    async start() {
        try {
            await this.startRunners();
            await this.makeFiles();
            await this.executeArchitectures();
            const steps = this.gatherSteps();
            File_1.default.writeJson({
                path: (0, path_1.joinPaths)(this.logBase, '_steps.json'),
                data: steps
            });
            this.destroyRunners();
            return !steps.resumable;
        }
        catch (e) {
            this.destroyRunners();
            throw e;
        }
    }
}
exports.default = DeployArchitecture;
