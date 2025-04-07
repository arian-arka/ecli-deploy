export type InputArgsType = {
    [key: string]: {
        type: 'number' | 'boolean' | 'string';
        nullable: boolean;
        question: string;
    };
};
type IREAD = (keys: InputArgsType) => Promise<any>;
export declare const Input: IREAD;
export {};
