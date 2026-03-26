import { GROUP_MEMBERS_MIN } from "@domain/common";
import { describe, expect, test } from "vitest";
import type { MemberBalance } from "../balance";
import { validateMemberDeletion } from "./member.rules";

const balanceZero: MemberBalance = { memberId: 1, amount: 0 };
const balancePositive: MemberBalance = { memberId: 1, amount: 5000 };
const balanceNegative: MemberBalance = { memberId: 1, amount: -5000 };

describe("validateMemberDeletion", () => {
    describe("balance guard", () => {
        test("returns invalid when member has positive balance", () => {
            const result = validateMemberDeletion(
                1,
                [balancePositive],
                GROUP_MEMBERS_MIN + 1,
            );
            expect(result).toEqual({
                valid: false,
                reason: "Member has a non-zero balance",
            });
        });

        test("returns invalid when member has negative balance", () => {
            const result = validateMemberDeletion(
                1,
                [balanceNegative],
                GROUP_MEMBERS_MIN + 1,
            );
            expect(result).toEqual({
                valid: false,
                reason: "Member has a non-zero balance",
            });
        });
    });

    describe("active count guard", () => {
        test("returns invalid when removal would leave fewer than GROUP_MEMBERS_MIN active members", () => {
            const result = validateMemberDeletion(
                1,
                [balanceZero],
                GROUP_MEMBERS_MIN,
            );
            expect(result).toEqual({
                valid: false,
                reason: `Group must retain at least ${GROUP_MEMBERS_MIN} active members`,
            });
        });
    });

    describe("valid cases", () => {
        test("returns valid when balance is zero and active count allows removal", () => {
            const result = validateMemberDeletion(
                1,
                [balanceZero],
                GROUP_MEMBERS_MIN + 1,
            );
            expect(result).toEqual({ valid: true });
        });
    });

    describe("defensive guards (unreachable in valid usage)", () => {
        test("returns valid when member has no balance entry (treated as zero)", () => {
            const result = validateMemberDeletion(1, [], GROUP_MEMBERS_MIN + 1);
            expect(result).toEqual({ valid: true });
        });
    });
});
