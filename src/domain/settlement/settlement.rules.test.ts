import type { DirectDebt } from "@domain/balance";
import type { Settlement } from "@domain/settlement";
import { directDebts } from "@tests/mocks";
import { describe, expect, test } from "vitest";
import {
    validateSettlementCreation,
    validateSettlementsStillValid,
} from "./settlement.rules";

describe("validateSettlementCreation", () => {
    test("returns valid when direct debt exists and amount is within debt", () => {
        const result = validateSettlementCreation(directDebts, 1, 2, 3000);
        expect(result.valid).toBe(true);
    });

    test("returns valid when amount equals exact debt", () => {
        const result = validateSettlementCreation(directDebts, 1, 2, 5000);
        expect(result.valid).toBe(true);
    });

    test("returns invalid when no direct debt from fromMember to toMember", () => {
        const result = validateSettlementCreation(directDebts, 2, 1, 1000);
        expect(result.valid).toBe(false);
        expect(result.valid === false && result.reason).toBe(
            "no direct debt from fromMember to toMember",
        );
    });

    test("returns invalid when fromMember not in debts", () => {
        const result = validateSettlementCreation(directDebts, 99, 2, 1000);
        expect(result.valid).toBe(false);
        expect(result.valid === false && result.reason).toBe(
            "no direct debt from fromMember to toMember",
        );
    });

    test("returns invalid when toMember not in debts", () => {
        const result = validateSettlementCreation(directDebts, 1, 99, 1000);
        expect(result.valid).toBe(false);
        expect(result.valid === false && result.reason).toBe(
            "no direct debt from fromMember to toMember",
        );
    });

    test("returns invalid when amount exceeds debt", () => {
        const result = validateSettlementCreation(directDebts, 1, 2, 6000);
        expect(result.valid).toBe(false);
        expect(result.valid === false && result.reason).toBe(
            "amount exceeds outstanding debt",
        );
    });
});

describe("validateSettlementsStillValid", () => {
    const debts: DirectDebt[] = [
        { fromMemberId: 1, toMemberId: 2, amount: 5000 },
    ];

    test("returns valid when no settlements exist", () => {
        const result = validateSettlementsStillValid(debts, []);
        expect(result.valid).toBe(true);
    });

    test("returns valid when all settlements are within debt", () => {
        const settlements: Settlement[] = [
            { id: 1, fromMemberId: 1, toMemberId: 2, amount: 3000 },
        ];
        const result = validateSettlementsStillValid(debts, settlements);
        expect(result.valid).toBe(true);
    });

    test("returns invalid when a settlement exceeds debt", () => {
        const settlements: Settlement[] = [
            { id: 1, fromMemberId: 1, toMemberId: 2, amount: 6000 },
        ];
        const result = validateSettlementsStillValid(debts, settlements);
        expect(result.valid).toBe(false);
        expect(result.valid === false && result.reason).toBe(
            "existing settlements would become invalid",
        );
    });

    test("returns invalid when a settlement has no matching debt", () => {
        const settlements: Settlement[] = [
            { id: 1, fromMemberId: 2, toMemberId: 1, amount: 1000 },
        ];
        const result = validateSettlementsStillValid(debts, settlements);
        expect(result.valid).toBe(false);
    });

    test("returns valid when multiple settlements are all within debts", () => {
        const multiDebts: DirectDebt[] = [
            { fromMemberId: 1, toMemberId: 2, amount: 5000 },
            { fromMemberId: 3, toMemberId: 2, amount: 3000 },
        ];
        const settlements: Settlement[] = [
            { id: 1, fromMemberId: 1, toMemberId: 2, amount: 5000 },
            { id: 2, fromMemberId: 3, toMemberId: 2, amount: 2000 },
        ];
        const result = validateSettlementsStillValid(multiDebts, settlements);
        expect(result.valid).toBe(true);
    });

    test("returns invalid when one of multiple settlements is invalid", () => {
        const settlements: Settlement[] = [
            { id: 1, fromMemberId: 1, toMemberId: 2, amount: 3000 },
            { id: 2, fromMemberId: 2, toMemberId: 1, amount: 1000 },
        ];
        const result = validateSettlementsStillValid(debts, settlements);
        expect(result.valid).toBe(false);
    });
});
