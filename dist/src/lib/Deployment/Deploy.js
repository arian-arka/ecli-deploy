"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const File_1 = __importDefault(require("ecli-base/dist/src/lib/sys/File"));
const SFTPRunner_1 = require("../Runner/SFTPRunner");
const Logger_1 = __importDefault(require("../Logger/Logger"));
const path_1 = require("ecli-base/dist/src/lib/helper/path");
const SSHRunner_1 = require("../Runner/SSHRunner");
const DeployNvm_1 = __importDefault(require("./DeployBashFile/DeployNvm"));
const DeployNode_1 = __importDefault(require("./DeployBashFile/DeployNode"));
class Deploy {
    constructor(props) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        this.props = props;
        this.now = (_a = props.now) !== null && _a !== void 0 ? _a : new Date;
        // @ts-ignore
        this.isoNow = this.now.toISOString().replaceAll(':', '-');
        this.remoteLogPath = `logs/${this.isoNow}`;
        this.deployment = this.findDeployment();
        this.remote = {
            cwd: ((_b = this.deployment.env['CWD']) !== null && _b !== void 0 ? _b : ''),
            host: ((_c = this.deployment.env['HOST']) !== null && _c !== void 0 ? _c : 'localhost'),
            username: (_d = (this.deployment.env['USER'])) !== null && _d !== void 0 ? _d : undefined,
            password: (_e = (this.deployment.env['PASS'])) !== null && _e !== void 0 ? _e : undefined,
            passphrase: (_f = (this.deployment.env['PASSPHRASE'])) !== null && _f !== void 0 ? _f : undefined,
            private_key: (_g = (!!this.deployment.env['PRIVATE_KEY_PATH'] ? File_1.default.read({ path: this.deployment.env['PRIVATE_KEY_PATH'] }) : this.deployment.env['PRIVATE_KEY'])) !== null && _g !== void 0 ? _g : undefined,
            port: (_h = this.deployment.env['PORT']) !== null && _h !== void 0 ? _h : 22,
        };
    }
    findDeployment() {
        var _a;
        return File_1.default.readJson({ path: (0, path_1.joinPaths)((_a = this.props.base) !== null && _a !== void 0 ? _a : './', 'dist', this.props.deployment, 'deploy.json') });
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
            host: this.remote.host,
            username: this.remote.username,
            password: this.remote.password,
            privateKey: this.remote.private_key,
            passphrase: this.remote.passphrase,
            port: this.remote.port,
            logger: (new Logger_1.default({
                path: (0, path_1.joinPaths)((_a = this.props.base) !== null && _a !== void 0 ? _a : './', 'log', '_ssh.log'),
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
        await this.ssh.exec(`mkdir -p ${this.remote.cwd}`);
        this.sftp = await (new SFTPRunner_1.SFTPRunner({
            host: this.remote.host,
            username: this.remote.username,
            password: this.remote.password,
            privateKey: this.remote.private_key,
            passphrase: this.remote.passphrase,
            port: this.remote.port,
            cwd: this.remote.cwd,
            logger: (new Logger_1.default({
                path: (0, path_1.joinPaths)((_b = this.props.base) !== null && _b !== void 0 ? _b : './', 'log', '_sftp.log'),
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
    async runChunks() {
        for (const chunk of [
            new DeployNvm_1.default(this.ssh, this.sftp, { version: this.props.nvmVersion }),
            new DeployNode_1.default(this.ssh, this.sftp, { version: this.props.nodeVersion }),
            // new DeployFiles(this.ssh as SSHRunner, this.sftp, {
            //     base: this.props.base ?? './',
            //     deployment: this.props.deployment,
            //     cwd: (this.deployment.env['CWD'] ?? '') as string,
            // }),
        ]) {
            await chunk.make();
        }
    }
    async runArchitectures() {
    }
    async run() {
        await this.makeRunners();
        await this.runChunks();
        await this.destroyRunners();
        //await this.runArchitectures();
    }
}
exports.default = Deploy;
