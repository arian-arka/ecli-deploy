"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const File_1 = __importDefault(require("ecli-base/dist/src/lib/sys/File"));
const path_1 = require("ecli-base/dist/src/lib/helper/path");
const DeployArchitecture_1 = __importDefault(require("../Architecture/DeployArchitecture"));
class Deploy {
    constructor(props) {
        var _a;
        this.props = props;
        this.runId = crypto.randomUUID();
        this.deployment = File_1.default.readJson({ path: (0, path_1.joinPaths)((_a = this.props.base) !== null && _a !== void 0 ? _a : './', this.props.name, 'deploy.json') });
    }
    async deployArchitecture(name) {
        var _a;
        const deployer = new DeployArchitecture_1.default({
            runId: this.runId,
            name,
            architecture: this.deployment.architectures[name],
            bash: this.deployment.bash[name],
            base: (0, path_1.joinPaths)((_a = this.props.base) !== null && _a !== void 0 ? _a : '$HOME', this.props.name),
            deployment: this.props.name,
        });
        let ok = false;
        try {
            await deployer.start();
            ok = true;
        }
        catch (e) {
        }
        finally {
            await deployer.saveResult();
            await deployer.close();
        }
        return ok;
    }
    async start() {
        for (const [name, architecture] of Object.entries(this.deployment.architectures)) {
            const ok = await this.deployArchitecture(name);
            if (!ok)
                return false;
        }
        return true;
    }
}
exports.default = Deploy;
