import {Command} from "ecli-base/dist/src/lib/command/Command";
import {joinPaths} from "ecli-base/dist/src/lib/helper/path";
import Deployment from "../lib/Deployment/Deployment";
import * as crypto from "node:crypto";
import path from "node:path";

export default class make extends Command {
    async zip(args: {
        base?: string,
        name: string
    }) {
        const basePath = joinPaths(!!args.base ? args.base : './');
        const deployment = await Deployment.of(basePath, args.name);
        return await deployment.zip();
    }
    async index(args: {
        base?: string,
        name: string
    }) {
        return await this.zip(args);
    }
    async dir(args: {
        base?: string,
        name: string
    }) {
        const basePath = joinPaths(!!args.base ? args.base : './');
        const deployment = await Deployment.of(basePath, args.name);
        return await deployment.save();
    }

}