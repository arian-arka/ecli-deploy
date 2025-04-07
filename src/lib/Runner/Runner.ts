import Logger from "../Logger/Logger";

export class Runner {
    public log: Logger;
    protected _onOutput ?:  (data : string) => void;

    protected callOnOutput(data  :string){
        this._onOutput && this._onOutput(data);
    }
    public onOutput(callback : (data : string) => void){
        this._onOutput = callback;
        return this;
    }

    constructor(protected readonly props: {
        host ?: string,
        port ?: number,
        username ?: string,
        password ?: string,
        privateKey ?: string,
        passphrase ?: string,
        keepaliveInterval?: number,
        timeout?: number,//milisecond,

        cwd?: string,
        env?: { [key: string]: string },
        closeOnFailure?: boolean,
        maxBuffer?: number,
        logPath?: string,
        logger?:Logger,
    }) {
        this.log = this.props.logger ?? new Logger({path: this.props.logPath});
    }

    public start(): Promise<any> | any {
        return this;
    }

    public close(): Promise<any> | any {

    }

    async execute(command: string): Promise<any> {
        return '';
    }

}
