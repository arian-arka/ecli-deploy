"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DeployBashFile_1 = __importDefault(require("../DeployBashFile"));
class DeployGit extends DeployBashFile_1.default {
    constructor() {
        super(...arguments);
        this.bash = [
            `#!/bin/bash`,
            `source $HOME/.bashrc`,
            `sudo apt install git -y 2>/dev/null`,
        ];
        this.cwd = crypto.randomUUID();
        this.clearCwd = true;
    }
    async condition() {
        try {
            await this.runExec('git');
            return false;
        }
        catch (e) {
            return true;
        }
    }
}
exports.default = DeployGit;
