"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DeployBashFile_1 = __importDefault(require("../DeployBashFile"));
class DeployEcliDeploy extends DeployBashFile_1.default {
    constructor() {
        super(...arguments);
        this.bash = [
            `#!/bin/bash`,
            `source $HOME/.bashrc`,
            `cd $HOME`,
            `mkdir -p .ecli-deploy`,
            `cd .ecli-deploy`,
            `mkdir -p deployment`,
            `git clone https://github.com/arian-arka/ecli-deploy`,
            `cd ecli-deploy`,
            `ecli _alias name:deploy commands:./dist/src/command force:true "build:npm run dev"`
        ];
        this.cwd = "./";
        this.clearCwd = false;
    }
    async condition() {
        try {
            const result = await this.runExec('ecli explain command:deploy.hello');
            console.log('ecli exlpian command:deploy.hello -> working');
            console.log('result', result);
            return false;
        }
        catch (e) {
            console.log('ecli exlpian command:deploy.hello -> not working');
            return true;
        }
    }
}
exports.default = DeployEcliDeploy;
