import assert from "node:assert";
import readline from 'node:readline';
import Var from "ecli-base/dist/src/lib/var/Var";

export type InputArgsType = {
    [key: string]: {
        type: 'number' | 'boolean' | 'string',
        nullable: boolean,
        question: string
    }
};
//
// type IREAD = <T, K extends keyof T>(keys: T) => Promise<({ [key in K]: T[K]  })>;
type IREAD = (keys: InputArgsType) => Promise<any>;
export const Input: IREAD = async (keys) => {
    const reader = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const questioner = async (q: string): Promise<string> => new Promise((resolve, reject) => {
        reader.question(q, read => resolve(read));
    });

    const assertAndClose = (condition : boolean,msg : string) => {
        if(!condition){
            reader.close();
            assert(false,msg);
        }
    }

    const data: any = {};
    for (const key in keys) {
        const value = keys[key];
        let readValue: any = await questioner(value.question);
        if (value.type == 'number') {
            readValue = readValue.trim();
            assertAndClose(Var.isNumeric(readValue), `${key} should be ${value.type}(${readValue})`);
            readValue = Var.parseStr(readValue);
        } else if (value.type == 'boolean') {
            readValue = readValue.trim();
            assertAndClose(['true', 'false'].includes(readValue), `${key} should be ${value.type}(${readValue})`);
            readValue = Var.parseStr(readValue);
        }
        assertAndClose(value.nullable || readValue, `${key} can not be null`);
        data[key] = readValue;
    }

    reader.close();

    return data;
}


