"use strict";
/*
import {Command} from "ecli-base/dist/src/lib/command/Command";
import {joinPaths} from "ecli-base/dist/src/lib/helper/path";
import Deployment, {DeploymentType} from "../lib/Deployment/Deployment";
import * as crypto from "node:crypto";
import fs from "fs";
import {Input} from "../lib/Reader";
import assert from "node:assert";
import File from "ecli-base/dist/src/lib/sys/File";
import Directory from "ecli-base/dist/src/lib/sys/Directory";

import {extract} from "zip-lib";
import Deploy from "../lib/Deployment/Deploy";
import {debugLog} from "../lib/Logger/Logger";
import make from "./make";

export default class run extends Command {

    private async readPath(args: {
        name: string,
        latest?: boolean,
        tag?: string,
    }) {
        const distPath = joinPaths('./', 'dist');
        let zipPath: string = '';
        if (!!args.tag) {
            const list = fs.readdirSync(distPath, {encoding: 'utf-8'}).sort().reverse();
            for (const f of list) {
                const [tag, name, ...versionNumbers] = f.split('.');
                if (tag === args.tag) {
                    zipPath = f;
                    break;
                }
            }
        } else if (!!args.latest) {
            const list = fs.readdirSync(distPath, {encoding: 'utf-8'}).sort().reverse();
            for (const f of list) {
                const [tag, name, ...versionNumbers] = f.split('.');
                if (name === args.name) {
                    zipPath = f;
                    break;
                }
            }
        } else {
            const list = fs.readdirSync(distPath, {encoding: 'utf-8'}).sort().reverse();
            for (const f of list) {
                const [tag, name, ...versionNumbers] = f.split('.');
                const version = versionNumbers.slice(0,versionNumbers.length - 1).join('.');
                console.log(`version: ${version}`);
                console.log(`tag: ${tag}`);
                const input = await Input({
                    'prompt': {
                        nullable: true,
                        type: 'string',
                        question: `Pick this one? (yes - y - leave empty to continue)`
                    }
                });
                if (['y', 'yes'].includes(input.prompt.toLowerCase())) {
                    zipPath = f;
                    break;
                }
            }
        }

        assert(!!zipPath, 'No Deployment selected');

        let tmp = zipPath.split('.zip');
        tmp = tmp.slice(0, tmp.length - 1);
        const dirName = tmp.join();
        const zipTarget = joinPaths(distPath, dirName);
        const zipSrc = joinPaths(distPath, zipPath);
        if (Directory.exists({path: zipTarget}))
            Directory.delete({path: zipTarget});




        return {zipSrc, zipTarget,deploymentName : tmp.join()};
    }

    async index(args: {
        name: string,
        latest?: boolean,
        tag?: string,
        remote: {
            user?: string,
            pass?: string,
            host?: string,
            port?: number,
            private_key?: string,
            passphrase?: string,
            cwd?: string
        },
        debug?:boolean,
        make?:boolean,

    }) {
        if(args.make){
            args.tag = (await (new make).index({name:args.name})).split('.zip')[0].split(`.${args.name}`)[0].split('dist/')[1];
            console.log(args.tag);
        }
        debugLog(args.debug ?? true);

        const {zipSrc, zipTarget,deploymentName} = await this.readPath(args);
        //zipTarget dist path

        await extract(zipSrc, zipTarget);

        const deploy = new Deploy({
            deployment: File.readJson({path: joinPaths(zipTarget, `${args.name}.json`)}) as DeploymentType,
            base: zipTarget,
            remote: args.remote,
            logBase : joinPaths('./','logs',deploymentName)
        });

        try {
            const result = await deploy.start();
            return result;
        } catch (e) {
            return e;
        }
    }

}*/
