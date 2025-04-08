"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Command_1 = require("ecli-base/dist/src/lib/command/Command");
const Deploy_1 = __importDefault(require("../lib/Deployment/Deploy"));
class repo extends Command_1.Command {
    async index(args) {
        var _a, _b, _c;
        const deploy = new Deploy_1.default({
            deployment: (_a = args === null || args === void 0 ? void 0 : args.name) !== null && _a !== void 0 ? _a : 'server-setup.1.0.0',
            nodeVersion: (_b = args === null || args === void 0 ? void 0 : args.nodeVersion) !== null && _b !== void 0 ? _b : '20.14.0',
            base: (_c = args === null || args === void 0 ? void 0 : args.base) !== null && _c !== void 0 ? _c : './',
        });
        try {
            await deploy.start();
            await deploy.deployRepo();
        }
        catch (e) {
        }
        finally {
            await deploy.close();
        }
    }
}
exports.default = repo;
