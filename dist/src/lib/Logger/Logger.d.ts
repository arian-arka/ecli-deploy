export type LogTypes = 'INFO' | 'WARN' | 'ERROR' | 'FATAL' | 'TRACE' | 'DEBUG';
export type LogType = {
    type: LogTypes;
    title: string;
    datetime?: string;
    timezoneOffset?: number;
    description?: any;
};
export declare function debugLog(enable?: boolean): void;
export default class Logger {
    private readonly props;
    constructor(props: {
        path?: string;
        rewrite?: boolean;
        pipe?: (data: LogType) => LogType;
        pipeString?: (data: string) => string;
    });
    write(data: string, eol?: boolean): void;
    protected writeToFile(data: string): void;
    protected generateDescription(description?: any): any;
    protected make(data: LogType): void;
    info(data: {
        title: string;
        description?: any;
    }): void;
    warn(data: {
        title: string;
        description?: any;
    }): void;
    error(data: {
        title: string;
        description?: any;
    }): void;
    fatal(data: {
        title: string;
        description?: any;
    }): void;
    trace(data: {
        title: string;
        description?: any;
    }): void;
    debug(data: {
        title: string;
        description?: any;
    }): void;
}
