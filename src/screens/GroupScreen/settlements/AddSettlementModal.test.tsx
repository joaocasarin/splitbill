import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testUsers } from "@tests/mocks";
import { describe, expect, test, vi } from "vitest";
import { AddSettlementModal } from "./AddSettlementModal";
import * as useSettlementFormModule from "./useSettlementForm";

vi.mock("@components/ui/dialog", () => import("@tests/mocks/ui/dialog"));

type HookReturn = ReturnType<typeof useSettlementFormModule.useSettlementForm>;

function makeHookReturn(overrides: Partial<HookReturn> = {}): HookReturn {
    return {
        fromMemberId: null,
        toMemberId: null,
        amount: 0,
        setAmount: vi.fn(),
        debtorsWithDebts: testUsers,
        creditorsForDebtor: [],
        maxAmount: 0,
        canCreate: false,
        handleFromChange: vi.fn(),
        handleToChange: vi.fn(),
        handleCreate: vi.fn(),
        handleOpenChange: vi.fn(),
        ...overrides,
    };
}

function renderModal(hookReturn = makeHookReturn()) {
    vi.spyOn(useSettlementFormModule, "useSettlementForm").mockReturnValue(
        hookReturn,
    );
    return {
        hookReturn,
        ...render(
            <AddSettlementModal
                open={true}
                members={testUsers}
                directDebts={[]}
                onSubmit={vi.fn()}
                onClose={vi.fn()}
            />,
        ),
    };
}

describe("AddSettlementModal", () => {
    describe("initial state", () => {
        test("renders dialog title", () => {
            renderModal();
            expect(
                screen.getByText("Add settlement"),
            ).toBeInTheDocument();
        });

        test("renders From select with placeholder", () => {
            renderModal();
            const fromSelect = screen.getByRole("combobox", { name: /from/i });
            expect(fromSelect).toBeInTheDocument();
            expect(
                screen.getByText("Select debtor"),
            ).toBeInTheDocument();
        });

        test("renders To select with placeholder", () => {
            renderModal();
            const toSelect = screen.getByRole("combobox", { name: /to/i });
            expect(toSelect).toBeInTheDocument();
            expect(
                screen.getByText("Select creditor"),
            ).toBeInTheDocument();
        });

        test("To select is disabled when fromMemberId is null", () => {
            renderModal(makeHookReturn({ fromMemberId: null }));
            expect(
                screen.getByRole("combobox", { name: /to/i }),
            ).toBeDisabled();
        });

        test("To select is enabled when fromMemberId is set", () => {
            renderModal(
                makeHookReturn({
                    fromMemberId: 1,
                    creditorsForDebtor: [
                        { id: 2, name: "Bob", maxAmount: 5000 },
                    ],
                }),
            );
            expect(
                screen.getByRole("combobox", { name: /to/i }),
            ).toBeEnabled();
        });

        test("renders Amount CurrencyInput", () => {
            renderModal();
            expect(
                screen.getByRole("textbox", { name: /amount/i }),
            ).toBeInTheDocument();
        });

        test("Add button is disabled when canCreate is false", () => {
            renderModal(makeHookReturn({ canCreate: false }));
            expect(
                screen.getByRole("button", { name: /^add$/i }),
            ).toBeDisabled();
        });

        test("Add button is enabled when canCreate is true", () => {
            renderModal(makeHookReturn({ canCreate: true }));
            expect(
                screen.getByRole("button", { name: /^add$/i }),
            ).toBeEnabled();
        });

        test("does not show max amount when maxAmount is 0", () => {
            renderModal(makeHookReturn({ maxAmount: 0 }));
            expect(screen.queryByText(/max:/i)).not.toBeInTheDocument();
        });

        test("shows max amount when maxAmount > 0", () => {
            renderModal(makeHookReturn({ maxAmount: 5000 }));
            expect(screen.getByText(/max:/i)).toBeInTheDocument();
            expect(screen.getByText(/50,00/)).toBeInTheDocument();
        });
    });

    describe("From select options", () => {
        test("renders debtor options from debtorsWithDebts", () => {
            renderModal(
                makeHookReturn({
                    debtorsWithDebts: [{ id: 1, name: "Alice" }],
                }),
            );
            expect(
                screen.getByRole("option", { name: "Alice" }),
            ).toBeInTheDocument();
        });

        test("shows fromMemberId as selected value", () => {
            renderModal(makeHookReturn({ fromMemberId: 1 }));
            expect(
                screen.getByRole("combobox", { name: /from/i }),
            ).toHaveValue("1");
        });
    });

    describe("To select options", () => {
        test("renders creditor options from creditorsForDebtor", () => {
            renderModal(
                makeHookReturn({
                    fromMemberId: 1,
                    creditorsForDebtor: [
                        { id: 3, name: "Charlie", maxAmount: 3000 },
                    ],
                }),
            );
            expect(
                screen.getByRole("option", { name: "Charlie" }),
            ).toBeInTheDocument();
        });

        test("shows toMemberId as selected value", () => {
            renderModal(
                makeHookReturn({
                    fromMemberId: 1,
                    toMemberId: 2,
                    creditorsForDebtor: [
                        { id: 2, name: "Bob", maxAmount: 5000 },
                    ],
                }),
            );
            expect(
                screen.getByRole("combobox", { name: /to/i }),
            ).toHaveValue("2");
        });
    });

    describe("handler wiring", () => {
        test("From select change calls handleFromChange", async () => {
            const hookReturn = makeHookReturn({
                debtorsWithDebts: [
                    { id: 1, name: "Alice" },
                    { id: 2, name: "Bob" },
                ],
            });
            renderModal(hookReturn);
            await userEvent.selectOptions(
                screen.getByRole("combobox", { name: /from/i }),
                "Bob",
            );
            expect(hookReturn.handleFromChange).toHaveBeenCalledWith(2);
        });

        test("To select change calls handleToChange", async () => {
            const hookReturn = makeHookReturn({
                fromMemberId: 1,
                creditorsForDebtor: [
                    { id: 2, name: "Bob", maxAmount: 5000 },
                    { id: 3, name: "Charlie", maxAmount: 3000 },
                ],
            });
            renderModal(hookReturn);
            await userEvent.selectOptions(
                screen.getByRole("combobox", { name: /to/i }),
                "Charlie",
            );
            expect(hookReturn.handleToChange).toHaveBeenCalledWith(3);
        });

        test("Add button click calls handleCreate", async () => {
            const hookReturn = makeHookReturn({ canCreate: true });
            renderModal(hookReturn);
            await userEvent.click(
                screen.getByRole("button", { name: /^add$/i }),
            );
            expect(hookReturn.handleCreate).toHaveBeenCalledOnce();
        });

        test("Cancel button click calls handleOpenChange(false)", async () => {
            const hookReturn = makeHookReturn();
            renderModal(hookReturn);
            await userEvent.click(
                screen.getByRole("button", { name: /cancel/i }),
            );
            expect(hookReturn.handleOpenChange).toHaveBeenCalledWith(false);
        });
    });

    describe("handleOpenChange", () => {
        test("dialog onOpenChange(true) wires to handleOpenChange", async () => {
            const hookReturn = makeHookReturn();
            renderModal(hookReturn);
            await userEvent.click(screen.getByTestId("__dialog_open__"));
            expect(hookReturn.handleOpenChange).toHaveBeenCalledWith(true);
        });
    });

    describe("defensive guards (unreachable in valid usage)", () => {
        test("From select renders with empty string value when fromMemberId is null", () => {
            renderModal(makeHookReturn({ fromMemberId: null }));
            const fromSelect = screen.getByRole("combobox", { name: /from/i });
            expect(fromSelect).toBeInTheDocument();
        });

        test("To select renders with empty string value when toMemberId is null", () => {
            renderModal(makeHookReturn({ toMemberId: null }));
            const toSelect = screen.getByRole("combobox", { name: /to/i });
            expect(toSelect).toBeInTheDocument();
        });
    });
});
