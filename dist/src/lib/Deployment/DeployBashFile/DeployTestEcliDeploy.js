"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DeployBashFile_1 = __importDefault(require("../DeployBashFile"));
class DeployTestEcliDeploy extends DeployBashFile_1.default {
    constructor() {
        super(...arguments);
        this.bash = [
            `#!/bin/bash`,
            `source $HOME/.bashrc`,
            `ecli explain:deploy.clear`,
        ];
        this.cwd = `$HOME`;
    }
    async condition() {
        return true;
    }
}
exports.default = DeployTestEcliDeploy;
