import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { CurrencyInput } from "./CurrencyInput";

function renderInput(value = 0, onChange = vi.fn()) {
    return {
        onChange,
        ...render(
            <CurrencyInput label="Amount" value={value} onChange={onChange} />,
        ),
    };
}

describe("CurrencyInput", () => {
    describe("display", () => {
        test("renders label", () => {
            renderInput();
            expect(screen.getByText("Amount")).toBeInTheDocument();
        });

        test("shows 0,00 when value is 0", () => {
            renderInput(0);
            expect(screen.getByRole("textbox")).toHaveValue("0,00");
        });

        test("shows correct display for non-zero cents", () => {
            renderInput(12345);
            expect(screen.getByRole("textbox")).toHaveValue("123,45");
        });

        test("shows R$ prefix", () => {
            renderInput();
            expect(screen.getByText("R$")).toBeInTheDocument();
        });
    });

    describe("digit input", () => {
        test("pressing a digit calls onChange with value * 10 + digit", async () => {
            const { onChange } = renderInput(0);

            await userEvent.type(screen.getByRole("textbox"), "1");

            expect(onChange).toHaveBeenCalledWith(1);
        });

        test("pressing multiple digits accumulates correctly", async () => {
            const onChange = vi.fn();
            const { rerender } = render(
                <CurrencyInput label="Amount" onChange={onChange} value={0} />,
            );

            await userEvent.type(screen.getByRole("textbox"), "1");
            expect(onChange).toHaveBeenCalledWith(1);

            rerender(
                <CurrencyInput label="Amount" onChange={onChange} value={1} />,
            );
            await userEvent.type(screen.getByRole("textbox"), "2");
            expect(onChange).toHaveBeenCalledWith(12);

            rerender(
                <CurrencyInput label="Amount" onChange={onChange} value={12} />,
            );
            await userEvent.type(screen.getByRole("textbox"), "3");
            expect(onChange).toHaveBeenCalledWith(123);
        });

        test("ignores non-digit keys", async () => {
            const { onChange } = renderInput(0);

            await userEvent.type(screen.getByRole("textbox"), "a");

            expect(onChange).not.toHaveBeenCalled();
        });

        test("ignores special keys like Enter", async () => {
            const { onChange } = renderInput(0);

            await userEvent.type(screen.getByRole("textbox"), "{enter}");

            expect(onChange).not.toHaveBeenCalled();
        });

        test("native change event does not call onChange", () => {
            const { onChange } = renderInput(0);
            fireEvent.change(screen.getByRole("textbox"), {
                target: { value: "999" },
            });
            expect(onChange).not.toHaveBeenCalled();
        });
    });

    describe("backspace", () => {
        test("pressing backspace calls onChange with Math.floor(value / 10)", async () => {
            const { onChange } = renderInput(123);

            await userEvent.type(screen.getByRole("textbox"), "{backspace}");

            expect(onChange).toHaveBeenCalledWith(12);
        });

        test("pressing backspace on single digit calls onChange with 0", async () => {
            const { onChange } = renderInput(1);

            await userEvent.type(screen.getByRole("textbox"), "{backspace}");

            expect(onChange).toHaveBeenCalledWith(0);
        });

        test("pressing backspace on 0 calls onChange with 0", async () => {
            const { onChange } = renderInput(0);

            await userEvent.type(screen.getByRole("textbox"), "{backspace}");

            expect(onChange).toHaveBeenCalledWith(0);
        });
    });
});
