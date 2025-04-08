import File from "ecli-base/dist/src/lib/sys/File";
import Directory from "ecli-base/dist/src/lib/sys/Directory";
import assert from "node:assert";
import {SFTPRunner} from "../Runner/SFTPRunner";
import {joinPaths} from "ecli-base/dist/src/lib/helper/path";
import {CommandReturnType, SSHRunner} from "../Runner/SSHRunner";


export default class DeployServer {


    constructor(protected readonly ssh: SSHRunner, protected readonly sftp: SFTPRunner | undefined, protected readonly props: {
        cwd: string
    }) {
    }



    async start() {


    }


}