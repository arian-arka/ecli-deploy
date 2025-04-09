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
const path_1 = require("ecli-base/dist/src/lib/helper/path");
const Deployment_1 = __importDefault(require("../lib/Deployment/Deployment"));
const terminal_1 = __importDefault(require("ecli-base/dist/src/decorator/terminal"));
const validateProps_1 = __importDefault(require("ecli-base/dist/src/decorator/validateProps"));
class make extends Command_1.Command {
    async zip(args) {
        const basePath = (0, path_1.joinPaths)(!!args.base ? args.base : './');
        const deployment = await Deployment_1.default.of(basePath, args.name);
        return await deployment.zip();
    }
    async index(args) {
        return await this.dir(args);
    }
    async dir(args) {
        const basePath = (0, path_1.joinPaths)(!!args.base ? args.base : './');
        const deployment = await Deployment_1.default.of(basePath, args.name);
        return await deployment.save();
    }
}
exports.default = make;
__decorate([
    (0, terminal_1.default)({
        description: 'builds the deployment and saves it as a zip file in dist directory. (file name would be <deployment name>.<version>) example: front-end.1.0.0.zip',
        paras: {
            base: {
                description: "specify the base directory",
                example: "base:test"
            },
            name: {
                description: "name of the deployment",
                example: "base:front-end"
            },
        },
    }),
    (0, validateProps_1.default)({
        type: "object",
        properties: {
            base: { type: 'string', maxLength: 500, nullable: true, default: './' },
            name: { type: 'string', maxLength: 500 },
        },
        required: ['name'],
        additionalProperties: false
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], make.prototype, "zip", null);
__decorate([
    (0, terminal_1.default)({
        description: 'builds the deployment and saves it in dist directory. (file name would be <deployment name>.<version>) example: front-end.1.0.0',
        paras: {
            base: {
                description: "specify the base directory",
                example: "base:test"
            },
            name: {
                description: "name of the deployment",
                example: "base:front-end"
            },
        },
    }),
    (0, validateProps_1.default)({
        type: "object",
        properties: {
            base: { type: 'string', maxLength: 500, nullable: true, default: './' },
            name: { type: 'string', maxLength: 500 },
        },
        required: ['name'],
        additionalProperties: false
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], make.prototype, "index", null);
__decorate([
    (0, terminal_1.default)({
        description: 'builds the deployment and saves it in dist directory. (file name would be <deployment name>.<version>) example: front-end.1.0.0',
        paras: {
            base: {
                description: "specify the base directory",
                example: "base:test"
            },
            name: {
                description: "name of the deployment",
                example: "base:front-end"
            },
        },
    }),
    (0, validateProps_1.default)({
        type: "object",
        properties: {
            base: { type: 'string', maxLength: 500, nullable: true, default: './' },
            name: { type: 'string', maxLength: 500 },
        },
        required: ['name'],
        additionalProperties: false
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], make.prototype, "dir", null);
