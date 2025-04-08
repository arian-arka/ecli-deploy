import File from "ecli-base/dist/src/lib/sys/File";
import {DeploymentType} from "./Deployment";
import {SFTPRunner} from "../Runner/SFTPRunner";
import Logger from "../Logger/Logger";
import {joinPaths} from "ecli-base/dist/src/lib/helper/path";
import {SSHRunner} from "../Runner/SSHRunner";
import DeployNvm from "./DeployBashFile/DeployNvm";
import DeployNode from "./DeployBashFile/DeployNode";
import DeployFiles from "./DeployBashFile/DeployFiles";
import DeployGit from "./DeployBashFile/DeployGit";
import DeployEcli from "./DeployBashFile/DeployEcli";
import DeployEcliDeploy from "./DeployBashFile/DeployEcliDeploy";
import DeployServer from "./DeployServer";
import RemoveDeployment from "./DeployBashFile/RemoveDeployment";
import DeployDeployment from "./DeployBashFile/DeployDeployment";

type StepsStageType = ({
    done: boolean,
    stage: string,
    started_at?: Date,
    ended_at?: Date,
    seconds: number,
    command: string[],
});

type StepsFlowType = ({
    done: boolean,
    flow: string,
    started_at?: Date,
    ended_at?: Date,
    seconds: number,
    stages: StepsStageType[],
});

type StepsDoneType = ({
    done: boolean,
    architecture: string,
    started_at?: Date,
    ended_at?: Date,
    seconds: number,
    flows: StepsFlowType[]
});


export default class Deploy {
    private sftp ?: SFTPRunner;
    private ssh ?: SSHRunner;
    private now: Date;
    private remote: {
        cwd?: string,
        host: string,
        username?: string,
        password?: string,
        private_key?: string,
        passphrase?: string,
        port?: number,
    };
    private deployment: DeploymentType;
    private isoNow: string;
    private remoteLogPath: string;

    constructor(private readonly props: {
        nvmVersion?: string,
        nodeVersion: string,
        base?: string,
        deployment: string,
        now?: Date
    }) {
        this.now = props.now ?? new Date;
        // @ts-ignore
        this.isoNow = this.now.toISOString().replaceAll(':', '-');
        this.remoteLogPath = `log/${this.isoNow}`;

        this.deployment = this.findDeployment();

        this.remote = {
            cwd: (this.deployment.env['CWD'] ?? '') as string,
            host: (this.deployment.env['HOST'] ?? 'localhost') as string,
            username: (this.deployment.env['USER']) as (string | undefined) ?? undefined,
            password: (this.deployment.env['PASS']) as (string | undefined) ?? undefined,
            passphrase: (this.deployment.env['PASSPHRASE']) as (string | undefined) ?? undefined,
            private_key: (!!(this.deployment.env['PRIVATE_KEY_PATH'] as string | undefined | null) ? File.read({path: (this.deployment.env['PRIVATE_KEY_PATH'] as string)}) : (this.deployment.env['PRIVATE_KEY'] as string | undefined | null)) ?? undefined,
            port: (this.deployment.env['PORT'] as number | undefined) ?? 22,
        };
    }

    protected findDeployment(): DeploymentType {
        return File.readJson({path: joinPaths(this.props.base ?? './', 'dist', this.props.deployment, 'deploy.json')}) as DeploymentType;
    }

    protected async destroyRunners() {
        for (const runner of [this.sftp, this.ssh]) {
            try {
                await runner?.close();
            } catch (e) {

            }
        }
    }

    public async close() {
        await this.destroyRunners();
    }

    public async start() {
        await this.makeRunners();
    }

    protected async makeRunners() {
        // const sftpRawLogger = (new Logger({
        //     path: joinPaths(this.logBase, '_sftp.raw.log'),
        //     rewrite: true,
        //     pipeString: (data) => {
        //         //console.log(data);
        //         return data;
        //     }
        // }));
        // const sshRawLogger = (new Logger({
        //     path: joinPaths(this.logBase, '_ssh.raw.log'),
        //     rewrite: true,
        //     pipeString: (data) => {
        //         //console.log(data);
        //         return data;
        //     }
        // }));

        this.ssh = await (new SSHRunner({
            host: this.remote.host,
            username: this.remote.username,
            password: this.remote.password,
            privateKey: this.remote.private_key,
            passphrase: this.remote.passphrase,
            port: this.remote.port,
            logger: (new Logger({
                path: joinPaths(this.props.base ?? './', this.remoteLogPath, '_ssh.log'),
                //path: joinPaths(this.logBase, '_ssh.log'),
                //rewrite: true,
                pipeString: (data) => {
                    //console.log(data);
                    return data;
                }
            }))
        }))
            //.onOutput((data) => sshRawLogger.write(data))
            //.onOutput((data) => console.log(data))
            .start();

        await this.ssh.exec(`mkdir -p ${this.remote.cwd}`);

        this.sftp = await (new SFTPRunner({
            host: this.remote.host,
            username: this.remote.username,
            password: this.remote.password,
            privateKey: this.remote.private_key,
            passphrase: this.remote.passphrase,
            port: this.remote.port,
            cwd: this.remote.cwd,
            logger: (new Logger({
                path: joinPaths(this.props.base ?? './', this.remoteLogPath, '_sftp.log'),
                //path: joinPaths(this.logBase, '_sftp.log'),
                //rewrite: true,
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

    public async deployEcliRepo() {
        for (const chunk of [
            new DeployGit(this.ssh as SSHRunner, this.sftp, {}),
            new DeployNvm(this.ssh as SSHRunner, this.sftp, {version: this.props.nvmVersion}),
            new DeployNode(this.ssh as SSHRunner, this.sftp, {version: this.props.nodeVersion}),
            new DeployEcli(this.ssh as SSHRunner, this.sftp, {nodeVersion: this.props.nodeVersion}),
            new DeployEcliDeploy(this.ssh as SSHRunner, this.sftp, {}),
        ]) {
            await chunk.make();
        }
    }

    public async removeDeployment() {
        for (const chunk of [
            new RemoveDeployment(this.ssh as SSHRunner, this.sftp, {name: this.deployment.name}),
        ]) {
            await chunk.make();
        }
    }

    public async deployServer(force ?: boolean) {
        for (const chunk of [
            new DeployDeployment(this.ssh as SSHRunner, this.sftp, {
                base: this.props.base ?? './',
                name: this.props.deployment,
                force
            }),
        ]) {
            await chunk.make();
        }
    }

}