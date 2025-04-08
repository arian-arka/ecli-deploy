import {Command} from "ecli-base/dist/src/lib/command/Command";
import {joinPaths} from "ecli-base/dist/src/lib/helper/path";
import Deployment from "../lib/Deployment/Deployment";
import * as crypto from "node:crypto";
import {Input} from "../lib/Reader";
import Directory from "ecli-base/dist/src/lib/sys/Directory";
import Terminal from "ecli-base/dist/src/lib/sys/Terminal";
import Deploy from "../lib/Deployment/Deploy";

export default class repo extends Command {

    async index(args: {
        base?: string,
        name: string,
        nodeVersion?: string,
    }) {
        const deploy = new Deploy({
            deployment: args?.name ?? 'server-setup.1.0.0',
            nodeVersion: args?.nodeVersion ?? '20.14.0',
            base: args?.base ?? './',
        });
        try {
            await deploy.start();
            await deploy.deployEcliRepo();
        } catch (e) {

        } finally {
            await deploy.close();
        }
    }

}