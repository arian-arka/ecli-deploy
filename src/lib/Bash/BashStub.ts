import {joinPaths} from "ecli-base/dist/src/lib/helper/path";
import File from "ecli-base/dist/src/lib/sys/File";
import {Worker} from "worker_threads";
import Directory from "ecli-base/dist/src/lib/sys/Directory";
import assert from "node:assert";
import fs from "fs";
import * as pathLib from "node:path";
import {parse as parseEnv} from "dotenv";
import Var from "ecli-base/dist/src/lib/var/Var";

type FlowType = {
    title: string,
    stages: ({
        title: string,
        command: string[] | string,
    })[],
};

export type ResolvedFlowType = {
    title: string,
    stages: ({
        title: string,
        command: string[],
    })[],
};

export function makeEnvObject(text: string) {
    const data: { [key: string]: string } = parseEnv(text);
    const all: any = {};
    for (const [key, value] of Object.entries(data))
        all[key] = !!value ? Var.parseStr(value) : null;
    return all;
}
export function readEnv(path: string) {
    assert(Directory.exists({path}),`Env does not exists(${path})`);
    return makeEnvObject(File.read({path}));
}

export default class BashStub {

    private cache: string[] = [];
    private resolvedFlows: { [key: string]: ResolvedFlowType } = {};

    constructor(private readonly props: {
        env?: { [key: string]: string },
        js?: string[],
        stubs?: { [key: string]: string },
        flows?: { [key: string]: FlowType },
    } = {}) {
    }

    private generateEnv() {
        let str = '\n';
        str += `const ____ENV____ = ${JSON.stringify(this.props?.env ?? {})};\n`;
        str += `const ____is_numeric____ = (str) => typeof str !== "string" ? false : !isNaN(Number(str));\n`;
        str += `const ENV = (____key____, ____default____ = '', ____realValue____ = false) => {
            const ____value____ = ____key____ in ____ENV____ ? ____ENV____[____key____] : ____default____;
            
            if(____realValue____)
                return ____value____;
            
            if(____value____===true || ____value____===false)
                return ____value____;
            
            if(typeof ____value____ === 'number')
                return ____value____;
            
            const ____trimmed____ = (____value____)?.trim()?.toLowerCase();
            
            if(!(!!____trimmed____))
                return ____trimmed____;
            
            if(____trimmed____ === 'true')
                return true;
            if(____trimmed____ === 'false')
                return false;
            if(____trimmed____ === 'undefined' || ____trimmed____ === 'null')
                return null;
            if(____is_numeric____(____trimmed____)) 
                return Number(____trimmed____);
            
            return ____value____;
            
        };\n`;

        return str;

    }

    private generateResolverFunction(stubs?: string[]) {
        let str = 'let ____items____ = ([' + (stubs?.map(e => {
            const stringified = JSON.stringify(e);
            return '`' + (stringified.length ? stringified.substring(1, stringified.length - 1) : '') + '`'

        })?.join(', ') ?? '') + ']);\n';

        str += `
            
            function ____resolver___(){
                const ____worker____ = require('worker_threads');
                ____worker____.parentPort.postMessage(JSON.stringify(____items____?.filter(e => !!e) ?? []))
            }
            ____resolver___();
        `;
        return str;
    }

    private generateFunctions() {
        let str = '\n';

        str += this.props?.js?.join('\n') ?? '';

        for (const [key, value] of Object.entries(this.props.stubs ?? {}))
            str += `const ${key}` + ' = (...PARAMS) => {\n' + 'return' + ' `' + (Array.isArray(value) ? value.map(e => '(' + e + ')').join('+ ') : value) + '`;};\n';

        return str + '\n';
    }

    private getCache(): string[] {
        if (!this.cache.length)
            this.cache = [
                this.generateEnv(),
                this.generateFunctions()
            ];
        return this.cache;
    }

    private async getResolvedFlow(flow: string): Promise<ResolvedFlowType> {
        console.log('flow',flow);
        if (!this.props.flows)
            return {
                title: '',
                stages: [],
            };
        if (!(flow in this.resolvedFlows))
            this.resolvedFlows[flow] = {
                title: this.props.flows[flow].title,
                stages: await Promise.all(this.props.flows[flow].stages.map(async (e) => ({
                    title: e.title,
                    command: await this.make(
                        Array.isArray(e.command) ? e.command : [e.command]
                    )
                })))
            }
        return this.resolvedFlows[flow];
    }

    private makeJs(texts: string[]) {
        return [
            ...this.getCache(),
            this.generateResolverFunction(texts)
        ].join('\n');
    }

    public async make(stubs?: string[]): Promise<string[]> {
        const path = joinPaths(
            __dirname,
            `.tmp____${Math.random().toString(36).substring(2, 15) + Math.random().toString(23).substring(2, 5)}.js`
        );

        File.create({
            path,
            check: false,
            createDir: true,
            data: this.makeJs(stubs ?? [])
        });

        const worker = new Worker(path, {workerData: []});

        return new Promise((resolve, reject) => {
            let data: string[] = [];
            worker.on('message', (result) => {
                data = [...data, ...JSON.parse(result ?? '')];
            });
            worker.on("error", (msg) => {
                //Directory.delete({path});
                reject(msg);
            });
            worker.on('exit', (code: number) => {
                //Directory.delete({path});
                if (!!code)
                    reject(Error(`Exited ${code}`));
                else
                    resolve(data);
            });
        });

    }

    public async resolveFlows(flows: (string[])[]) {
        const resolvedFlows: (ResolvedFlowType[])[] = [];
        for (const _flows of flows) {
            const resolved: ResolvedFlowType[] = [];
            for (const flow of _flows) {
                resolved.push(await this.getResolvedFlow(flow));
            }
            resolvedFlows.push(resolved);
        }
        return resolvedFlows;
    }

    public static async of(base: string, env?: string) {
        assert(Directory.exists({path: base}), `base directory not found(${base}).`);
        assert(!(!!env) || Directory.exists({path: joinPaths(base, 'env', env)}), `env file not found(${joinPaths(base, 'env', env ?? '')}).`);

        const path = joinPaths(base, 'stub');

        assert(Directory.exists({path}), `stub directory not found(${path}).`);

        let js = [];
        let stubs = {};

        for (const file of fs.readdirSync(path)) {
            const extension = pathLib.extname(file);
            if (extension === '.js')
                js.push(File.read({path: joinPaths(path, file)}));
            if (extension === '.json')
                stubs = {...stubs, ...File.readJson({path: joinPaths(path, file)})};
        }

        const parsedEnv = makeEnvObject(File.read({path: joinPaths(base, 'env', env ?? '')}));

        const flowsPath = joinPaths(base, 'flow');

        assert(Directory.exists({path: flowsPath}), `flow directory not found(${flowsPath}).`);

        const flows: { [key: string]: ResolvedFlowType } = {};

        for (const _file of fs.readdirSync(flowsPath,{recursive : true})) {
            const file = _file.toString('utf8');
            const extension = pathLib.extname(file);
            if (extension === '.json') {
                const filename = file.substring(0, file.length - 5);
                const flowJson = File.readJson({path: joinPaths(flowsPath, file)}) as FlowType;
                flows[joinPaths(filename)] = {
                    title: flowJson.title,
                    stages: await Promise.all(flowJson.stages.map(async (e) => ({
                        title: e.title,
                        command: Array.isArray(e.command) ? e.command : [e.command]
                    })))
                };
            }
        }
        console.log(JSON.stringify(flows,null,2));

        return new BashStub({
            env: parsedEnv,
            js,
            stubs,
            flows
        })

    }

}