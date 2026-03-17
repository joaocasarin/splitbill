import { SCHEMA_VERSION } from "@domain/common";
import type { Global } from "@domain/global";
import lzstring from "lz-string";

export const emptyGlobal: Global = {
    version: SCHEMA_VERSION,
    groups: [],
};

export const validGlobal: Global = {
    version: SCHEMA_VERSION,
    groups: [],
};

export const validGlobalEncoded = lzstring.compressToEncodedURIComponent(
    JSON.stringify(validGlobal),
);
