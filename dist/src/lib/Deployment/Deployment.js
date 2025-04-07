"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_assert_1 = __importDefault(require("node:assert"));
const Directory_1 = __importDefault(require("ecli-base/dist/src/lib/sys/Directory"));
const path_1 = require("ecli-base/dist/src/lib/helper/path");
const File_1 = __importDefault(require("ecli-base/dist/src/lib/sys/File"));
const Architecture_1 = __importDefault(require("../Architecture/Architecture"));
const zip_lib_1 = require("zip-lib");
const BashStub_1 = require("../Bash/BashStub");
class Deployment {
    static async of(base, deployment) {
        (0, node_assert_1.default)(Directory_1.default.exists({ path: base }), `base directory not found(${base}).`);
        const path = (0, path_1.joinPaths)(base, 'deployment', deployment + '.json');
        (0, node_assert_1.default)(Directory_1.default.exists({ path }), `deployment not found(${path}).`);
        const deploymentInput = File_1.default.readJson({ path });
        return new Deployment(deploymentInput, base, deployment);
    }
    constructor(deploymentInput, base, filename) {
        this.deploymentInput = deploymentInput;
        this.base = base;
        this.filename = filename;
    }
    async make() {
        var _a, _b;
        const tag = crypto.randomUUID().toString();
        const deployment = {
            bash: {},
            name: this.deploymentInput.name,
            filename: this.filename,
            full_name: this.filename + '.' + this.deploymentInput.version,
            description: this.deploymentInput.description,
            tag,
            version: this.deploymentInput.version,
            architectures: {},
            script: (_a = this.deploymentInput.script) !== null && _a !== void 0 ? _a : [],
            env: (0, BashStub_1.readEnv)((0, path_1.joinPaths)(this.base, 'env', this.deploymentInput.env))
        };
        const assets = new Set();
        for (const [key, env] of Object.entries(this.deploymentInput.architectures)) {
            const arc = await Architecture_1.default.of(this.base, key, env);
            deployment.architectures[key] = await arc.resolve();
            deployment.bash[key] = {};
            if (!!deployment.architectures[key].assets)
                assets.add((0, path_1.joinPaths)(this.base, (_b = deployment.architectures[key].assets) !== null && _b !== void 0 ? _b : ''));
        }
        return { assets, deployment };
    }
    async makeBashFiles(base, deployment) {
        const prefix = `#!/bin/bash`;
        for (const [architecture, value] of Object.entries(deployment.architectures)) {
            let outerFlowCounter = 0;
            for (const _flow of value.flows) {
                let flowCounter = 0;
                for (const flow of _flow) {
                    let stageCounter = 0;
                    for (const stage of flow.stages) {
                        const filename = `${architecture}.${outerFlowCounter}.${flowCounter}.${stageCounter}.bash`;
                        deployment.bash[architecture][`${outerFlowCounter}.${flowCounter}.${stageCounter}`] = {
                            filename,
                            outerFlow: outerFlowCounter,
                            flow: flowCounter,
                            stage: stageCounter,
                        };
                        File_1.default.create({
                            check: false,
                            createDir: true,
                            path: (0, path_1.joinPaths)(base, filename),
                            data: prefix + '\n' + (!!value.cwd ? `cd "${value.cwd}"` : '') + '\n' + stage.command.join('\n')
                        });
                        stageCounter++;
                    }
                    flowCounter++;
                }
                outerFlowCounter++;
            }
        }
    }
    async save() {
        const { assets, deployment } = await this.make();
        const assetsBase = (0, path_1.joinPaths)(this.base, 'assets');
        const distBase = (0, path_1.joinPaths)(this.base, 'dist');
        const deploymentBase = (0, path_1.joinPaths)(distBase, deployment.full_name);
        const deploymentAssetsBase = (0, path_1.joinPaths)(deploymentBase, 'assets');
        !Directory_1.default.exists({ path: deploymentBase }) && Directory_1.default.delete({ path: deploymentBase });
        //create base dir and assets dir together by recursive method
        Directory_1.default.create({ path: deploymentAssetsBase, check: false, recursive: true });
        await this.makeBashFiles((0, path_1.joinPaths)(deploymentBase, 'bash'), deployment);
        File_1.default.create({
            path: (0, path_1.joinPaths)(deploymentBase, `deploy.json`),
            data: JSON.stringify(deployment),
            check: false,
            createDir: true,
        });
        for (const asset of assets) {
            console.log('asset', asset);
            Directory_1.default.copy({
                force: true,
                src: (0, path_1.joinPaths)(assetsBase, asset),
                dst: (0, path_1.joinPaths)(deploymentAssetsBase, asset),
            });
        }
        return deploymentBase;
    }
    async zip() {
        const path = await this.save();
        const zippedPath = path + '.zip';
        await (0, zip_lib_1.archiveFolder)(path, zippedPath);
        Directory_1.default.delete({ path });
        return zippedPath;
    }
}
exports.default = Deployment;
