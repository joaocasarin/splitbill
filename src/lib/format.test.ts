import { describe, expect, test } from "vitest";
import { formatCurrency } from "./format";

describe("formatCurrency", () => {
    test("formats positive amount in BRL", () => {
        expect(formatCurrency(10000)).toBe("R$\u00a0100,00");
    });

    test("formats negative amount in BRL", () => {
        expect(formatCurrency(-10000)).toBe("-R$\u00a0100,00");
    });

    test("formats zero", () => {
        expect(formatCurrency(0)).toBe("R$\u00a00,00");
    });

    test("formats amount with cents", () => {
        expect(formatCurrency(1050)).toBe("R$\u00a010,50");
    });

    test("formats single cent", () => {
        expect(formatCurrency(1)).toBe("R$\u00a00,01");
    });
});
