import { Command } from "ecli-base/dist/src/lib/command/Command";
export default class repo extends Command {
    index(args: {
        base?: string;
        name: string;
        nodeVersion?: string;
    }): Promise<void>;
}
