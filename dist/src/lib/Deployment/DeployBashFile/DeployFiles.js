"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DeployBashFile_1 = __importDefault(require("../DeployBashFile"));
const path_1 = require("ecli-base/dist/src/lib/helper/path");
const zip_lib_1 = require("zip-lib");
const Directory_1 = __importDefault(require("ecli-base/dist/src/lib/sys/Directory"));
class DeployFiles extends DeployBashFile_1.default {
    constructor() {
        super(...arguments);
        this.bash = [];
        this.cwd = "$HOME/.ecli-deploy";
    }
    async afterCondition() {
        var _a;
        const localZipFile = this.props.deployment + '.zip';
        const localZipFilePath = (0, path_1.joinPaths)(this.props.base, 'dist', this.props.deployment, localZipFile);
        const zip = new zip_lib_1.Zip();
        zip.addFolder((0, path_1.joinPaths)(this.props.base, 'dist', this.props.deployment, 'assets'), "assets");
        zip.addFolder((0, path_1.joinPaths)(this.props.base, 'dist', this.props.deployment, 'bash'), "bash");
        await zip.archive(localZipFilePath);
        const remoteBase = (0, path_1.joinPaths)(this.cwd, this.props.deployment);
        const remoteZipPath = (0, path_1.joinPaths)(remoteBase, localZipFile);
        await this.makeSureDirExists(remoteBase);
        await ((_a = this.sftp) === null || _a === void 0 ? void 0 : _a.putFile(localZipFilePath, remoteZipPath));
        Directory_1.default.delete({ path: localZipFilePath });
        await this.runExec(`cd "${remoteBase}" && zip -o "${localZipFile}" `); //&& rm "${localZipFile}"
    }
    async condition() {
        return true;
    }
}
exports.default = DeployFiles;
