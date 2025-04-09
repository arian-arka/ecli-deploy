import { Command } from "ecli-base/dist/src/lib/command/Command";
import DeployServer from "../lib/Deployment/DeployServer";
export default class server extends Command {
    install(args: ConstructorParameters<typeof DeployServer>[0]): Promise<boolean>;
    send(args: ConstructorParameters<typeof DeployServer>[0] & {
        name: string;
        force?: boolean;
    }): Promise<boolean>;
    remove(args: ConstructorParameters<typeof DeployServer>[0] & {
        name: string;
    }): Promise<boolean>;
    run(args: ConstructorParameters<typeof DeployServer>[0] & {
        name: string;
    }): Promise<boolean>;
    result(args: ConstructorParameters<typeof DeployServer>[0] & {
        name: string;
    }): Promise<boolean>;
    index(args: {}): Promise<boolean>;
}
