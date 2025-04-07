"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DeployBashFile_1 = __importDefault(require("../DeployBashFile"));
const defaultVersion = '0.40.2';
class DeployNvm extends DeployBashFile_1.default {
    constructor() {
        var _a;
        super(...arguments);
        this.bash = [
            `#!/bin/bash`,
            `source $HOME/.bashrc`,
            `curl -s -o- https://raw.githubusercontent.com/nvm-sh/nvm/v${(_a = this.props.version) !== null && _a !== void 0 ? _a : defaultVersion}/install.sh | bash`,
        ];
        this.cwd = crypto.randomUUID();
        this.clearCwd = true;
    }
    async condition() {
        try {
            await this.runExec('nvm -v');
            return false;
        }
        catch (e) {
            return true;
        }
    }
}
exports.default = DeployNvm;
