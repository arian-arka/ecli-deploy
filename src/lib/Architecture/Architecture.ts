import validateProps from "ecli-base/dist/src/decorator/validateProps";
import assert from "node:assert";
import {Input, InputArgsType} from "../Reader";
import BashStub, {ResolvedFlowType} from "../Bash/BashStub";
import Directory from "ecli-base/dist/src/lib/sys/Directory";
import {joinPaths} from "ecli-base/dist/src/lib/helper/path";
import File from "ecli-base/dist/src/lib/sys/File";
import Var from "ecli-base/dist/src/lib/var/Var";

type ArchitectureType = {
    title: string,
    description: string,
    assets?: string,
    flows: (string[])[],
    "cwd"?: string,
    "ask-cwd"?: boolean,
    "username"?: string,
    "ask-username"?: boolean,
    "password"?: string,
    "ask-password"?: boolean,
    "host"?: string,
    "ask-host"?: boolean,
    "port"?: number,
    "ask-port"?: boolean,
    "private-key"?: string,
    "ask-private-key"?: boolean,
    "passphrase"?: string,
    "ask-passphrase"?: boolean,
    "log"?: string,
    "ask-log"?: boolean,
    "log-dir"?: string,
    "ask-log-dir"?: boolean
}

export type ResolvedArchitectureType = {
    title: string,
    description: string,
    assets?: string,
    flows: (ResolvedFlowType[])[],
    "cwd"?: string,
    "username"?: string,
    "password"?: string,
    "host"?: string,
    "port"?: number,
    "private-key"?: string,
    "passphrase"?: string,
    "log"?: string,
    "log-dir"?: string,
}

const buildableKeys: InputArgsType = {
    "cwd": {
        type: "string",
        nullable: true,
        question: "cwd: ",
    },
    "username": {
        type: "string",
        nullable: true,
        question: "username: ",
    },
    "password": {
        type: "string",
        nullable: true,
        question: "password: ",
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

export default class Architecture {
    constructor(private architecture: ArchitectureType, private readonly bashStub: BashStub, private readonly assetsPath: string) {
        assert(!(!!architecture.assets) || Directory.exists({path: joinPaths(this.assetsPath, architecture.assets ?? '')}), `asset (${architecture.assets}) not found.`);

        return (async (): Promise<Architecture> => {
            await this.makeStubVariables();
            await this.readAskedVariables();
            this.validate(this.architecture);
            return this;
        })() as unknown as Architecture;
    }

    @validateProps<ArchitectureType>({
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

            username: {
                type: 'string',
                maxLength: 1000,
                nullable: true,
            },
            "ask-username": {
                type: 'boolean',
                nullable: true,
            },

            password: {
                type: 'string',
                maxLength: 1000,
                nullable: true,
            },
            "ask-password": {
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
    })
    private validate(architecture: ArchitectureType) {
        assert(!!architecture.cwd, 'cwd is required');
        assert(!!architecture.host, 'host is required');

        if (!['localhost', '127.0.0.1'].includes(architecture.host ?? '')) {
            assert(!!architecture.username, 'username is required');
            assert(!!architecture.password || !!architecture["private-key"], 'password or private-key is required');
        }

        assert(!!architecture.log, 'log is required');
        assert(!!architecture['log-dir'], 'log-dir is required');
    }

    private async makeStubVariables() {
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
                    this.architecture[key] = (await this.bashStub.make([this.architecture[key]]))[0] as string;
                    if (buildableKeys[key].type !== 'string') {
                        // @ts-ignore
                        const tmp = this.architecture[key]?.trim();
                        // @ts-ignore
                        this.architecture[key] = tmp ? Var.parseStr(tmp) : tmp;
                    }
                    // @ts-ignore
                    this.architecture[key] = this.architecture[key] === '' || this.architecture[key] === 'undefined' || this.architecture[key] === 'null' ? null : this.architecture[key];

                } else if (Array.isArray(value)) {

                } else // @ts-ignore
                    this.architecture[key] = this.architecture[key] === '' || this.architecture[key] === 'undefined' || this.architecture[key] === 'null' ? null : this.architecture[key];

            }
        }
    }

    private async readAskedVariables() {
        const keys: InputArgsType = {...buildableKeys};
        const readKeys: InputArgsType = {};
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
                ...(await Input(readKeys))
            };
        }

    }

    public async resolve(): Promise<ResolvedArchitectureType> {
        return {
            title: this.architecture.title,
            description: this.architecture.description,
            assets : this.architecture.assets,
            flows: await this.bashStub.resolveFlows(this.architecture.flows),
            cwd: this.architecture.cwd,
            username: this.architecture.username,
            password: this.architecture.password,
            host: this.architecture.host,
            port: this.architecture.port,
            "private-key": !!this.architecture["private-key"] ? File.read({path : this.architecture["private-key"]}) : undefined,
            passphrase: this.architecture.passphrase,
            log: this.architecture.log,
            "log-dir": this.architecture["log-dir"],
        };
    }

    public static async of(base: string, architecture: string, env: string) {
        assert(Directory.exists({path: base}), `base directory not found(${base}).`);
        const path = joinPaths(base, 'architecture', architecture + '.json');
        assert(Directory.exists({path}), `architecture not found(${path}).`);

        const baseStub = await BashStub.of(base, env);

        const assetsPath = joinPaths(base, 'assets');
        assert(Directory.exists({path}), `assets directory not found(${assetsPath}).`);

        return await new Architecture(
            File.readJson({path}) as any,
            baseStub,
            assetsPath
        );
    }
}