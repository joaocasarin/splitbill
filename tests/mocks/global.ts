import { SCHEMA_VERSION } from "@domain/common";
import type { Global } from "@domain/global";
import lzstring from "lz-string";

import { testAlice } from "./users";

export const emptyGlobal: Global = {
    version: SCHEMA_VERSION,
    users: [],
    groups: [],
};

export const validGlobal: Global = {
    version: SCHEMA_VERSION,
    users: [testAlice],
    groups: [],
};

export const validGlobalEncoded = lzstring.compressToEncodedURIComponent(
    JSON.stringify(validGlobal),
);
