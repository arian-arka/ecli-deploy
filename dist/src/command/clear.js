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
const Directory_1 = __importDefault(require("ecli-base/dist/src/lib/sys/Directory"));
const terminal_1 = __importDefault(require("ecli-base/dist/src/decorator/terminal"));
const validateProps_1 = __importDefault(require("ecli-base/dist/src/decorator/validateProps"));
class clear extends Command_1.Command {
    async log(args) {
        const path = (0, path_1.joinPaths)(!!args.base ? args.base : './', 'log');
        Directory_1.default.delete({ path });
    }
    async result(args) {
        const path = (0, path_1.joinPaths)(!!args.base ? args.base : './', 'result');
        Directory_1.default.delete({ path });
    }
    async index(args) {
        return 'clear';
        // const basePath = joinPaths(!!args.base ? args.base : './');
        // const {sure} = await Input({
        //     "sure":{
        //         type:"string",
        //         nullable:true,
        //         question : 'Are you Sure ?(y/yes/n/no, def:yes)'
        //     }
        // });
        //
        // if(!['yes','y'].includes((!!sure ? sure  : 'yes').toLowerCase()))
        //     return;
        // if(!!args.dist){
        //     if(args.dist === true)
        //         Directory.delete({path:joinPaths(basePath,'dist')});
        //     // else
        //     //     Terminal(`rm -rf ${joinPaths(basePath,'dist',args.dist)}`);
        //
        //     if(!Directory.exists({path:joinPaths(basePath,'dist')}))
        //         Directory.create({path:joinPaths(basePath,'dist')});
        // }
    }
}
exports.default = clear;
__decorate([
    (0, terminal_1.default)({
        description: 'clears log files',
        paras: {
            base: {
                description: "specify the base directory",
                example: "base:test-deploy"
            },
        },
    }),
    (0, validateProps_1.default)({
        type: "object",
        properties: {
            base: { type: 'string', maxLength: 500, nullable: true, default: './' }
        },
        required: [],
        additionalProperties: false
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], clear.prototype, "log", null);
__decorate([
    (0, terminal_1.default)({
        description: 'clears result files',
        paras: {
            base: {
                description: "specify the base directory",
                example: "base:test-deploy"
            },
        },
    }),
    (0, validateProps_1.default)({
        type: "object",
        properties: {
            base: { type: 'string', maxLength: 500, nullable: true, default: './' }
        },
        required: [],
        additionalProperties: false
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], clear.prototype, "result", null);
