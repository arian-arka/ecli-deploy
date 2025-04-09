"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SSHRunner_1 = require("../Runner/SSHRunner");
const Logger_1 = __importDefault(require("../Logger/Logger"));
const path_1 = require("ecli-base/dist/src/lib/helper/path");
const SFTPRunner_1 = require("../Runner/SFTPRunner");
const File_1 = __importDefault(require("ecli-base/dist/src/lib/sys/File"));
class DeployArchitecture {
    constructor(props) {
        var _a;
        this.props = props;
        this.lastIndices = [0, 0, 0];
        this.now = (_a = props.now) !== null && _a !== void 0 ? _a : new Date;
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
    calcSeconds(a, b) {
        return (b.getTime() - a.getTime()) * 1000;
    }
    makeExecutionResult(title) {
        return {
            title,
            started_at: new Date,
            ended_at: undefined,
            seconds: -1,
            done: false,
        };
    }
    endExecutionResult(data) {
        data.ended_at = new Date;
        data.done = true;
        data.seconds = this.calcSeconds(data.started_at, data.ended_at);
    }
    async makeRunners() {
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
        var _a, _b;
        this.ssh = await (new SSHRunner_1.SSHRunner({
            host: this.props.architecture.host,
            username: this.props.architecture.username,
            password: this.props.architecture.password,
            privateKey: this.props.architecture["private-key"],
            passphrase: this.props.architecture.passphrase,
            port: this.props.architecture.port,
            logger: (new Logger_1.default({
                path: (0, path_1.joinPaths)((_a = this.props.base) !== null && _a !== void 0 ? _a : './', this.remoteLogPath, `${this.props.architecture}-ssh.log`),
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
        this.sftp = await (new SFTPRunner_1.SFTPRunner({
            host: this.props.architecture.host,
            username: this.props.architecture.username,
            password: this.props.architecture.password,
            privateKey: this.props.architecture["private-key"],
            passphrase: this.props.architecture.passphrase,
            port: this.props.architecture.port,
            cwd: this.props.architecture.cwd,
            logger: (new Logger_1.default({
                path: (0, path_1.joinPaths)((_b = this.props.base) !== null && _b !== void 0 ? _b : './', this.remoteLogPath, `${this.props.architecture}-sftp.log`),
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
    async sendFile(src, dst, cwd = '$HOME') {
        var _a, _b;
        await ((_a = this.ssh) === null || _a === void 0 ? void 0 : _a.execute(`mkdir -p ${cwd}`));
        await ((_b = this.sftp) === null || _b === void 0 ? void 0 : _b.putFile(src, dst));
    }
    async executeStage(outerFlow, flow, stage) {
        var _a, _b, _c, _d, _e;
        const key = `${outerFlow}.${flow}.${stage}`;
        const filename = this.props.bash[key].filename;
        const src = (0, path_1.joinPaths)((_a = this.props.base) !== null && _a !== void 0 ? _a : './', 'bash', filename);
        const dst = (0, path_1.joinPaths)((_b = this.props.architecture.cwd) !== null && _b !== void 0 ? _b : '$HOME', filename);
        await this.sendFile(src, dst, (_c = this.props.architecture.cwd) !== null && _c !== void 0 ? _c : '$HOME');
        const result = await ((_d = this.ssh) === null || _d === void 0 ? void 0 : _d.exec(`(cd ${(_e = this.props.architecture.cwd) !== null && _e !== void 0 ? _e : '$HOME'}) && (bash ${filename})`));
        return result;
    }
    async executeFlow(outerFlow, flow) {
        var _a, _b, _c;
        for (let i = (_c = (_b = (_a = this.props) === null || _a === void 0 ? void 0 : _a.startFrom) === null || _b === void 0 ? void 0 : _b.at(2)) !== null && _c !== void 0 ? _c : 0; i < this.props.architecture.flows[outerFlow][flow].stages.length; i++) {
            this.results.outerFlows[outerFlow].flows[flow].stages.push({
                ...this.makeExecutionResult(this.props.architecture.flows[outerFlow][flow].stages[i].title),
                command: this.props.architecture.flows[outerFlow][flow].stages[i].command
            });
            try {
                await this.executeStage(outerFlow, flow, i);
            }
            catch (e) {
                this.results.outerFlows[outerFlow].flows[flow].stages[i].error = e.error;
            }
            this.lastIndices[2]++;
            this.endExecutionResult(this.results.outerFlows[outerFlow].flows[flow].stages[i]);
        }
    }
    async executeOuterFlow(outerFlow) {
        var _a, _b, _c;
        for (let i = (_c = (_b = (_a = this.props) === null || _a === void 0 ? void 0 : _a.startFrom) === null || _b === void 0 ? void 0 : _b.at(1)) !== null && _c !== void 0 ? _c : 0; i < this.props.architecture.flows[outerFlow].length; i++) {
            this.results.outerFlows[outerFlow].flows.push({
                ...this.makeExecutionResult(this.results.outerFlows[outerFlow].flows[i].title),
                stages: []
            });
            await this.executeFlow(outerFlow, i);
            this.lastIndices[1]++;
            this.endExecutionResult(this.results.outerFlows[outerFlow].flows[i]);
        }
    }
    async execute() {
        var _a, _b, _c;
        for (let i = (_c = (_b = (_a = this.props) === null || _a === void 0 ? void 0 : _a.startFrom) === null || _b === void 0 ? void 0 : _b.at(0)) !== null && _c !== void 0 ? _c : 0; i < this.props.architecture.flows.length; i++) {
            this.results.outerFlows.push({
                ...this.makeExecutionResult(`${i}`),
                flows: []
            });
            await this.executeOuterFlow(i);
            this.lastIndices[0]++;
            this.endExecutionResult(this.results.outerFlows[i]);
        }
    }
    async start() {
        await this.makeRunners();
        await this.execute();
    }
    async saveResult() {
        var _a, _b, _c;
        const data = {
            id: this.props.runId,
            datetime: this.isoNow,
            startingPoint: (_a = this.props.startFrom) !== null && _a !== void 0 ? _a : [0, 0, 0],
            endedPoint: this.lastIndices,
            results: this.results,
            done: this.results.done,
        };
        File_1.default.writeJson({
            path: (0, path_1.joinPaths)((_b = this.props.base) !== null && _b !== void 0 ? _b : './', 'results', `${this.props.runId}.json`),
            data
        });
        File_1.default.writeJson({
            path: (0, path_1.joinPaths)((_c = this.props.base) !== null && _c !== void 0 ? _c : './', this.remoteLogPath, `${this.props.runId}.json`),
            data
        });
    }
    async close() {
        for (const runner of [this.sftp, this.ssh]) {
            try {
                await (runner === null || runner === void 0 ? void 0 : runner.close());
            }
            catch (e) {
            }
        }
    }
}
exports.default = DeployArchitecture;
