import { SCHEMA_VERSION } from "@domain/common";
import { baseGroup, emptyGlobal } from "@tests/mocks";
import { describe, expect, test } from "vitest";
import { parseGlobal } from "./parse-global";

describe("parseGlobal", () => {
    describe("valid input", () => {
        test("returns success with data for a valid Global object", () => {
            const result = parseGlobal(emptyGlobal);
            expect(result).toEqual({ success: true, data: emptyGlobal });
        });

        test("returns success with data for a Global with groups", () => {
            const result = parseGlobal({
                version: SCHEMA_VERSION,
                groups: [baseGroup],
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.groups).toHaveLength(1);
            }
        });
    });

    describe("invalid schema", () => {
        test("returns failure when version field is missing", () => {
            const result = parseGlobal({ groups: [] });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeTruthy();
            }
        });

        test("returns failure when groups field is missing", () => {
            const result = parseGlobal({ version: SCHEMA_VERSION });
            expect(result.success).toBe(false);
        });

        test("returns failure when groups contains invalid members", () => {
            const result = parseGlobal({
                version: SCHEMA_VERSION,
                groups: [{ id: 1, name: "Trip" }],
            });
            expect(result.success).toBe(false);
        });

        test("returns failure when groups has duplicate IDs", () => {
            const result = parseGlobal({
                version: SCHEMA_VERSION,
                groups: [baseGroup, baseGroup],
            });
            expect(result.success).toBe(false);
        });
    });

    describe("non-object input", () => {
        test("returns failure for null", () => {
            const result = parseGlobal(null);
            expect(result.success).toBe(false);
        });

        test("returns failure for a string", () => {
            const result = parseGlobal("not an object");
            expect(result.success).toBe(false);
        });

        test("returns failure for an array", () => {
            const result = parseGlobal([]);
            expect(result.success).toBe(false);
        });

        test("returns failure for a number", () => {
            const result = parseGlobal(42);
            expect(result.success).toBe(false);
        });

        test("returns failure for undefined", () => {
            const result = parseGlobal(undefined);
            expect(result.success).toBe(false);
        });
    });
});
