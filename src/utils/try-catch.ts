export function tryCatch<T, E extends Error>(arg: () => Promise<void>): Promise<Result<T, E>>;
export function tryCatch<T, E extends Error>(arg: VoidFunction): Result<T, E>;
export function tryCatch<T, E extends Error>(arg: Promise<T> | (() => Promise<T>)): Promise<Result<T, E>>;
export function tryCatch<T, E extends Error>(arg: () => T): Result<T, E>;
export function tryCatch<T, E extends Error = Error>(arg: Promise<T> | (() => MaybePromise<T>)): MaybePromise<Result<T, E>>;
export function tryCatch<T, E extends Error = Error>(arg: Promise<T> | (() => MaybePromise<T>)): MaybePromise<Result<T, E>> {
    try {
        const data = arg instanceof Promise ? arg : arg();
        return transformMaybePromise(data, <(data: T) => Result<T, E>>createResult);
    } catch (anyErr: any) {
        const error = <E>parseErr(anyErr);
        return createResult(<T>null, error);
    }
}

function createResult<T, E extends Error>(data: T | null = null, error: E | null = null): Result<T, E> {
    const success = error === null;
    return <Result<T, E>>{ data, error, success, 0: error, 1: data, length: 2, [Symbol.iterator]: resultIterator, resolve };

    function* resultIterator() {
        yield error;
        yield data;
    }

    function resolve(): T {
        if (success) return <T>data;
        throw error;
    }
}

function parseErr(error: any): Error {
    if (Error.isError?.(error) ?? error instanceof Error) return error;

    switch (typeof error) {
        case "string": return new Error(error);
        case "object": return new Error(error === null ? error : shallowCopyObj(error));

        case "symbol": return new Error(error.description);

        default: return new Error(`${error}`);
    }
}
function shallowCopyObj(obj: object): Record<string, string> {
    const copy: Record<string, string> = {};
    for (const key in obj) {
        const value: any = obj[<keyof object>key];

        const copyVal: string = (() => {
            switch (typeof value) {
                case "string": return value;

                case "number":
                case "boolean": return `${value}`;

                case "bigint": return `${value}n`;

                case "object": return (
                    value === null
                        ? "null"
                        : value.toJSON?.() ?? (
                            value.toString() === "[object Object]"
                                ? undefined
                                : value.toString()
                        ) ?? value[Symbol.toStringTag] ?? value[Symbol.name] ?? (
                            "constructor" in value
                                ? value.constructor.name
                                : "Object"
                        )
                );

                case "function": return value.name;
                case "symbol": return value.description;

                case "undefined": return "undefined";
            }
        })();

        copy[<keyof object>key] = copyVal;
    }

    return copy;
}

function transformMaybePromise<T, U>(arg: MaybePromise<T>, func: (arg: T) => U): MaybePromise<U> {
    return arg instanceof Promise ? new Promise(async (res) => res(await arg.then((arg) => func(arg)).catch((error) => error))) : func(arg);
}

type ArrResolved<T> = [null, T];
type ArrRejected<E> = [E, null];

type ArrSwappedResolved<T> = [T, null];
type ArrSwappedRejected<E> = [null, E];

type ObjResolved<T> = {
    data: T;
    error: null;

    success: true;
}

type ObjRejected<E extends Error> = {
    data: null;
    error: E;

    success: false;
}


type Result<T, E extends Error> = (ObjResolved<T> | ObjRejected<E>) & (ArrResolved<T> | ArrRejected<E>) & ResultAddon<T>;
type SwappedResult<T, E extends Error> = (ObjResolved<T> | ObjRejected<E>) & (ArrSwappedResolved<T> | ArrSwappedRejected<E>) & ResultAddon<T>;

type ResultAddon<T> = { resolve(): T; };

type MaybePromise<T> = T | Promise<T>;