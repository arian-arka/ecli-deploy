import { Command } from "ecli-base/dist/src/lib/command/Command";
export default class make extends Command {
    zip(args: {
        base?: string;
        name: string;
    }): Promise<string>;
    index(args: {
        base?: string;
        name: string;
    }): Promise<string>;
    dir(args: {
        base?: string;
        name: string;
    }): Promise<string>;
}
