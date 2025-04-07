declare class Hash {
    private _rounds;
    setRounds(r: number): this;
    make(plain: string): Promise<string>;
    check(hashed: string, plain: string): Promise<boolean>;
}
declare const _default: Hash;
export default _default;
