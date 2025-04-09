"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const File_1 = __importDefault(require("ecli-base/dist/src/lib/sys/File"));
const SFTPRunner_1 = require("../Runner/SFTPRunner");
const path_1 = require("ecli-base/dist/src/lib/helper/path");
const SSHRunner_1 = require("../Runner/SSHRunner");
const Logger_1 = __importDefault(require("../Logger/Logger"));
const DeployGit_1 = __importDefault(require("./DeployBashFile/DeployGit"));
const DeployNvm_1 = __importDefault(require("./DeployBashFile/DeployNvm"));
const DeployNode_1 = __importDefault(require("./DeployBashFile/DeployNode"));
const DeployEcli_1 = __importDefault(require("./DeployBashFile/DeployEcli"));
const DeployEcliDeploy_1 = __importDefault(require("./DeployBashFile/DeployEcliDeploy"));
const DeployDeployment_1 = __importDefault(require("./DeployBashFile/DeployDeployment"));
const RemoveDeployment_1 = __importDefault(require("./DeployBashFile/RemoveDeployment"));
class DeployServer {
    constructor(props) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
        this.props = props;
        this.now = new Date;
        // @ts-ignore
        this.isoNow = this.now.toISOString().replaceAll(':', '-');
        this.remoteLogPath = `log/${this.isoNow}`;
        this.props.remote = {
            cwd: ((_b = (_a = this.props.remote) === null || _a === void 0 ? void 0 : _a.cwd) !== null && _b !== void 0 ? _b : '$HOME/.ecli-deploy'),
            host: (_e = ((_d = (_c = this.props.remote) === null || _c === void 0 ? void 0 : _c.host) !== null && _d !== void 0 ? _d : 'localhost')) !== null && _e !== void 0 ? _e : '127.0.0.1',
            username: (_g = ((_f = this.props.remote) === null || _f === void 0 ? void 0 : _f.username)) !== null && _g !== void 0 ? _g : undefined,
            password: (_j = ((_h = this.props.remote) === null || _h === void 0 ? void 0 : _h.password)) !== null && _j !== void 0 ? _j : undefined,
            passphrase: (_l = ((_k = this.props.remote) === null || _k === void 0 ? void 0 : _k.passphrase)) !== null && _l !== void 0 ? _l : undefined,
            private_key: !!((_m = this.props.remote) === null || _m === void 0 ? void 0 : _m.private_key_file) ?
                File_1.default.read({ path: (_o = this.props.remote) === null || _o === void 0 ? void 0 : _o.private_key_file }) :
                ((_q = ((_p = this.props.remote) === null || _p === void 0 ? void 0 : _p.private_key)) !== null && _q !== void 0 ? _q : undefined),
            port: (_s = (_r = this.props.remote) === null || _r === void 0 ? void 0 : _r.port) !== null && _s !== void 0 ? _s : 22,
        };
    }
    async install() {
        var _a, _b;
        for (const chunk of [
            new DeployGit_1.default(this.ssh, this.sftp, {}),
            new DeployNvm_1.default(this.ssh, this.sftp, { version: this.props.nvmVersion }),
            new DeployNode_1.default(this.ssh, this.sftp, { version: (_a = this.props.nodeVersion) !== null && _a !== void 0 ? _a : '20.14.0' }),
            new DeployEcli_1.default(this.ssh, this.sftp, { nodeVersion: (_b = this.props.nodeVersion) !== null && _b !== void 0 ? _b : '20.14.0' }),
            new DeployEcliDeploy_1.default(this.ssh, this.sftp, {}),
        ]) {
            await chunk.make();
        }
    }
    async send(name, force) {
        var _a, _b;
        const deployment = File_1.default.readJson({ path: (0, path_1.joinPaths)((_a = this.props.base) !== null && _a !== void 0 ? _a : './', 'dist', name, 'deploy.json') });
        for (const chunk of [
            new DeployDeployment_1.default(this.ssh, this.sftp, {
                base: (_b = this.props.base) !== null && _b !== void 0 ? _b : './',
                name: name,
                force
            }),
        ]) {
            await chunk.make();
        }
    }
    async remove(name) {
        for (const chunk of [
            new RemoveDeployment_1.default(this.ssh, this.sftp, { name }),
        ]) {
            await chunk.make();
        }
    }
    async run(name) {
        var _a, _b, _c;
        return await ((_a = this.ssh) === null || _a === void 0 ? void 0 : _a.exec(`ecli deploy.run "name:${name}" "base:${(_c = (_b = this.props.remote) === null || _b === void 0 ? void 0 : _b.cwd) !== null && _c !== void 0 ? _c : '$HOME/.ecli-deploy'}"`));
    }
    async result(name) {
    }
    async start() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
        this.ssh = await (new SSHRunner_1.SSHRunner({
            host: (_a = this.props.remote) === null || _a === void 0 ? void 0 : _a.host,
            username: (_b = this.props.remote) === null || _b === void 0 ? void 0 : _b.username,
            password: (_c = this.props.remote) === null || _c === void 0 ? void 0 : _c.password,
            privateKey: (_d = this.props.remote) === null || _d === void 0 ? void 0 : _d.private_key,
            passphrase: (_e = this.props.remote) === null || _e === void 0 ? void 0 : _e.passphrase,
            port: (_f = this.props.remote) === null || _f === void 0 ? void 0 : _f.port,
            logger: (new Logger_1.default({
                path: (0, path_1.joinPaths)((_h = (_g = this.props.remote) === null || _g === void 0 ? void 0 : _g.cwd) !== null && _h !== void 0 ? _h : '$HOME/.ecli-deploy', this.remoteLogPath, '_ssh.log'),
                pipeString: (data) => {
                    //console.log(data);
                    return data;
                }
            }))
        }))
            //.onOutput((data) => sshRawLogger.write(data))
            //.onOutput((data) => console.log(data))
            .start();
        await this.ssh.exec(`mkdir -p ${(_j = this.props.remote) === null || _j === void 0 ? void 0 : _j.cwd}`);
        this.sftp = await (new SFTPRunner_1.SFTPRunner({
            host: (_k = this.props.remote) === null || _k === void 0 ? void 0 : _k.host,
            username: (_l = this.props.remote) === null || _l === void 0 ? void 0 : _l.username,
            password: (_m = this.props.remote) === null || _m === void 0 ? void 0 : _m.password,
            privateKey: (_o = this.props.remote) === null || _o === void 0 ? void 0 : _o.private_key,
            passphrase: (_p = this.props.remote) === null || _p === void 0 ? void 0 : _p.passphrase,
            port: (_q = this.props.remote) === null || _q === void 0 ? void 0 : _q.port,
            cwd: (_r = this.props.remote) === null || _r === void 0 ? void 0 : _r.cwd,
            logger: (new Logger_1.default({
                path: (0, path_1.joinPaths)((_t = (_s = this.props.remote) === null || _s === void 0 ? void 0 : _s.cwd) !== null && _t !== void 0 ? _t : '$HOME/.ecli-deploy', this.remoteLogPath, '_sftp.log'),
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
exports.default = DeployServer;
