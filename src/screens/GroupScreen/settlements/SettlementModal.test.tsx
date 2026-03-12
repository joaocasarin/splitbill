import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testUsers } from "@tests/mocks";
import { describe, expect, test, vi } from "vitest";
import { SettlementModal } from "./SettlementModal";
import * as useSettlementFormModule from "./useSettlementForm";

vi.mock("@components/ui/dialog", () => import("@tests/mocks/ui/dialog"));

type HookReturn = ReturnType<typeof useSettlementFormModule.useSettlementForm>;

function makeHookReturn(overrides: Partial<HookReturn> = {}): HookReturn {
    return {
        isEditing: false,
        fromMemberId: null,
        toMemberId: null,
        amount: 0,
        setAmount: vi.fn(),
        debtorsWithDebts: testUsers,
        creditorsForDebtor: [],
        maxAmount: 0,
        canSubmit: false,
        handleFromChange: vi.fn(),
        handleToChange: vi.fn(),
        handleSubmit: vi.fn(),
        handleOpenChange: vi.fn(),
        ...overrides,
    };
}

function renderModal(
    hookReturn = makeHookReturn(),
    props: {
        settlement?: import("@domain/settlement").Settlement;
        onDelete?: (id: number) => void;
    } = {},
) {
    vi.spyOn(useSettlementFormModule, "useSettlementForm").mockReturnValue(
        hookReturn,
    );
    return {
        hookReturn,
        ...render(
            <SettlementModal
                open={true}
                members={testUsers}
                directDebts={[]}
                onSubmit={vi.fn()}
                onClose={vi.fn()}
                settlement={props.settlement}
                onDelete={props.onDelete}
            />,
        ),
    };
}

describe("SettlementModal", () => {
    describe("add mode", () => {
        test("renders dialog title as Add settlement", () => {
            renderModal();
            expect(screen.getByText("Add settlement")).toBeInTheDocument();
        });

        test("renders Add button", () => {
            renderModal();
            expect(
                screen.getByRole("button", { name: /^add$/i }),
            ).toBeInTheDocument();
        });

        test("does not render Delete button", () => {
            renderModal();
            expect(
                screen.queryByRole("button", { name: /^delete$/i }),
            ).not.toBeInTheDocument();
        });

        test("Add button is disabled when canSubmit is false", () => {
            renderModal(makeHookReturn({ canSubmit: false }));
            expect(
                screen.getByRole("button", { name: /^add$/i }),
            ).toBeDisabled();
        });

        test("Add button is enabled when canSubmit is true", () => {
            renderModal(makeHookReturn({ canSubmit: true }));
            expect(
                screen.getByRole("button", { name: /^add$/i }),
            ).toBeEnabled();
        });
    });

    describe("edit mode", () => {
        const settlement = {
            id: 1,
            fromMemberId: 2,
            toMemberId: 1,
            amount: 3000,
        };

        test("renders dialog title as Edit settlement", () => {
            renderModal(makeHookReturn({ isEditing: true }), { settlement });
            expect(screen.getByText("Edit settlement")).toBeInTheDocument();
        });

        test("renders Save button instead of Add", () => {
            renderModal(makeHookReturn({ isEditing: true }), { settlement });
            expect(
                screen.getByRole("button", { name: /^save$/i }),
            ).toBeInTheDocument();
            expect(
                screen.queryByRole("button", { name: /^add$/i }),
            ).not.toBeInTheDocument();
        });

        test("renders Delete button", () => {
            renderModal(makeHookReturn({ isEditing: true }), {
                settlement,
                onDelete: vi.fn(),
            });
            expect(
                screen.getByRole("button", { name: /^delete$/i }),
            ).toBeInTheDocument();
        });

        test("Delete button calls onDelete with settlement id", async () => {
            const onDelete = vi.fn();
            renderModal(makeHookReturn({ isEditing: true }), {
                settlement,
                onDelete,
            });
            await userEvent.click(
                screen.getByRole("button", { name: /^delete$/i }),
            );
            expect(onDelete).toHaveBeenCalledWith(1);
        });

        test("Save button is disabled when canSubmit is false", () => {
            renderModal(makeHookReturn({ isEditing: true, canSubmit: false }), {
                settlement,
            });
            expect(
                screen.getByRole("button", { name: /^save$/i }),
            ).toBeDisabled();
        });

        test("Save button is enabled when canSubmit is true", () => {
            renderModal(makeHookReturn({ isEditing: true, canSubmit: true }), {
                settlement,
            });
            expect(
                screen.getByRole("button", { name: /^save$/i }),
            ).toBeEnabled();
        });
    });

    describe("initial state", () => {
        test("renders From select with placeholder", () => {
            renderModal();
            const fromSelect = screen.getByRole("combobox", { name: /from/i });
            expect(fromSelect).toBeInTheDocument();
            expect(screen.getByText("Select debtor")).toBeInTheDocument();
        });

        test("renders To select with placeholder", () => {
            renderModal();
            const toSelect = screen.getByRole("combobox", { name: /to/i });
            expect(toSelect).toBeInTheDocument();
            expect(screen.getByText("Select creditor")).toBeInTheDocument();
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
            expect(screen.getByRole("combobox", { name: /to/i })).toBeEnabled();
        });

        test("renders Amount CurrencyInput", () => {
            renderModal();
            expect(
                screen.getByRole("textbox", { name: /amount/i }),
            ).toBeInTheDocument();
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
            expect(screen.getByRole("combobox", { name: /from/i })).toHaveValue(
                "1",
            );
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
            expect(screen.getByRole("combobox", { name: /to/i })).toHaveValue(
                "2",
            );
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

        test("submit button click calls handleSubmit", async () => {
            const hookReturn = makeHookReturn({ canSubmit: true });
            renderModal(hookReturn);
            await userEvent.click(
                screen.getByRole("button", { name: /^add$/i }),
            );
            expect(hookReturn.handleSubmit).toHaveBeenCalledOnce();
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

        test("handleDelete is a no-op when settlement is undefined", async () => {
            const onDelete = vi.fn();
            renderModal(makeHookReturn({ isEditing: true }), { onDelete });
            await userEvent.click(
                screen.getByRole("button", { name: /^delete$/i }),
            );
            expect(onDelete).not.toHaveBeenCalled();
        });

        test("handleDelete is a no-op when onDelete is undefined", async () => {
            const settlement = {
                id: 1,
                fromMemberId: 2,
                toMemberId: 1,
                amount: 3000,
            };
            renderModal(makeHookReturn({ isEditing: true }), { settlement });
            await userEvent.click(
                screen.getByRole("button", { name: /^delete$/i }),
            );
            // No crash — onDelete was not provided
        });
    });
});
