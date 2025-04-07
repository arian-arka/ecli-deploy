"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DeployBashFile_1 = __importDefault(require("../DeployBashFile"));
const defaultVersion = '20.14.0';
class DeployNode extends DeployBashFile_1.default {
    constructor() {
        var _a;
        super(...arguments);
        this.bash = [
            `#!/bin/bash`,
            `source $HOME/.bashrc`,
            `nvm -v`,
            `nvm install v${(_a = this.props.version) !== null && _a !== void 0 ? _a : defaultVersion} 2>/dev/null `,
            `node -v`
        ];
        this.cwd = crypto.randomUUID();
        this.clearCwd = true;
    }
    async condition() {
        try {
            await this.runExec('node -v');
            return false;
        }
        catch (e) {
            return true;
        }
    }
}
exports.default = DeployNode;
