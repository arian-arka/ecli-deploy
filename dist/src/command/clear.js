"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Command_1 = require("ecli-base/dist/src/lib/command/Command");
const path_1 = require("ecli-base/dist/src/lib/helper/path");
const Reader_1 = require("../lib/Reader");
const Directory_1 = __importDefault(require("ecli-base/dist/src/lib/sys/Directory"));
class make extends Command_1.Command {
    async index(args) {
        const basePath = (0, path_1.joinPaths)(!!args.base ? args.base : './');
        const { sure } = await (0, Reader_1.Input)({
            "sure": {
                type: "string",
                nullable: true,
                question: 'Are you Sure ?(y/yes/n/no, def:yes)'
            }
        });
        if (!['yes', 'y'].includes((!!sure ? sure : 'yes').toLowerCase()))
            return;
        if (!!args.dist) {
            if (args.dist === true)
                Directory_1.default.delete({ path: (0, path_1.joinPaths)(basePath, 'dist') });
            // else
            //     Terminal(`rm -rf ${joinPaths(basePath,'dist',args.dist)}`);
            if (!Directory_1.default.exists({ path: (0, path_1.joinPaths)(basePath, 'dist') }))
                Directory_1.default.create({ path: (0, path_1.joinPaths)(basePath, 'dist') });
        }
    }
}
exports.default = make;
