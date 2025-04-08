"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Command_1 = require("ecli-base/dist/src/lib/command/Command");
const path_1 = require("ecli-base/dist/src/lib/helper/path");
const Deployment_1 = __importDefault(require("../lib/Deployment/Deployment"));
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
