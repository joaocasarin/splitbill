import type { Global } from "@domain/global";
import lzstring from "lz-string";

export const emptyGlobal: Global = {
    version: 1,
    users: [],
    groups: [],
};

export const validGlobal: Global = {
    version: 1,
    users: [{ id: 1, name: "Alice" }],
    groups: [],
};

export const validGlobalEncoded = lzstring.compressToEncodedURIComponent(
    JSON.stringify(validGlobal),
);
