"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugLog = void 0;
const node_os_1 = require("node:os");
const fs_1 = __importDefault(require("fs"));
const File_1 = __importDefault(require("ecli-base/dist/src/lib/sys/File"));
const Directory_1 = __importDefault(require("ecli-base/dist/src/lib/sys/Directory"));
const LOG_OPTIONS = {
    debug: true
};
function debugLog(enable = true) {
    LOG_OPTIONS.debug = enable;
}
exports.debugLog = debugLog;
class Logger {
    constructor(props) {
        var _a, _b, _c;
        this.props = props;
        if (((_a = this.props.rewrite) !== null && _a !== void 0 ? _a : false) && !!this.props.path && File_1.default.exists({ path: (_b = this.props.path) !== null && _b !== void 0 ? _b : '' }))
            Directory_1.default.delete({ path: (_c = this.props.path) !== null && _c !== void 0 ? _c : '' });
    }
    write(data, eol = true) {
        this.writeToFile(data + (eol ? node_os_1.EOL : ''));
    }
    writeToFile(data) {
        if (this.props.pipeString)
            data = this.props.pipeString(data);
        if (!!this.props.path) {
            if (!File_1.default.exists({ path: this.props.path }))
                File_1.default.create({
                    path: this.props.path,
                    check: false,
                    data,
                    createDir: true,
                });
            else
                fs_1.default.appendFileSync(this.props.path, data);
        }
    }
    generateDescription(description) {
        const data = description !== null && description !== void 0 ? description : '';
        if (Array.isArray(data))
            return data.join(node_os_1.EOL);
        else if (!!data)
            return data;
        return '';
    }
    make(data) {
        var _a;
        if (!(!!data.datetime)) {
            const now = new Date(Date.now());
            data.timezoneOffset = now.getTimezoneOffset();
            data.datetime = now.toISOString();
        }
        data.description = this.generateDescription(data.description);
        if (this.props.pipe)
            data = this.props.pipe(data);
        this.writeToFile([
            `<- ------------- TYPE: ${data.type} ------------- ->`,
            `${data.timezoneOffset} - ${data.datetime}`,
            `TITLE: ${data.title}`,
            `${(_a = data.description) !== null && _a !== void 0 ? _a : ''}`,
        ].join(node_os_1.EOL) + node_os_1.EOL);
        return;
    }
    info(data) {
        return this.make({ ...data, type: 'INFO' });
    }
    warn(data) {
        return this.make({ ...data, type: 'WARN' });
    }
    error(data) {
        return this.make({ ...data, type: 'ERROR' });
    }
    fatal(data) {
        return this.make({ ...data, type: 'FATAL' });
    }
    trace(data) {
        return this.make({ ...data, type: 'TRACE' });
    }
    debug(data) {
        if (LOG_OPTIONS.debug)
            return this.make({ ...data, type: 'DEBUG' });
    }
}
exports.default = Logger;
