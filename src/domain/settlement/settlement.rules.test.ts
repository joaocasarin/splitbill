import { directDebts } from "@tests/mocks/balance";
import { describe, expect, test } from "vitest";
import { validateSettlementCreation } from "./settlement.rules";

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
