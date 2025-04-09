import {Command} from "ecli-base/dist/src/lib/command/Command";
import Deploy from "../lib/Deployment/Deploy";
import terminal from "ecli-base/dist/src/decorator/terminal";
import validateProps from "ecli-base/dist/src/decorator/validateProps";

export default class run extends Command {
    @terminal({
        description: 'This command is used to run a deployment.',
        paras: {
            base: {
                description: "specify the base directory(default: $HOME/.ecli-deploy)",
                example: "base:$HOME/.ecli-deploy"
            },
            name: {
                description: "name of the deployment",
                example: "base:front-end"
            },
        },
    })

    @validateProps<Parameters<InstanceType<typeof run>['index']>[0]>({
        type: "object",
        properties: {
            base: {type: "string", maxLength: 500, nullable: true, default: '$HOME/.ecli-deploy'},
            name: {type: 'string', maxLength: 500}
        },
        required: ['name'],
        additionalProperties: false
    })
    async index(args: ConstructorParameters<typeof Deploy>[0]) {
        const deploy = new Deploy(args);
        const ok = await deploy.start();
        return {
            ok,
            id: deploy.runId,
        }
    }

}