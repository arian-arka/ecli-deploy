import {Command} from "ecli-base/dist/src/lib/command/Command";
import {joinPaths} from "ecli-base/dist/src/lib/helper/path";
import Deployment from "../lib/Deployment/Deployment";
import * as crypto from "node:crypto";
import {Input} from "../lib/Reader";
import Directory from "ecli-base/dist/src/lib/sys/Directory";
import Terminal from "ecli-base/dist/src/lib/sys/Terminal";
import Deploy from "../lib/Deployment/Deploy";
import terminal from "ecli-base/dist/src/decorator/terminal";
import validateProps from "ecli-base/dist/src/decorator/validateProps";
import DeployServer from "../lib/Deployment/DeployServer";

export default class server extends Command {

    @terminal({
        description: 'Installs ecli dependencies for a deployment on the deployer server.(curl, git, nvm, nodejs, ecli, ecli-base, ecli-deploy and required directories in $HOME/.ecli-deploy)',
        paras: {
            base: {
                description: "specify the base directory",
                example: "base:test"
            },
            name: {
                description: "name of the deployment",
                example: "base:front-end"
            },
            "nvm-version": {
                description: "version of nvm.(default: 0.40.2)",
                example: "nvm-version:0.40.2"
            },
            "node-version": {
                description: "version of nodejs.(default: 20.14.0)",
                example: "node-version:20.14.0"
            },
            "remote": {
                description: "remote server parameters(cwd, host, username, password, private_key, passphrase, port). its json",
                example: `"remote:json:{"host":"127.0.0.1", "cwd":"~", "username":"root", "password":"toor", "port":22, "passphrase":"passphrase", "private_key_file" :"~/.ssh/id_ed25519.pub"}"`
            }
        },
    })

    @validateProps<Parameters<InstanceType<typeof server>['install']>[0]>({
        type: "object",
        properties: {
            base: {type: 'string', maxLength: 500, nullable: true, default: './'},
            nodeVersion: {type: 'string', maxLength: 500, nullable: true, default: '20.14.0'},
            nvmVersion: {type: 'string', maxLength: 500, nullable: true, default: '0.40.2'},
            remote: {
                type: 'object',
                nullable: true,
                properties: {
                    cwd: {type: 'string', maxLength: 500, nullable: true, default: '~'},
                    host: {type: 'string', maxLength: 500, nullable: true, default: '127.0.0.1'},
                    username: {type: 'string', maxLength: 500, nullable: true, default: 'root'},
                    password: {type: 'string', maxLength: 500, nullable: true},
                    private_key: {type: 'string', maxLength: 5000, nullable: true},
                    private_key_file: {type: 'string', maxLength: 5000, nullable: true},
                    passphrase: {type: 'string', maxLength: 500, nullable: true},
                    port: {type: 'integer', minimum: 0, maximum: 65000, nullable: true, default: 22},
                },
                required: [],
                additionalProperties: false,
            }
        },
        required: [],
        additionalProperties: false
    })
    async install(args: ConstructorParameters<typeof DeployServer>[0]) {
        const deploy = new DeployServer(args);
        let error: any = false;
        try {
            await deploy.start();
            await deploy.install();
        } catch (e) {
            error = e;
        } finally {
            await deploy.close();
        }
        if (error)
            throw error;
        return true;
    }

    @terminal({
        description: 'Send a built deployment to server',
        paras: {
            base: {
                description: "specify the base directory",
                example: "base:test"
            },
            name: {
                description: "name of the deployment",
                example: "base:front-end"
            },
            force: {
                description: "rewrite if it already exists",
                example: "force:true"
            },
            "remote": {
                description: "remote server parameters(cwd, host, username, password, private_key, passphrase, port). its json",
                example: `"remote:json:{"host":"127.0.0.1", "cwd":"~", "username":"root", "password":"toor", "port":22, "passphrase":"passphrase", "private_key_file" :"~/.ssh/id_ed25519.pub"}"`
            }
        },
    })

    @validateProps<Parameters<InstanceType<typeof server>['send']>[0]>({
        type: "object",
        properties: {
            base: {type: 'string', maxLength: 500, nullable: true, default: './'},
            nodeVersion: {type: 'string', maxLength: 500, nullable: true, default: '20.14.0'},
            nvmVersion: {type: 'string', maxLength: 500, nullable: true, default: '0.40.2'},
            name: {type: 'string', maxLength: 500},
            force: {type: 'boolean', nullable: true, default: false},
            remote: {
                type: 'object',
                nullable: true,
                properties: {
                    cwd: {type: 'string', maxLength: 500, nullable: true, default: '~'},
                    host: {type: 'string', maxLength: 500, nullable: true, default: '127.0.0.1'},
                    username: {type: 'string', maxLength: 500, nullable: true, default: 'root'},
                    password: {type: 'string', maxLength: 500, nullable: true},
                    private_key: {type: 'string', maxLength: 5000, nullable: true},
                    private_key_file: {type: 'string', maxLength: 5000, nullable: true},
                    passphrase: {type: 'string', maxLength: 500, nullable: true},
                    port: {type: 'integer', minimum: 0, maximum: 65000, nullable: true, default: 22},
                },
                required: [],
                additionalProperties: false,
            }
        },
        required: ['name'],
        additionalProperties: false
    })
    async send(args: ConstructorParameters<typeof DeployServer>[0] & { name: string, force?: boolean }) {
        const deploy = new DeployServer(args);
        let error: any = false;
        try {
            await deploy.start();
            await deploy.send(args.name, args.force ?? false);
        } catch (e) {
            error = e;
        } finally {
            await deploy.close();
        }
        if (error)
            throw error;
        return true;
    }

    @terminal({
        description: "removes a deployment from server",
        paras: {
            base: {
                description: "specify the base directory",
                example: "base:test"
            },
            name: {
                description: "name of the deployment",
                example: "base:front-end"
            },
            "remote": {
                description: "remote server parameters(cwd, host, username, password, private_key, passphrase, port). its json",
                example: `"remote:json:{"host":"127.0.0.1", "cwd":"~", "username":"root", "password":"toor", "port":22, "passphrase":"passphrase", "private_key_file" :"~/.ssh/id_ed25519.pub"}"`
            }
        },
    })

    @validateProps<Parameters<InstanceType<typeof server>['remove']>[0]>({
        type: "object",
        properties: {
            base: {type: 'string', maxLength: 500, nullable: true, default: './'},
            nodeVersion: {type: 'string', maxLength: 500, nullable: true, default: '20.14.0'},
            nvmVersion: {type: 'string', maxLength: 500, nullable: true, default: '0.40.2'},
            name: {type: 'string', maxLength: 500},
            remote: {
                type: 'object',
                nullable: true,
                properties: {
                    cwd: {type: 'string', maxLength: 500, nullable: true, default: '~'},
                    host: {type: 'string', maxLength: 500, nullable: true, default: '127.0.0.1'},
                    username: {type: 'string', maxLength: 500, nullable: true, default: 'root'},
                    password: {type: 'string', maxLength: 500, nullable: true},
                    private_key: {type: 'string', maxLength: 5000, nullable: true},
                    private_key_file: {type: 'string', maxLength: 5000, nullable: true},
                    passphrase: {type: 'string', maxLength: 500, nullable: true},
                    port: {type: 'integer', minimum: 0, maximum: 65000, nullable: true, default: 22},
                },
                required: [],
                additionalProperties: false,
            }
        },
        required: ['name'],
        additionalProperties: false
    })
    async remove(args: ConstructorParameters<typeof DeployServer>[0] & { name: string }) {
        const deploy = new DeployServer(args);
        let error: any = false;
        try {
            await deploy.start();
            await deploy.remove(args.name);
        } catch (e) {
            error = e;
        } finally {
            await deploy.close();
        }
        if (error)
            throw error;
        return true;
    }

    @terminal({
        description: "Runs a deployment on the server",
        paras: {
            name: {
                description: "name of the deployment",
                example: "base:front-end"
            },
            "remote": {
                description: "remote server parameters(cwd, host, username, password, private_key, passphrase, port). its json",
                example: `"remote:json:{"host":"127.0.0.1", "cwd":"~", "username":"root", "password":"toor", "port":22, "passphrase":"passphrase", "private_key_file" :"~/.ssh/id_ed25519.pub"}"`
            }
        },
    })

    @validateProps<Parameters<InstanceType<typeof server>['run']>[0]>({
        type: "object",
        properties: {
            base: {type: 'string', maxLength: 500, nullable: true, default: './'},
            nodeVersion: {type: 'string', maxLength: 500, nullable: true, default: '20.14.0'},
            nvmVersion: {type: 'string', maxLength: 500, nullable: true, default: '0.40.2'},
            name: {type: 'string', maxLength: 500},
            remote: {
                type: 'object',
                nullable: true,
                properties: {
                    cwd: {type: 'string', maxLength: 500, nullable: true, default: '~'},
                    host: {type: 'string', maxLength: 500, nullable: true, default: '127.0.0.1'},
                    username: {type: 'string', maxLength: 500, nullable: true, default: 'root'},
                    password: {type: 'string', maxLength: 500, nullable: true},
                    private_key: {type: 'string', maxLength: 5000, nullable: true},
                    private_key_file: {type: 'string', maxLength: 5000, nullable: true},
                    passphrase: {type: 'string', maxLength: 500, nullable: true},
                    port: {type: 'integer', minimum: 0, maximum: 65000, nullable: true, default: 22},
                },
                required: [],
                additionalProperties: false,
            }
        },
        required: ['name'],
        additionalProperties: false
    })
    async run(args: ConstructorParameters<typeof DeployServer>[0] & { name: string }) {
        const deploy = new DeployServer(args);
        let error: any = false;
        try {
            await deploy.start();
            await deploy.run(args.name);
        } catch (e) {
            error = e;
        } finally {
            await deploy.close();
        }
        if (error)
            throw error;
        return true;
    }


    @terminal({
        description: "Reads results from a ran deployment",
        paras: {
            name: {
                description: "name of the deployment",
                example: "base:front-end"
            },
            "remote": {
                description: "remote server parameters(cwd, host, username, password, private_key, passphrase, port). its json",
                example: `"remote:json:{"host":"127.0.0.1", "cwd":"~", "username":"root", "password":"toor", "port":22, "passphrase":"passphrase", "private_key_file" :"~/.ssh/id_ed25519.pub"}"`
            }
        },
    })

    @validateProps<Parameters<InstanceType<typeof server>['run']>[0]>({
        type: "object",
        properties: {
            base: {type: 'string', maxLength: 500, nullable: true, default: './'},
            nodeVersion: {type: 'string', maxLength: 500, nullable: true, default: '20.14.0'},
            nvmVersion: {type: 'string', maxLength: 500, nullable: true, default: '0.40.2'},
            name: {type: 'string', maxLength: 500},
            remote: {
                type: 'object',
                nullable: true,
                properties: {
                    cwd: {type: 'string', maxLength: 500, nullable: true, default: '~'},
                    host: {type: 'string', maxLength: 500, nullable: true, default: '127.0.0.1'},
                    username: {type: 'string', maxLength: 500, nullable: true, default: 'root'},
                    password: {type: 'string', maxLength: 500, nullable: true},
                    private_key: {type: 'string', maxLength: 5000, nullable: true},
                    private_key_file: {type: 'string', maxLength: 5000, nullable: true},
                    passphrase: {type: 'string', maxLength: 500, nullable: true},
                    port: {type: 'integer', minimum: 0, maximum: 65000, nullable: true, default: 22},
                },
                required: [],
                additionalProperties: false,
            }
        },
        required: ['name'],
        additionalProperties: false
    })
    async result(args: ConstructorParameters<typeof DeployServer>[0] & { name: string }) {
        const deploy = new DeployServer(args);
        let error: any = false;
        try {
            await deploy.start();
            await deploy.result(args.name);
        } catch (e) {
            error = e;
        } finally {
            await deploy.close();
        }
        if (error)
            throw error;
        return true;
    }


    @terminal({
        description: 'This command is used to make the deployment server and run the deployment on that.',
        paras: {},
    })

    @validateProps<Parameters<InstanceType<typeof server>['index']>[0]>({
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false
    })
    async index(args: {}) {
        return true;
    }

}