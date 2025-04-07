class Hash {
    private _rounds = 12;

    setRounds(r: number) {
        this._rounds = r;
        return this;
    }

    async make(plain: string): Promise<string> {
        const lib = require('bcrypt');
        const salt = await lib.genSalt(this._rounds);
        return await lib.hash(plain, salt);
    }

    async check(hashed: string, plain: string): Promise<boolean> {
        const lib = require('bcrypt');
        return await lib.compare(plain, hashed);
    }
}

export default new Hash();