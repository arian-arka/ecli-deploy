"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Hash {
    constructor() {
        this._rounds = 12;
    }
    setRounds(r) {
        this._rounds = r;
        return this;
    }
    async make(plain) {
        const lib = require('bcrypt');
        const salt = await lib.genSalt(this._rounds);
        return await lib.hash(plain, salt);
    }
    async check(hashed, plain) {
        const lib = require('bcrypt');
        return await lib.compare(plain, hashed);
    }
}
exports.default = new Hash();
