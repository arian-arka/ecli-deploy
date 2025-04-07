"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validateProps_1 = __importDefault(require("ecli-base/dist/src/decorator/validateProps"));
const node_assert_1 = __importDefault(require("node:assert"));
const Reader_1 = require("../Reader");
const BashStub_1 = __importDefault(require("../Bash/BashStub"));
const Directory_1 = __importDefault(require("ecli-base/dist/src/lib/sys/Directory"));
const path_1 = require("ecli-base/dist/src/lib/helper/path");
const File_1 = __importDefault(require("ecli-base/dist/src/lib/sys/File"));
const Var_1 = __importDefault(require("ecli-base/dist/src/lib/var/Var"));
const buildableKeys = {
    "cwd": {
        type: "string",
        nullable: true,
        question: "cwd: ",
    },
    "user": {
        type: "string",
        nullable: true,
        question: "user: ",
    },
    "pass": {
        type: "string",
        nullable: true,
        question: "pass: ",
    },
    "host": {
        type: "string",
        nullable: true,
        question: "host: ",
    },
    "port": {
        type: "number",
        nullable: true,
        question: "port: ",
    },
    "private-key": {
        type: "string",
        nullable: true,
        question: "private-key: ",
    },
    "passphrase": {
        type: "string",
        nullable: true,
        question: "passphrase: ",
    },
    "log": {
        type: "string",
        nullable: true,
        question: "log: ",
    },
    "log-dir": {
        type: "string",
        nullable: true,
        question: "log-dir: ",
    },
};
class Architecture {
    constructor(architecture, bashStub, assetsPath) {
        var _a;
        this.architecture = architecture;
        this.bashStub = bashStub;
        this.assetsPath = assetsPath;
        (0, node_assert_1.default)(!(!!architecture.assets) || Directory_1.default.exists({ path: (0, path_1.joinPaths)(this.assetsPath, (_a = architecture.assets) !== null && _a !== void 0 ? _a : '') }), `asset (${architecture.assets}) not found.`);
        return (async () => {
            await this.makeStubVariables();
            await this.readAskedVariables();
            this.validate(this.architecture);
            return this;
        })();
    }
    validate(architecture) {
        var _a;
        (0, node_assert_1.default)(!!architecture.cwd, 'cwd is required');
        (0, node_assert_1.default)(!!architecture.host, 'host is required');
        if (!['localhost', '127.0.0.1'].includes((_a = architecture.host) !== null && _a !== void 0 ? _a : '')) {
            (0, node_assert_1.default)(!!architecture.user, 'user is required');
            (0, node_assert_1.default)(!!architecture.pass || !!architecture["private-key"], 'pass or private-key is required');
        }
        (0, node_assert_1.default)(!!architecture.log, 'log is required');
        (0, node_assert_1.default)(!!architecture['log-dir'], 'log-dir is required');
    }
    async makeStubVariables() {
        var _a;
        for (const key in buildableKeys) {
            if (key in this.architecture) {
                // @ts-ignore
                const value = this.architecture[key];
                if (typeof value === 'string') {
                    // // @ts-ignore
                    // console.log(key,this.architecture[key]);
                    // // @ts-ignore
                    // console.log(key,await this.bashStub.make([this.architecture[key]]));
                    // @ts-ignore
                    this.architecture[key] = (await this.bashStub.make([this.architecture[key]]))[0];
                    if (buildableKeys[key].type !== 'string') {
                        // @ts-ignore
                        const tmp = (_a = this.architecture[key]) === null || _a === void 0 ? void 0 : _a.trim();
                        // @ts-ignore
                        this.architecture[key] = tmp ? Var_1.default.parseStr(tmp) : tmp;
                    }
                    // @ts-ignore
                    this.architecture[key] = this.architecture[key] === '' || this.architecture[key] === 'undefined' || this.architecture[key] === 'null' ? null : this.architecture[key];
                }
                else if (Array.isArray(value)) {
                }
                else // @ts-ignore
                    this.architecture[key] = this.architecture[key] === '' || this.architecture[key] === 'undefined' || this.architecture[key] === 'null' ? null : this.architecture[key];
            }
        }
    }
    async readAskedVariables() {
        const keys = { ...buildableKeys };
        const readKeys = {};
        for (const key of Object.keys(keys)) {
            // @ts-ignore
            if (this.architecture[`ask-${key}`]) {
                // @ts-ignore
                readKeys[key] = keys[key];
            }
        }
        if (Object.keys(readKeys).length) {
            this.architecture = {
                ...this.architecture,
                ...(await (0, Reader_1.Input)(readKeys))
            };
        }
    }
    async resolve() {
        return {
            title: this.architecture.title,
            description: this.architecture.description,
            assets: this.architecture.assets,
            flows: await this.bashStub.resolveFlows(this.architecture.flows),
            cwd: this.architecture.cwd,
            user: this.architecture.user,
            pass: this.architecture.pass,
            host: this.architecture.host,
            port: this.architecture.port,
            "private-key": !!this.architecture["private-key"] ? File_1.default.read({ path: this.architecture["private-key"] }) : undefined,
            passphrase: this.architecture.passphrase,
            log: this.architecture.log,
            "log-dir": this.architecture["log-dir"],
        };
    }
    static async of(base, architecture, env) {
        (0, node_assert_1.default)(Directory_1.default.exists({ path: base }), `base directory not found(${base}).`);
        const path = (0, path_1.joinPaths)(base, 'architecture', architecture + '.json');
        (0, node_assert_1.default)(Directory_1.default.exists({ path }), `architecture not found(${path}).`);
        const baseStub = await BashStub_1.default.of(base, env);
        const assetsPath = (0, path_1.joinPaths)(base, 'assets');
        (0, node_assert_1.default)(Directory_1.default.exists({ path }), `assets directory not found(${assetsPath}).`);
        return await new Architecture(File_1.default.readJson({ path }), baseStub, assetsPath);
    }
}
exports.default = Architecture;
__decorate([
    (0, validateProps_1.default)({
        type: 'object',
        properties: {
            title: {
                type: 'string',
                minLength: 1,
                maxLength: 255,
            },
            description: {
                type: 'string',
                minLength: 1,
                maxLength: 255,
            },
            assets: {
                type: 'string',
                minLength: 1,
                maxLength: 1000,
                nullable: true,
            },
            flows: {
                type: 'array',
                minItems: 1,
                maxItems: 20,
                items: {
                    type: 'array',
                    minItems: 1,
                    maxItems: 50,
                    items: {
                        type: 'string',
                        minLength: 1,
                        maxLength: 255,
                    }
                }
            },
            cwd: {
                type: 'string',
                maxLength: 1000,
                nullable: true,
            },
            "ask-cwd": {
                type: 'boolean',
                nullable: true,
            },
            user: {
                type: 'string',
                maxLength: 1000,
                nullable: true,
            },
            "ask-user": {
                type: 'boolean',
                nullable: true,
            },
            pass: {
                type: 'string',
                maxLength: 1000,
                nullable: true,
            },
            "ask-pass": {
                type: 'boolean',
                nullable: true,
            },
            host: {
                type: 'string',
                maxLength: 1000,
                nullable: true,
                default: 'localhost'
            },
            "ask-host": {
                type: 'boolean',
                nullable: true,
            },
            port: {
                type: 'number',
                maxLength: 1000,
                nullable: true,
                default: 22
            },
            "ask-port": {
                type: 'boolean',
                nullable: true
            },
            "private-key": {
                type: 'string',
                maxLength: 1000,
                nullable: true,
            },
            "ask-private-key": {
                type: 'boolean',
                nullable: true,
            },
            passphrase: {
                type: 'string',
                maxLength: 1000,
                nullable: true,
            },
            "ask-passphrase": {
                type: 'boolean',
                nullable: true,
            },
            log: {
                type: 'string',
                maxLength: 1000,
                nullable: true,
            },
            "ask-log": {
                type: 'boolean',
                nullable: true,
            },
            "log-dir": {
                type: 'string',
                maxLength: 1000,
                nullable: true,
            },
            "ask-log-dir": {
                type: 'boolean',
                nullable: true,
            },
        },
        required: [
            'title',
            'description',
            'flows'
        ],
        additionalProperties: false
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], Architecture.prototype, "validate", null);
