"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Runner = void 0;
const Logger_1 = __importDefault(require("../Logger/Logger"));
class Runner {
    callOnOutput(data) {
        this._onOutput && this._onOutput(data);
    }
    onOutput(callback) {
        this._onOutput = callback;
        return this;
    }
    constructor(props) {
        var _a;
        this.props = props;
        this.log = (_a = this.props.logger) !== null && _a !== void 0 ? _a : new Logger_1.default({ path: this.props.logPath });
    }
    start() {
        return this;
    }
    close() {
    }
    async execute(command) {
        return '';
    }
}
exports.Runner = Runner;
