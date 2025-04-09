import {Command} from "ecli-base/dist/src/lib/command/Command";
import {joinPaths} from "ecli-base/dist/src/lib/helper/path";
import Deployment from "../lib/Deployment/Deployment";
import * as crypto from "node:crypto";
import path from "node:path";
import terminal from "ecli-base/dist/src/decorator/terminal";
import validateProps from "ecli-base/dist/src/decorator/validateProps";

export default class make extends Command {
    @terminal({
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
    })

    @validateProps<Parameters<InstanceType<typeof make>['zip']>[0]>({
        type: "object",
        properties: {
            base:{type:'string',maxLength:500,nullable:true,default:'./'},
            name:{type:'string',maxLength:500},
        },
        required: ['name'],
        additionalProperties: false
    })
    async zip(args: {
        base?: string,
        name: string
    }) {
        const basePath = joinPaths(!!args.base ? args.base : './');
        const deployment = await Deployment.of(basePath, args.name);
        return await deployment.zip();
    }
    @terminal({
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
    })

    @validateProps<Parameters<InstanceType<typeof make>['index']>[0]>({
        type: "object",
        properties: {
            base:{type:'string',maxLength:500,nullable:true,default:'./'},
            name:{type:'string',maxLength:500},
        },
        required: ['name'],
        additionalProperties: false
    })
    async index(args: {
        base?: string,
        name: string
    }) {
        return await this.dir(args);
    }
    @terminal({
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
    })

    @validateProps<Parameters<InstanceType<typeof make>['dir']>[0]>({
        type: "object",
        properties: {
            base:{type:'string',maxLength:500,nullable:true,default:'./'},
            name:{type:'string',maxLength:500},
        },
        required: ['name'],
        additionalProperties: false
    })
    async dir(args: {
        base?: string,
        name: string
    }) {
        const basePath = joinPaths(!!args.base ? args.base : './');
        const deployment = await Deployment.of(basePath, args.name);
        return await deployment.save();
    }


}