"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readEnv = exports.makeEnvObject = void 0;
const path_1 = require("ecli-base/dist/src/lib/helper/path");
const File_1 = __importDefault(require("ecli-base/dist/src/lib/sys/File"));
const worker_threads_1 = require("worker_threads");
const Directory_1 = __importDefault(require("ecli-base/dist/src/lib/sys/Directory"));
const node_assert_1 = __importDefault(require("node:assert"));
const fs_1 = __importDefault(require("fs"));
const pathLib = __importStar(require("node:path"));
const dotenv_1 = require("dotenv");
const Var_1 = __importDefault(require("ecli-base/dist/src/lib/var/Var"));
function makeEnvObject(text) {
    const data = (0, dotenv_1.parse)(text);
    const all = {};
    for (const [key, value] of Object.entries(data))
        all[key] = !!value ? Var_1.default.parseStr(value) : null;
    return all;
}
exports.makeEnvObject = makeEnvObject;
function readEnv(path) {
    (0, node_assert_1.default)(Directory_1.default.exists({ path }), `Env does not exists(${path})`);
    return makeEnvObject(File_1.default.read({ path }));
}
exports.readEnv = readEnv;
class BashStub {
    constructor(props = {}) {
        this.props = props;
        this.cache = [];
        this.resolvedFlows = {};
    }
    generateEnv() {
        var _a, _b;
        let str = '\n';
        str += `const ____ENV____ = ${JSON.stringify((_b = (_a = this.props) === null || _a === void 0 ? void 0 : _a.env) !== null && _b !== void 0 ? _b : {})};\n`;
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
    generateResolverFunction(stubs) {
        var _a, _b;
        let str = 'let ____items____ = ([' + ((_b = (_a = stubs === null || stubs === void 0 ? void 0 : stubs.map(e => {
            const stringified = JSON.stringify(e);
            return '`' + (stringified.length ? stringified.substring(1, stringified.length - 1) : '') + '`';
        })) === null || _a === void 0 ? void 0 : _a.join(', ')) !== null && _b !== void 0 ? _b : '') + ']);\n';
        str += `
            
            function ____resolver___(){
                const ____worker____ = require('worker_threads');
                ____worker____.parentPort.postMessage(JSON.stringify(____items____?.filter(e => !!e) ?? []))
            }
            ____resolver___();
        `;
        return str;
    }
    generateFunctions() {
        var _a, _b, _c, _d;
        let str = '\n';
        str += (_c = (_b = (_a = this.props) === null || _a === void 0 ? void 0 : _a.js) === null || _b === void 0 ? void 0 : _b.join('\n')) !== null && _c !== void 0 ? _c : '';
        for (const [key, value] of Object.entries((_d = this.props.stubs) !== null && _d !== void 0 ? _d : {}))
            str += `const ${key}` + ' = (...PARAMS) => {\n' + 'return' + ' `' + (Array.isArray(value) ? value.map(e => '(' + e + ')').join('+ ') : value) + '`;};\n';
        return str + '\n';
    }
    getCache() {
        if (!this.cache.length)
            this.cache = [
                this.generateEnv(),
                this.generateFunctions()
            ];
        return this.cache;
    }
    async getResolvedFlow(flow) {
        console.log('flow', flow);
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
                    command: await this.make(Array.isArray(e.command) ? e.command : [e.command])
                })))
            };
        return this.resolvedFlows[flow];
    }
    makeJs(texts) {
        return [
            ...this.getCache(),
            this.generateResolverFunction(texts)
        ].join('\n');
    }
    async make(stubs) {
        const path = (0, path_1.joinPaths)(__dirname, `.tmp____${Math.random().toString(36).substring(2, 15) + Math.random().toString(23).substring(2, 5)}.js`);
        File_1.default.create({
            path,
            check: false,
            createDir: true,
            data: this.makeJs(stubs !== null && stubs !== void 0 ? stubs : [])
        });
        const worker = new worker_threads_1.Worker(path, { workerData: [] });
        return new Promise((resolve, reject) => {
            let data = [];
            worker.on('message', (result) => {
                data = [...data, ...JSON.parse(result !== null && result !== void 0 ? result : '')];
            });
            worker.on("error", (msg) => {
                //Directory.delete({path});
                reject(msg);
            });
            worker.on('exit', (code) => {
                //Directory.delete({path});
                if (!!code)
                    reject(Error(`Exited ${code}`));
                else
                    resolve(data);
            });
        });
    }
    async resolveFlows(flows) {
        const resolvedFlows = [];
        for (const _flows of flows) {
            const resolved = [];
            for (const flow of _flows) {
                resolved.push(await this.getResolvedFlow(flow));
            }
            resolvedFlows.push(resolved);
        }
        return resolvedFlows;
    }
    static async of(base, env) {
        (0, node_assert_1.default)(Directory_1.default.exists({ path: base }), `base directory not found(${base}).`);
        (0, node_assert_1.default)(!(!!env) || Directory_1.default.exists({ path: (0, path_1.joinPaths)(base, 'env', env) }), `env file not found(${(0, path_1.joinPaths)(base, 'env', env !== null && env !== void 0 ? env : '')}).`);
        const path = (0, path_1.joinPaths)(base, 'stub');
        (0, node_assert_1.default)(Directory_1.default.exists({ path }), `stub directory not found(${path}).`);
        let js = [];
        let stubs = {};
        for (const file of fs_1.default.readdirSync(path)) {
            const extension = pathLib.extname(file);
            if (extension === '.js')
                js.push(File_1.default.read({ path: (0, path_1.joinPaths)(path, file) }));
            if (extension === '.json')
                stubs = { ...stubs, ...File_1.default.readJson({ path: (0, path_1.joinPaths)(path, file) }) };
        }
        const parsedEnv = makeEnvObject(File_1.default.read({ path: (0, path_1.joinPaths)(base, 'env', env !== null && env !== void 0 ? env : '') }));
        const flowsPath = (0, path_1.joinPaths)(base, 'flow');
        (0, node_assert_1.default)(Directory_1.default.exists({ path: flowsPath }), `flow directory not found(${flowsPath}).`);
        const flows = {};
        for (const _file of fs_1.default.readdirSync(flowsPath, { recursive: true })) {
            const file = _file.toString('utf8');
            const extension = pathLib.extname(file);
            if (extension === '.json') {
                const filename = file.substring(0, file.length - 5);
                const flowJson = File_1.default.readJson({ path: (0, path_1.joinPaths)(flowsPath, file) });
                flows[(0, path_1.joinPaths)(filename)] = {
                    title: flowJson.title,
                    stages: await Promise.all(flowJson.stages.map(async (e) => ({
                        title: e.title,
                        command: Array.isArray(e.command) ? e.command : [e.command]
                    })))
                };
            }
        }
        console.log(JSON.stringify(flows, null, 2));
        return new BashStub({
            env: parsedEnv,
            js,
            stubs,
            flows
        });
    }
}
exports.default = BashStub;
