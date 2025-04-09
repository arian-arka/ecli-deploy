import { Command } from "ecli-base/dist/src/lib/command/Command";
export default class clear extends Command {
    log(args: {
        base?: string;
    }): Promise<void>;
    result(args: {
        base?: string;
    }): Promise<void>;
    index(args: {
        base?: string;
        dist?: boolean | string;
    }): Promise<string>;
}
