"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DeployBashFile_1 = __importDefault(require("../DeployBashFile"));
const defaultVersion = '0.0.0';
class DeployEcli extends DeployBashFile_1.default {
    constructor() {
        super(...arguments);
        this.bash = [
            `#!/bin/bash`,
            `source $HOME/.bashrc`,
            `npm install -g `,
        ];
        this.cwd = crypto.randomUUID();
        this.clearCwd = true;
    }
    async condition() {
        try {
            await this.runExec('ecli');
            return false;
        }
        catch (e) {
            return true;
        }
    }
}
exports.default = DeployEcli;
