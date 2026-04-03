import { type Global, GlobalSchema } from "./global.schema";

export type ParseGlobalResult =
    | { success: true; data: Global }
    | { success: false; error: string };

type EntityResolver = {
    key: string;
    label: string;
    nameLookup: (
        raw: unknown,
        index: number,
        parentIndices: readonly number[],
    ) => string | undefined;
    children: readonly EntityResolver[];
};

type RawInput = {
    groups?: {
        name?: string;
        members?: { name?: string }[];
        expenses?: { title?: string }[];
    }[];
};

const ENTITY_RESOLVERS: readonly EntityResolver[] = [
    {
        key: "groups",
        label: "Group",
        nameLookup: (raw, i) => (raw as RawInput)?.groups?.[i]?.name,
        children: [
            {
                key: "members",
                label: "Member",
                nameLookup: (raw, i, p) =>
                    (raw as RawInput)?.groups?.[p[0]]?.members?.[i]?.name,
                children: [],
            },
            {
                key: "expenses",
                label: "Expense",
                nameLookup: (raw, i, p) =>
                    (raw as RawInput)?.groups?.[p[0]]?.expenses?.[i]?.title,
                children: [
                    {
                        key: "memberIds",
                        label: "MemberId",
                        nameLookup: () => undefined,
                        children: [],
                    },
                    {
                        key: "shares",
                        label: "Share",
                        nameLookup: () => undefined,
                        children: [],
                    },
                ],
            },
            {
                key: "settlements",
                label: "Settlement",
                nameLookup: () => undefined,
                children: [],
            },
        ],
    },
];

function formatIssuePath(
    path: readonly (string | number)[],
    raw: unknown,
    message: string,
): string {
    const labels: string[] = [];
    const parentIndices: number[] = [];

    function walk(
        cursor: number,
        resolvers: readonly EntityResolver[],
    ): number {
        for (const resolver of resolvers) {
            if (path[cursor] !== resolver.key) continue;
            const next = cursor + 1;
            if (next < path.length && typeof path[next] === "number") {
                const idx = path[next] as number;
                const name = resolver.nameLookup(raw, idx, parentIndices);
                const label = name
                    ? `${resolver.label} '${name}'`
                    : `${resolver.label} ${idx + 1}`;
                labels.push(label);
                parentIndices.push(idx);
                return walk(next + 1, resolver.children);
            }
            return cursor;
        }
        return cursor;
    }

    const remainingStart = walk(0, ENTITY_RESOLVERS);
    const remaining = path.slice(remainingStart);

    if (labels.length === 0) {
        const prefix = remaining.length > 0 ? `${remaining.join(".")}: ` : "";
        return `${prefix}${message}`;
    }

    const labelStr = labels.join(", ");
    if (remaining.length > 0) {
        return `${labelStr} (${remaining.join(".")}): ${message}`;
    }
    return `${labelStr}: ${message}`;
}

export function parseGlobal(raw: unknown): ParseGlobalResult {
    const result = GlobalSchema.safeParse(raw);

    if (!result.success) {
        const error = result.error.issues
            .map(({ path, message }) =>
                formatIssuePath(path as (string | number)[], raw, message),
            )
            .join("\n");
        return { success: false, error };
    }

    return { success: true, data: result.data };
}
