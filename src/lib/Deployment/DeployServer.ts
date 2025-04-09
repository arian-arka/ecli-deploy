import File from "ecli-base/dist/src/lib/sys/File";
import Directory from "ecli-base/dist/src/lib/sys/Directory";
import assert from "node:assert";
import {SFTPRunner} from "../Runner/SFTPRunner";
import {joinPaths} from "ecli-base/dist/src/lib/helper/path";
import {CommandReturnType, SSHRunner} from "../Runner/SSHRunner";
import Logger from "../Logger/Logger";
import {DeploymentType} from "./Deployment";
import DeployGit from "./DeployBashFile/DeployGit";
import DeployNvm from "./DeployBashFile/DeployNvm";
import DeployNode from "./DeployBashFile/DeployNode";
import DeployEcli from "./DeployBashFile/DeployEcli";
import DeployEcliDeploy from "./DeployBashFile/DeployEcliDeploy";
import DeployDeployment from "./DeployBashFile/DeployDeployment";
import RemoveDeployment from "./DeployBashFile/RemoveDeployment";


export default class DeployServer {
    private sftp ?: SFTPRunner;
    private ssh ?: SSHRunner;
    private now: Date;
    private isoNow: string;
    private remoteLogPath: string;

    constructor(
        protected readonly props: {
            base?: string,
            nvmVersion?: string,
            nodeVersion?: string,
            remote?: {
                cwd?: string,
                host?: string,
                username?: string,
                password?: string,
                private_key?: string,
                private_key_file?: string,
                passphrase?: string,
                port?: number,
            },
        }
    ) {
        this.now = new Date;
        // @ts-ignore
        this.isoNow = this.now.toISOString().replaceAll(':', '-');
        this.remoteLogPath = `log/${this.isoNow}`;

        this.props.remote = {
            cwd: (this.props.remote?.cwd ?? '$HOME/.ecli-deploy') as string,
            host: (this.props.remote?.host ?? 'localhost') as string ?? '127.0.0.1',
            username: (this.props.remote?.username) as (string | undefined) ?? undefined,
            password: (this.props.remote?.password) as (string | undefined) ?? undefined,
            passphrase: (this.props.remote?.passphrase) as (string | undefined) ?? undefined,
            private_key: !!this.props.remote?.private_key_file ?
                File.read({path: this.props.remote?.private_key_file}) :
                ((this.props.remote?.private_key) as (string | undefined) ?? undefined),
            port: (this.props.remote?.port as number | undefined) ?? 22,
        };
    }

    public async install() {
        for (const chunk of [
            new DeployGit(this.ssh as SSHRunner, this.sftp, {}),
            new DeployNvm(this.ssh as SSHRunner, this.sftp, {version: this.props.nvmVersion}),
            new DeployNode(this.ssh as SSHRunner, this.sftp, {version: this.props.nodeVersion ?? '20.14.0'}),
            new DeployEcli(this.ssh as SSHRunner, this.sftp, {nodeVersion: this.props.nodeVersion ?? '20.14.0'}),
            new DeployEcliDeploy(this.ssh as SSHRunner, this.sftp, {}),
        ]) {
            await chunk.make();
        }
    }

    public async send(name: string, force: boolean) {
        const deployment = File.readJson({path: joinPaths(this.props.base ?? './', 'dist', name, 'deploy.json')}) as DeploymentType;
        for (const chunk of [
            new DeployDeployment(this.ssh as SSHRunner, this.sftp, {
                base: this.props.base ?? './',
                name: name,
                force
            }),
        ]) {
            await chunk.make();
        }
    }

    public async remove(name: string) {
        for (const chunk of [
            new RemoveDeployment(this.ssh as SSHRunner, this.sftp, {name}),
        ]) {
            await chunk.make();
        }
    }

    public async run(name: string) {
        return await this.ssh?.exec(`ecli deploy.run "name:${name}" "base:${this.props.remote?.cwd ?? '$HOME/.ecli-deploy'}"`);
    }

    public async result(name: string) {

    }

    public async start() {

        this.ssh = await (new SSHRunner({
            host: this.props.remote?.host,
            username: this.props.remote?.username,
            password: this.props.remote?.password,
            privateKey: this.props.remote?.private_key,
            passphrase: this.props.remote?.passphrase,
            port: this.props.remote?.port,
            logger: (new Logger({
                path: joinPaths(this.props.base ?? './', this.remoteLogPath, '_ssh.log'),
                pipeString: (data) => {
                    //console.log(data);
                    return data;
                }
            }))
        }))
            //.onOutput((data) => sshRawLogger.write(data))
            //.onOutput((data) => console.log(data))
            .start();

        await this.ssh.exec(`mkdir -p ${this.props.remote?.cwd}`);

        this.sftp = await (new SFTPRunner({
            host: this.props.remote?.host,
            username: this.props.remote?.username,
            password: this.props.remote?.password,
            privateKey: this.props.remote?.private_key,
            passphrase: this.props.remote?.passphrase,
            port: this.props.remote?.port,
            cwd: this.props.remote?.cwd,
            logger: (new Logger({
                path: joinPaths(this.props.base ?? './', this.remoteLogPath, '_sftp.log'),
                pipeString: (data) => {
                    //console.log(data);
                    return data;
                }
            }))
        }))
            //.onOutput((data) => sftpRawLogger.write(data))
            //.onOutput((data) => console.log(data))
            .start();
    }

    public async close() {
        for (const runner of [this.sftp, this.ssh]) {
            try {
                await runner?.close();
            } catch (e) {

            }
        }
    }
}