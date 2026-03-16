import { describe, expect, test } from "vitest";
import { formatCurrency, formatTimestamp } from "./format";

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

describe("formatTimestamp", () => {
    test("formats timestamp as hh:mm dd/mm/yy", () => {
        const ms = new Date(2026, 2, 15, 14, 30).getTime();
        expect(formatTimestamp(ms)).toBe("14:30 15/03/26");
    });

    test("pads single-digit hours, minutes, day, and month", () => {
        const ms = new Date(2026, 0, 5, 8, 5).getTime();
        expect(formatTimestamp(ms)).toBe("08:05 05/01/26");
    });
});
