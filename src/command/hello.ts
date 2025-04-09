import {Command} from "ecli-base/dist/src/lib/command/Command";
import terminal from "ecli-base/dist/src/decorator/terminal";
export default class hello extends Command {

    @terminal({
        description: 'Hello world from ecli-deploy',
        paras: {
            filter: {
                description: "a javascript arrow function that returns boolean ",
                example: "(req) => req.uri.startsWith('api')"
            },
            withPrefix: {
                description: 'boolean - filter endpoints that have prefix - default is "api@any"',
            },
            withoutPrefix: {
                description: "boolean - filter endpoints that dont have prefix - default is null",
            },
            api: {
                description: "uri of request docs - the default is in the example",
                example: "http://127.0.0.1:8000/request-docs/api?json=true&showGet=true&showPost=true&showDelete=true&showPut=true&showPatch=true&showHead=false&sort=default&groupby=default"
            },
            show: {
                description: "boolean - print output in stdout - default is false",
            },
            out: {
                description: "specify a file to write the output - it will rewrite if the file already exists",
            },
        },
    })

    /*@validateProps<Parameters<InstanceType<typeof hello>['index']>[0]>({
        type: "object",
        properties: {
        },
        required: [],
        additionalProperties: false
    })*/

    async index(args: any) {

        return 'hello world from ecli deploy';
    }

}