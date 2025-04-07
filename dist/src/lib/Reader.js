"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Input = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const node_readline_1 = __importDefault(require("node:readline"));
const Var_1 = __importDefault(require("ecli-base/dist/src/lib/var/Var"));
const Input = async (keys) => {
    const reader = node_readline_1.default.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const questioner = async (q) => new Promise((resolve, reject) => {
        reader.question(q, read => resolve(read));
    });
    const assertAndClose = (condition, msg) => {
        if (!condition) {
            reader.close();
            (0, node_assert_1.default)(false, msg);
        }
    };
    const data = {};
    for (const key in keys) {
        const value = keys[key];
        let readValue = await questioner(value.question);
        if (value.type == 'number') {
            readValue = readValue.trim();
            assertAndClose(Var_1.default.isNumeric(readValue), `${key} should be ${value.type}(${readValue})`);
            readValue = Var_1.default.parseStr(readValue);
        }
        else if (value.type == 'boolean') {
            readValue = readValue.trim();
            assertAndClose(['true', 'false'].includes(readValue), `${key} should be ${value.type}(${readValue})`);
            readValue = Var_1.default.parseStr(readValue);
        }
        assertAndClose(value.nullable || readValue, `${key} can not be null`);
        data[key] = readValue;
    }
    reader.close();
    return data;
};
exports.Input = Input;
