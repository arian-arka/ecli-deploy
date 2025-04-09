import { Command } from "ecli-base/dist/src/lib/command/Command";
export default class hello extends Command {
    index(args: any): Promise<string>;
}
