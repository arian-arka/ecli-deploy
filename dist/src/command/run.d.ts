import { Command } from "ecli-base/dist/src/lib/command/Command";
import Deploy from "../lib/Deployment/Deploy";
export default class run extends Command {
    index(args: ConstructorParameters<typeof Deploy>[0]): Promise<{
        ok: boolean;
        id: string;
    }>;
}
