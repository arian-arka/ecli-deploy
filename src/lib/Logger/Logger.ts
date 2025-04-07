import {EOL} from "node:os";
import fs from "fs";
import File from "ecli-base/dist/src/lib/sys/File";
import Directory from "ecli-base/dist/src/lib/sys/Directory";
import {writeFileSync} from "node:fs";

export type LogTypes = 'INFO' | 'WARN' | 'ERROR' | 'FATAL' | 'TRACE' | 'DEBUG';
export type LogType = {
    type: LogTypes,
    title: string,
    datetime?: string,
    timezoneOffset?: number,
    description?: any,
};
const LOG_OPTIONS={
    debug : true
};

export function debugLog(enable : boolean = true){
    LOG_OPTIONS.debug = enable;
}


export default class Logger {
    constructor(private readonly props: {
        path?: string,
        rewrite?:boolean,
        pipe?: (data : LogType) => LogType,
        pipeString?: (data : string) => string,
    }) {
        if ( (this.props.rewrite ?? false) && !!this.props.path && File.exists({path: this.props.path ?? ''}))
            Directory.delete({path: this.props.path ?? ''});
    }

    public write(data:string,eol : boolean = true){
        this.writeToFile(data + (eol ? EOL : ''));
    }

    protected writeToFile(data: string) {
        if(this.props.pipeString)
            data = this.props.pipeString(data);
        if (!!this.props.path) {
            if (!File.exists({path: this.props.path}))
                File.create({
                    path: this.props.path,
                    check: false,
                    data,
                    createDir: true,
                });
            else
                fs.appendFileSync(this.props.path, data);
        }
    }

    protected generateDescription(description?: any) {
        const data = description ?? '';
        if (Array.isArray(data))
            return data.join(EOL);
        else if (!!data)
            return data;
        return '';
    }

    protected make(data: LogType) {

        if (!(!!data.datetime)) {
            const now = new Date(Date.now());
            data.timezoneOffset = now.getTimezoneOffset();
            data.datetime = now.toISOString();
        }
        data.description = this.generateDescription(data.description);


        if(this.props.pipe)
            data = this.props.pipe(data);

        this.writeToFile([
            `<- ------------- TYPE: ${data.type} ------------- ->`,
            `${data.timezoneOffset} - ${data.datetime}`,
            `TITLE: ${data.title}`,
            `${data.description ?? ''}`,

        ].join(EOL) + EOL);

        return;
    }


    info(data: {
        title: string,
        description?: any,
    }) {
        return this.make({...data, type: 'INFO'});
    }

    warn(data: {
        title: string,
        description?: any,
    }) {
        return this.make({...data, type: 'WARN'});
    }

    error(data: {
        title: string,
        description?: any,
    }) {
        return this.make({...data, type: 'ERROR'});
    }

    fatal(data: {
        title: string,
        description?: any,
    }) {
        return this.make({...data, type: 'FATAL'});
    }

    trace(data: {
        title: string,
        description?: any,
    }) {
        return this.make({...data, type: 'TRACE'});
    }

    debug(data: {
        title: string,
        description?: any,
    }) {
        if(LOG_OPTIONS.debug)
            return this.make({...data, type: 'DEBUG'});
    }
}

