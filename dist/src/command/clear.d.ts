import { Command } from "ecli-base/dist/src/lib/command/Command";
export default class make extends Command {
    index(args: {
        base?: string;
        dist?: boolean | string;
    }): Promise<void>;
}
