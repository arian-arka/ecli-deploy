"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DeployBashFile_1 = __importDefault(require("../DeployBashFile"));
const make_1 = __importDefault(require("../../../command/make"));
const path_1 = require("ecli-base/dist/src/lib/helper/path");
class DeployDeployment extends DeployBashFile_1.default {
    constructor() {
        super(...arguments);
        this.cwd = '$Home/.ecli-deploy/deployment/';
        this.bash = [
            `#!/bin/bash`,
            `source $HOME/.bashrc`,
            `cd ${(0, path_1.joinPaths)(this.cwd, this.props.name)}`
        ];
    }
    async afterCondition() {
        var _a;
        const maker = new make_1.default();
        const zippedPath = await maker.zip({
            base: this.props.base,
            name: this.props.name,
        });
        const remoteZipfile = `${this.props.name}.zip`;
        await this.runExec(`mkdir -p ${this.props.name}`);
        (_a = this.sftp) === null || _a === void 0 ? void 0 : _a.putFile(zippedPath, (0, path_1.joinPaths)(this.cwd, this.props.name, remoteZipfile));
        await this.ssh.execute(`cd ${(0, path_1.joinPaths)(this.cwd, this.props.name)}`);
        await this.ssh.execute(`zip -o ${remoteZipfile}`);
        await this.ssh.execute(`rm -f ${remoteZipfile}`);
    }
    async condition() {
        if (this.props.force)
            return true;
        try {
            await this.runExec(`mkdir ${this.props.name}`);
            return true;
        }
        catch (e) {
            return false;
        }
    }
}
exports.default = DeployDeployment;
