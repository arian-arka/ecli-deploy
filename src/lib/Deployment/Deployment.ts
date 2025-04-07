import assert from "node:assert";
import Directory from "ecli-base/dist/src/lib/sys/Directory";
import {joinPaths} from "ecli-base/dist/src/lib/helper/path";
import File from "ecli-base/dist/src/lib/sys/File";
import Architecture, {ResolvedArchitectureType} from "../Architecture/Architecture";
import {archiveFolder} from "zip-lib";
import {readEnv} from "../Bash/BashStub";

type DeploymentInputType = {
    name: string,
    description: string,
    version: string,
    architectures: {
        [key: string]: string
    },
    env: string,
    script?: string[],
}

export type DeploymentType = {
    filename: string,
    full_name: string,
    name: string,
    description: string,
    tag: string,
    version: string,
    architectures: {
        [key: string]: ResolvedArchitectureType
    },
    bash: {
        [key: string]: {
            [path: string]: {
                outerFlow: number,
                flow: number,
                stage: number,
                filename: string,
            }
        }
    },
    env: { [key: string]: string | null | number | boolean }
    script: string[],
}

export default class Deployment {
    public static async of(base: string, deployment: string) {
        assert(Directory.exists({path: base}), `base directory not found(${base}).`);

        const path = joinPaths(base, 'deployment', deployment + '.json');
        assert(Directory.exists({path}), `deployment not found(${path}).`);

        const deploymentInput = File.readJson({path}) as DeploymentInputType;

        return new Deployment(deploymentInput, base, deployment);
    }

    constructor(private readonly deploymentInput: DeploymentInputType,
                private readonly base: string,
                private readonly filename: string) {
    }


    async make() {
        const tag = crypto.randomUUID().toString();
        const deployment: DeploymentType = {
            bash: {},
            name: this.deploymentInput.name,
            filename: this.filename,
            full_name : this.filename + '.' + this.deploymentInput.version,
            description: this.deploymentInput.description,
            tag,
            version: this.deploymentInput.version,
            architectures: {},
            script: this.deploymentInput.script ?? [],
            env: readEnv(joinPaths(this.base, 'env', this.deploymentInput.env))
        };
        const assets: Set<string> = new Set();
        for (const [key, env] of Object.entries(this.deploymentInput.architectures)) {
            const arc = await Architecture.of(this.base, key, env);
            deployment.architectures[key] = await arc.resolve();
            deployment.bash[key] = {};
            if (!!deployment.architectures[key].assets)
                assets.add(joinPaths(this.base, deployment.architectures[key].assets ?? ''));
        }


        return {assets, deployment};
    }

    async makeBashFiles(base: string, deployment: DeploymentType) {
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
                        File.create({
                            check: false,
                            createDir: true,
                            path: joinPaths(base, filename),
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
        const {assets, deployment} = await this.make();
        const assetsBase = joinPaths(this.base, 'assets');
        const distBase = joinPaths(this.base, 'dist');
        const deploymentBase = joinPaths(distBase, deployment.full_name);

        const deploymentAssetsBase = joinPaths(deploymentBase, 'assets');
        !Directory.exists({path: deploymentBase}) && Directory.delete({path: deploymentBase});
        //create base dir and assets dir together by recursive method
        Directory.create({path: deploymentAssetsBase, check: false, recursive: true});

        await this.makeBashFiles(joinPaths(deploymentBase, 'bash'), deployment);

        File.create({
            path: joinPaths(deploymentBase, `deploy.json`),
            data: JSON.stringify(deployment),
            check: false,
            createDir: true,
        });

        for (const asset of assets) {
            console.log('asset', asset);
            Directory.copy({
                force: true,
                src: joinPaths(assetsBase, asset),
                dst: joinPaths(deploymentAssetsBase, asset),
            })
        }


        return deploymentBase;

    }

    async zip() {
        const path = await this.save();
        const zippedPath = path + '.zip';
        await archiveFolder(path, zippedPath);
        Directory.delete({path});
        return zippedPath;
    }

}