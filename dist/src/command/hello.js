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
class hello extends Command_1.Command {
    /*@validateProps<Parameters<InstanceType<typeof hello>['index']>[0]>({
        type: "object",
        properties: {
        },
        required: [],
        additionalProperties: false
    })*/
    async index(args) {
        return 'hello world from ecli deploy';
    }
}
exports.default = hello;
__decorate([
    (0, terminal_1.default)({
        description: 'Hello world from ecli-deploy',
        paras: {
            filter: {
                description: "a javascript arrow function that returns boolean ",
                example: "(req) => req.uri.startsWith('api')"
            },
            withPrefix: {
                description: 'boolean - filter endpoints that have prefix - default is "api@any"',
            },
            withoutPrefix: {
                description: "boolean - filter endpoints that dont have prefix - default is null",
            },
            api: {
                description: "uri of request docs - the default is in the example",
                example: "http://127.0.0.1:8000/request-docs/api?json=true&showGet=true&showPost=true&showDelete=true&showPut=true&showPatch=true&showHead=false&sort=default&groupby=default"
            },
            show: {
                description: "boolean - print output in stdout - default is false",
            },
            out: {
                description: "specify a file to write the output - it will rewrite if the file already exists",
            },
        },
    })
    /*@validateProps<Parameters<InstanceType<typeof hello>['index']>[0]>({
        type: "object",
        properties: {
        },
        required: [],
        additionalProperties: false
    })*/
    ,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], hello.prototype, "index", null);
