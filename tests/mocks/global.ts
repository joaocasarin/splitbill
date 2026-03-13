import type { Global } from "@domain/global";
import lzstring from "lz-string";

import { testAlice } from "./users";

export const emptyGlobal: Global = {
    version: 2,
    users: [],
    groups: [],
};

export const validGlobal: Global = {
    version: 2,
    users: [testAlice],
    groups: [],
};

export const validGlobalEncoded = lzstring.compressToEncodedURIComponent(
    JSON.stringify(validGlobal),
);
