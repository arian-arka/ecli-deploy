"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DeployChunk {
    constructor(ssh, sftp, props = {}) {
        this.ssh = ssh;
        this.sftp = sftp;
        this.props = props;
        this.execute = {};
        this.exec = {};
    }
    async condition() {
        return true;
    }
    async makeSureDirExists(path) {
        await this.ssh.exec(`mkdir -p ${path}`);
    }
    async makeSureCwdExists() {
        var _a;
        await this.makeSureDirExists((_a = this.cwd) !== null && _a !== void 0 ? _a : '');
    }
    async beforeCondition() {
    }
    async afterCondition() {
    }
    async onEnd() {
    }
    async runExec(command) {
        return await this.ssh.exec(`(cd ${this.cwd}) && (${command})`);
        ;
    }
    async make() {
        await this.makeSureCwdExists();
        await this.ssh.execute(`cd "${this.cwd}"`);
        await this.beforeCondition();
        const can = await this.condition();
        if (!can)
            return false;
        await this.afterCondition();
        const results = {
            execute: {},
            exec: {},
        };
        for (const [name, commands] of Object.entries(this.execute)) {
            for (const command of commands) {
                const result = await this.ssh.execute(command);
                if (!(name in results.execute))
                    results.execute[name] = [];
                results.execute[name].push(result);
            }
        }
        for (const [name, commands] of Object.entries(this.exec)) {
            for (const command of commands) {
                const result = await this.runExec(command);
                if (!(name in results.exec))
                    results.exec[name] = [];
                results.exec[name].push(result);
            }
        }
        await this.onEnd();
        return true;
    }
}
exports.default = DeployChunk;
