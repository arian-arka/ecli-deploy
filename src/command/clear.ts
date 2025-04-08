import {Command} from "ecli-base/dist/src/lib/command/Command";
import {joinPaths} from "ecli-base/dist/src/lib/helper/path";
import Deployment from "../lib/Deployment/Deployment";
import * as crypto from "node:crypto";
import {Input} from "../lib/Reader";
import Directory from "ecli-base/dist/src/lib/sys/Directory";
import Terminal from "ecli-base/dist/src/lib/sys/Terminal";

export default class make extends Command {
    async log(args: {
        base?: string,
    }) {
        const path = joinPaths(!!args.base ? args.base : './','log');
        Directory.delete({path})
    }
    async index(args: {
        base?: string,
        dist?: boolean|string,

    }) {
        const basePath = joinPaths(!!args.base ? args.base : './');
        const {sure} = await Input({
            "sure":{
                type:"string",
                nullable:true,
                question : 'Are you Sure ?(y/yes/n/no, def:yes)'
            }
        });

        if(!['yes','y'].includes((!!sure ? sure  : 'yes').toLowerCase()))
            return;
        if(!!args.dist){
            if(args.dist === true)
                Directory.delete({path:joinPaths(basePath,'dist')});
            // else
            //     Terminal(`rm -rf ${joinPaths(basePath,'dist',args.dist)}`);

            if(!Directory.exists({path:joinPaths(basePath,'dist')}))
                Directory.create({path:joinPaths(basePath,'dist')});
        }
    }

}