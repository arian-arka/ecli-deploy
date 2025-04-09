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
const Command_1 = require("ecli-base/dist/src/lib/command/Command");
const terminal_1 = __importDefault(require("ecli-base/dist/src/decorator/terminal"));
const validateProps_1 = __importDefault(require("ecli-base/dist/src/decorator/validateProps"));
const DeployServer_1 = __importDefault(require("../lib/Deployment/DeployServer"));
class server extends Command_1.Command {
    async install(args) {
        const deploy = new DeployServer_1.default(args);
        let error = false;
        try {
            await deploy.start();
            await deploy.install();
        }
        catch (e) {
            error = e;
        }
        finally {
            await deploy.close();
        }
        if (error)
            throw error;
        return true;
    }
    async send(args) {
        var _a;
        const deploy = new DeployServer_1.default(args);
        let error = false;
        try {
            await deploy.start();
            await deploy.send(args.name, (_a = args.force) !== null && _a !== void 0 ? _a : false);
        }
        catch (e) {
            error = e;
        }
        finally {
            await deploy.close();
        }
        if (error)
            throw error;
        return true;
    }
    async remove(args) {
        const deploy = new DeployServer_1.default(args);
        let error = false;
        try {
            await deploy.start();
            await deploy.remove(args.name);
        }
        catch (e) {
            error = e;
        }
        finally {
            await deploy.close();
        }
        if (error)
            throw error;
        return true;
    }
    async run(args) {
        const deploy = new DeployServer_1.default(args);
        let error = false;
        try {
            await deploy.start();
            await deploy.run(args.name);
        }
        catch (e) {
            error = e;
        }
        finally {
            await deploy.close();
        }
        if (error)
            throw error;
        return true;
    }
    async result(args) {
        const deploy = new DeployServer_1.default(args);
        let error = false;
        try {
            await deploy.start();
            await deploy.result(args.name);
        }
        catch (e) {
            error = e;
        }
        finally {
            await deploy.close();
        }
        if (error)
            throw error;
        return true;
    }
    async index(args) {
        return true;
    }
}
exports.default = server;
__decorate([
    (0, terminal_1.default)({
        description: 'Installs ecli dependencies for a deployment on the deployer server.(curl, git, nvm, nodejs, ecli, ecli-base, ecli-deploy and required directories in $HOME/.ecli-deploy)',
        paras: {
            base: {
                description: "specify the base directory",
                example: "base:test"
            },
            name: {
                description: "name of the deployment",
                example: "base:front-end"
            },
            "nvm-version": {
                description: "version of nvm.(default: 0.40.2)",
                example: "nvm-version:0.40.2"
            },
            "node-version": {
                description: "version of nodejs.(default: 20.14.0)",
                example: "node-version:20.14.0"
            },
            "remote": {
                description: "remote server parameters(cwd, host, username, password, private_key, passphrase, port). its json",
                example: `"remote:json:{"host":"127.0.0.1", "cwd":"~", "username":"root", "password":"toor", "port":22, "passphrase":"passphrase", "private_key_file" :"~/.ssh/id_ed25519.pub"}"`
            }
        },
    }),
    (0, validateProps_1.default)({
        type: "object",
        properties: {
            base: { type: 'string', maxLength: 500, nullable: true, default: './' },
            nodeVersion: { type: 'string', maxLength: 500, nullable: true, default: '20.14.0' },
            nvmVersion: { type: 'string', maxLength: 500, nullable: true, default: '0.40.2' },
            remote: {
                type: 'object',
                nullable: true,
                properties: {
                    cwd: { type: 'string', maxLength: 500, nullable: true, default: '~' },
                    host: { type: 'string', maxLength: 500, nullable: true, default: '127.0.0.1' },
                    username: { type: 'string', maxLength: 500, nullable: true, default: 'root' },
                    password: { type: 'string', maxLength: 500, nullable: true },
                    private_key: { type: 'string', maxLength: 5000, nullable: true },
                    private_key_file: { type: 'string', maxLength: 5000, nullable: true },
                    passphrase: { type: 'string', maxLength: 500, nullable: true },
                    port: { type: 'integer', minimum: 0, maximum: 65000, nullable: true, default: 22 },
                },
                required: [],
                additionalProperties: false,
            }
        },
        required: [],
        additionalProperties: false
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], server.prototype, "install", null);
__decorate([
    (0, terminal_1.default)({
        description: 'Send a built deployment to server',
        paras: {
            base: {
                description: "specify the base directory",
                example: "base:test"
            },
            name: {
                description: "name of the deployment",
                example: "base:front-end"
            },
            force: {
                description: "rewrite if it already exists",
                example: "force:true"
            },
            "remote": {
                description: "remote server parameters(cwd, host, username, password, private_key, passphrase, port). its json",
                example: `"remote:json:{"host":"127.0.0.1", "cwd":"~", "username":"root", "password":"toor", "port":22, "passphrase":"passphrase", "private_key_file" :"~/.ssh/id_ed25519.pub"}"`
            }
        },
    }),
    (0, validateProps_1.default)({
        type: "object",
        properties: {
            base: { type: 'string', maxLength: 500, nullable: true, default: './' },
            nodeVersion: { type: 'string', maxLength: 500, nullable: true, default: '20.14.0' },
            nvmVersion: { type: 'string', maxLength: 500, nullable: true, default: '0.40.2' },
            name: { type: 'string', maxLength: 500 },
            force: { type: 'boolean', nullable: true, default: false },
            remote: {
                type: 'object',
                nullable: true,
                properties: {
                    cwd: { type: 'string', maxLength: 500, nullable: true, default: '~' },
                    host: { type: 'string', maxLength: 500, nullable: true, default: '127.0.0.1' },
                    username: { type: 'string', maxLength: 500, nullable: true, default: 'root' },
                    password: { type: 'string', maxLength: 500, nullable: true },
                    private_key: { type: 'string', maxLength: 5000, nullable: true },
                    private_key_file: { type: 'string', maxLength: 5000, nullable: true },
                    passphrase: { type: 'string', maxLength: 500, nullable: true },
                    port: { type: 'integer', minimum: 0, maximum: 65000, nullable: true, default: 22 },
                },
                required: [],
                additionalProperties: false,
            }
        },
        required: ['name'],
        additionalProperties: false
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], server.prototype, "send", null);
__decorate([
    (0, terminal_1.default)({
        description: "removes a deployment from server",
        paras: {
            base: {
                description: "specify the base directory",
                example: "base:test"
            },
            name: {
                description: "name of the deployment",
                example: "base:front-end"
            },
            "remote": {
                description: "remote server parameters(cwd, host, username, password, private_key, passphrase, port). its json",
                example: `"remote:json:{"host":"127.0.0.1", "cwd":"~", "username":"root", "password":"toor", "port":22, "passphrase":"passphrase", "private_key_file" :"~/.ssh/id_ed25519.pub"}"`
            }
        },
    }),
    (0, validateProps_1.default)({
        type: "object",
        properties: {
            base: { type: 'string', maxLength: 500, nullable: true, default: './' },
            nodeVersion: { type: 'string', maxLength: 500, nullable: true, default: '20.14.0' },
            nvmVersion: { type: 'string', maxLength: 500, nullable: true, default: '0.40.2' },
            name: { type: 'string', maxLength: 500 },
            remote: {
                type: 'object',
                nullable: true,
                properties: {
                    cwd: { type: 'string', maxLength: 500, nullable: true, default: '~' },
                    host: { type: 'string', maxLength: 500, nullable: true, default: '127.0.0.1' },
                    username: { type: 'string', maxLength: 500, nullable: true, default: 'root' },
                    password: { type: 'string', maxLength: 500, nullable: true },
                    private_key: { type: 'string', maxLength: 5000, nullable: true },
                    private_key_file: { type: 'string', maxLength: 5000, nullable: true },
                    passphrase: { type: 'string', maxLength: 500, nullable: true },
                    port: { type: 'integer', minimum: 0, maximum: 65000, nullable: true, default: 22 },
                },
                required: [],
                additionalProperties: false,
            }
        },
        required: ['name'],
        additionalProperties: false
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], server.prototype, "remove", null);
__decorate([
    (0, terminal_1.default)({
        description: "Runs a deployment on the server",
        paras: {
            name: {
                description: "name of the deployment",
                example: "base:front-end"
            },
            "remote": {
                description: "remote server parameters(cwd, host, username, password, private_key, passphrase, port). its json",
                example: `"remote:json:{"host":"127.0.0.1", "cwd":"~", "username":"root", "password":"toor", "port":22, "passphrase":"passphrase", "private_key_file" :"~/.ssh/id_ed25519.pub"}"`
            }
        },
    }),
    (0, validateProps_1.default)({
        type: "object",
        properties: {
            base: { type: 'string', maxLength: 500, nullable: true, default: './' },
            nodeVersion: { type: 'string', maxLength: 500, nullable: true, default: '20.14.0' },
            nvmVersion: { type: 'string', maxLength: 500, nullable: true, default: '0.40.2' },
            name: { type: 'string', maxLength: 500 },
            remote: {
                type: 'object',
                nullable: true,
                properties: {
                    cwd: { type: 'string', maxLength: 500, nullable: true, default: '~' },
                    host: { type: 'string', maxLength: 500, nullable: true, default: '127.0.0.1' },
                    username: { type: 'string', maxLength: 500, nullable: true, default: 'root' },
                    password: { type: 'string', maxLength: 500, nullable: true },
                    private_key: { type: 'string', maxLength: 5000, nullable: true },
                    private_key_file: { type: 'string', maxLength: 5000, nullable: true },
                    passphrase: { type: 'string', maxLength: 500, nullable: true },
                    port: { type: 'integer', minimum: 0, maximum: 65000, nullable: true, default: 22 },
                },
                required: [],
                additionalProperties: false,
            }
        },
        required: ['name'],
        additionalProperties: false
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], server.prototype, "run", null);
__decorate([
    (0, terminal_1.default)({
        description: "Reads results from a ran deployment",
        paras: {
            name: {
                description: "name of the deployment",
                example: "base:front-end"
            },
            "remote": {
                description: "remote server parameters(cwd, host, username, password, private_key, passphrase, port). its json",
                example: `"remote:json:{"host":"127.0.0.1", "cwd":"~", "username":"root", "password":"toor", "port":22, "passphrase":"passphrase", "private_key_file" :"~/.ssh/id_ed25519.pub"}"`
            }
        },
    }),
    (0, validateProps_1.default)({
        type: "object",
        properties: {
            base: { type: 'string', maxLength: 500, nullable: true, default: './' },
            nodeVersion: { type: 'string', maxLength: 500, nullable: true, default: '20.14.0' },
            nvmVersion: { type: 'string', maxLength: 500, nullable: true, default: '0.40.2' },
            name: { type: 'string', maxLength: 500 },
            remote: {
                type: 'object',
                nullable: true,
                properties: {
                    cwd: { type: 'string', maxLength: 500, nullable: true, default: '~' },
                    host: { type: 'string', maxLength: 500, nullable: true, default: '127.0.0.1' },
                    username: { type: 'string', maxLength: 500, nullable: true, default: 'root' },
                    password: { type: 'string', maxLength: 500, nullable: true },
                    private_key: { type: 'string', maxLength: 5000, nullable: true },
                    private_key_file: { type: 'string', maxLength: 5000, nullable: true },
                    passphrase: { type: 'string', maxLength: 500, nullable: true },
                    port: { type: 'integer', minimum: 0, maximum: 65000, nullable: true, default: 22 },
                },
                required: [],
                additionalProperties: false,
            }
        },
        required: ['name'],
        additionalProperties: false
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], server.prototype, "result", null);
__decorate([
    (0, terminal_1.default)({
        description: 'This command is used to make the deployment server and run the deployment on that.',
        paras: {},
    }),
    (0, validateProps_1.default)({
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], server.prototype, "index", null);
