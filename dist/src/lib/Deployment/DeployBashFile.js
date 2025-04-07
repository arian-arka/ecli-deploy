"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("ecli-base/dist/src/lib/helper/path");
class DeployBashFile {
    constructor(ssh, sftp, props = {}) {
        this.ssh = ssh;
        this.sftp = sftp;
        this.props = props;
        this.clearCwd = false;
        this.bash = '';
        this.filename = crypto.randomUUID() + '.bash';
    }
    async clearCwdPath() {
        if (!!this.cwd)
            await this.ssh.exec(`rm -rf "${this.cwd}"`);
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
    }
    async make() {
        var _a, _b;
        await this.makeSureCwdExists();
        await this.ssh.execute(`cd "${this.cwd}"`);
        await this.beforeCondition();
        const can = await this.condition();
        if (!can) {
            if (this.clearCwd)
                await this.clearCwdPath();
            return false;
        }
        await this.afterCondition();
        const strBash = Array.isArray(this.bash) ? this.bash.join('\n') : this.bash;
        if (!!strBash) {
            const remotePath = (0, path_1.joinPaths)((_a = this.cwd) !== null && _a !== void 0 ? _a : '', this.filename);
            await ((_b = this.sftp) === null || _b === void 0 ? void 0 : _b.writeFile(remotePath, strBash));
            const result = await this.runExec(`bash ${remotePath}`);
            await this.runExec(`rm -rf ${remotePath}`);
        }
        if (this.clearCwd)
            await this.clearCwdPath();
        await this.onEnd();
        return true;
    }
}
exports.default = DeployBashFile;
