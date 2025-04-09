"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DeployBashFile_1 = __importDefault(require("../DeployBashFile"));
class RemoveDeployment extends DeployBashFile_1.default {
    constructor() {
        super(...arguments);
        this.bash = [
            `#!/bin/bash`,
            `source $HOME/.bashrc`,
            `rm -rf ${this.props.name}`
        ];
        this.cwd = `$Home/.ecli-deploy/deployment`;
    }
    async condition() {
        return true;
    }
}
exports.default = RemoveDeployment;
