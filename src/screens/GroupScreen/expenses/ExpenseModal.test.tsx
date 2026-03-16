import type { Expense } from "@domain/expense";
import * as expenseDomain from "@domain/expense";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testUsers } from "@tests/mocks";
import { setupStoreOnly } from "@tests/setup";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ExpenseModal } from "./ExpenseModal";
import * as useExpenseFormModule from "./useExpenseForm";

vi.mock("@components/ui/dialog", () => import("@tests/mocks/ui/dialog"));
vi.mock("./EqualSplitSection", () => ({
    EqualSplitSection: ({
        members,
        participantIds,
        onToggle,
    }: {
        members: { id: number; name: string }[];
        participantIds: Set<number>;
        onToggle: (id: number) => void;
    }) => (
        <ul>
            {members.map((m) => (
                <li key={m.id}>
                    <label>
                        <input
                            type="checkbox"
                            aria-label={m.name}
                            checked={participantIds.has(m.id)}
                            onChange={() => onToggle(m.id)}
                        />
                        {m.name}
                    </label>
                </li>
            ))}
        </ul>
    ),
}));
vi.mock("./FixedSplitSection", () => ({
    FixedSplitSection: ({
        members,
        shares,
        onShareChange,
    }: {
        members: { id: number; name: string }[];
        shares: Map<number, number>;
        onShareChange: (id: number, value: number) => void;
    }) => (
        <div>
            {members.map((m) => (
                <div key={m.id}>
                    <label htmlFor={`mock-fixed-${m.id}`}>{m.name}</label>
                    <input
                        id={`mock-fixed-${m.id}`}
                        type="text"
                        defaultValue={shares.get(m.id) ?? 0}
                        onChange={(e) =>
                            onShareChange(m.id, Number(e.target.value))
                        }
                    />
                </div>
            ))}
        </div>
    ),
}));
vi.mock("./PercentageSplitSection", () => ({
    PercentageSplitSection: ({
        members,
        shares,
        onShareChange,
    }: {
        members: { id: number; name: string }[];
        shares: Map<number, number>;
        onShareChange: (id: number, percentage: number) => void;
    }) => (
        <div>
            {members.map((m) => (
                <div key={m.id}>
                    <label htmlFor={`mock-pct-${m.id}`}>{m.name}</label>
                    <input
                        id={`mock-pct-${m.id}`}
                        type="number"
                        defaultValue={shares.get(m.id) ?? 0}
                        onChange={(e) =>
                            onShareChange(m.id, Number(e.target.value))
                        }
                    />
                </div>
            ))}
        </div>
    ),
}));
vi.mock("./SplitModeToggle", () => ({
    SplitModeToggle: ({
        splitMode,
        onChange,
    }: {
        splitMode: string;
        onChange: (m: string) => void;
    }) => (
        <div>
            {expenseDomain.SplitModeSchema.options.map((mode) => (
                <button
                    key={mode}
                    type="button"
                    aria-pressed={splitMode === mode}
                    onClick={() => onChange(mode)}
                >
                    {mode}
                </button>
            ))}
        </div>
    ),
}));

const members = testUsers;

function makeHookReturn(
    overrides: Partial<
        ReturnType<typeof useExpenseFormModule.useExpenseForm>
    > = {},
): ReturnType<typeof useExpenseFormModule.useExpenseForm> {
    return {
        members,
        isEditing: false,
        title: "",
        setTitle: vi.fn(),
        total: 0,
        setTotal: vi.fn(),
        payerId: 1,
        splitMode: "equal" as expenseDomain.SplitMode,
        setSplitMode: vi.fn(),
        participantIds: new Set([1]),
        fixedShares: new Map([
            [1, 0],
            [2, 0],
        ]),
        percentageShares: new Map([
            [1, 0],
            [2, 0],
        ]),
        canSubmit: false,
        toggleParticipant: vi.fn(),
        handlePayerChange: vi.fn(),
        handleFixedShareChange: vi.fn(),
        handlePercentageShareChange: vi.fn(),
        handleSubmit: vi.fn(),
        handleOpenChange: vi.fn(),
        ...overrides,
    };
}

beforeEach(() => {
    setupStoreOnly();
});

function renderModal(
    hookReturn = makeHookReturn(),
    options: {
        onClose?: () => void;
        expense?: Expense;
        onDelete?: (id: number) => void;
    } = {},
) {
    const onClose = options.onClose ?? vi.fn();
    const onDelete = options.onDelete ?? vi.fn();
    vi.spyOn(useExpenseFormModule, "useExpenseForm").mockReturnValue(
        hookReturn,
    );
    return {
        onClose,
        onDelete,
        hookReturn,
        ...render(
            <ExpenseModal
                groupId={1}
                open={true}
                onClose={onClose}
                expense={options.expense}
                onDelete={onDelete}
            />,
        ),
    };
}

describe("ExpenseModal", () => {
    describe("add mode", () => {
        test("renders 'Add expense' title", () => {
            renderModal();
            expect(screen.getByText("Add expense")).toBeInTheDocument();
        });

        test("renders 'Add' submit button", () => {
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
        const expense: Expense = {
            id: 42,
            title: "Hotel",
            total: 10000,
            payerId: 1,
            splitMode: "equal",
            memberIds: [1, 2],
            createdAt: 1000000,
        };

        test("renders 'Edit expense' title", () => {
            renderModal(makeHookReturn({ isEditing: true }), { expense });
            expect(screen.getByText("Edit expense")).toBeInTheDocument();
        });

        test("renders 'Save' submit button", () => {
            renderModal(makeHookReturn({ isEditing: true }), { expense });
            expect(
                screen.getByRole("button", { name: /^save$/i }),
            ).toBeInTheDocument();
        });

        test("renders Delete button", () => {
            renderModal(makeHookReturn({ isEditing: true }), { expense });
            expect(
                screen.getByRole("button", { name: /^delete$/i }),
            ).toBeInTheDocument();
        });

        test("Save button is disabled when canSubmit is false", () => {
            renderModal(makeHookReturn({ isEditing: true, canSubmit: false }), {
                expense,
            });
            expect(
                screen.getByRole("button", { name: /^save$/i }),
            ).toBeDisabled();
        });

        test("Save button is enabled when canSubmit is true", () => {
            renderModal(makeHookReturn({ isEditing: true, canSubmit: true }), {
                expense,
            });
            expect(
                screen.getByRole("button", { name: /^save$/i }),
            ).toBeEnabled();
        });

        test("Save button click calls handleSubmit", async () => {
            const hookReturn = makeHookReturn({
                isEditing: true,
                canSubmit: true,
            });
            renderModal(hookReturn, { expense });
            await userEvent.click(
                screen.getByRole("button", { name: /^save$/i }),
            );
            expect(hookReturn.handleSubmit).toHaveBeenCalledOnce();
        });

        test("Delete button click calls onDelete with expense id and onClose", async () => {
            const hookReturn = makeHookReturn({ isEditing: true });
            const onDelete = vi.fn();
            const onClose = vi.fn();
            renderModal(hookReturn, { expense, onDelete, onClose });
            await userEvent.click(
                screen.getByRole("button", { name: /^delete$/i }),
            );
            expect(onDelete).toHaveBeenCalledWith(42);
            expect(onClose).toHaveBeenCalledOnce();
        });
    });

    describe("initial state", () => {
        test("renders title input with hook title value", () => {
            renderModal(makeHookReturn({ title: "Hotel" }));
            expect(screen.getByPlaceholderText(/e\.g\./i)).toHaveValue("Hotel");
        });

        test("renders total CurrencyInput", () => {
            renderModal();
            expect(
                screen.getByRole("textbox", { name: /total/i }),
            ).toBeInTheDocument();
        });

        test("renders paid by select with member options", () => {
            renderModal();
            expect(
                screen.getByRole("combobox", { name: /paid by/i }),
            ).toBeInTheDocument();
            expect(
                screen.getByRole("option", { name: "Alice" }),
            ).toBeInTheDocument();
            expect(
                screen.getByRole("option", { name: "Bob" }),
            ).toBeInTheDocument();
        });

        test("payer select shows payerId as selected value", () => {
            renderModal(makeHookReturn({ payerId: 2 }));
            expect(
                screen.getByRole("combobox", { name: /paid by/i }),
            ).toHaveValue("2");
        });
    });

    describe("split mode sections", () => {
        test("renders EqualSplitSection when splitMode is equal", () => {
            renderModal(makeHookReturn({ splitMode: "equal" }));
            expect(
                screen.getByRole("checkbox", { name: "Alice" }),
            ).toBeInTheDocument();
        });

        test("renders FixedSplitSection when splitMode is fixed", () => {
            renderModal(makeHookReturn({ splitMode: "fixed" }));
            expect(
                screen.getByRole("textbox", { name: "Alice" }),
            ).toBeInTheDocument();
        });

        test("renders PercentageSplitSection when splitMode is percentage", () => {
            renderModal(makeHookReturn({ splitMode: "percentage" }));
            expect(screen.getAllByRole("spinbutton")).toHaveLength(2);
        });

        test("does not render EqualSplitSection when splitMode is fixed", () => {
            renderModal(makeHookReturn({ splitMode: "fixed" }));
            expect(
                screen.queryByRole("checkbox", { name: "Alice" }),
            ).not.toBeInTheDocument();
        });
    });

    describe("handler wiring", () => {
        test("title input change calls setTitle", async () => {
            const hookReturn = makeHookReturn();
            renderModal(hookReturn);
            await userEvent.type(screen.getByPlaceholderText(/e\.g\./i), "H");
            expect(hookReturn.setTitle).toHaveBeenCalled();
        });

        test("payer select change calls handlePayerChange", async () => {
            const hookReturn = makeHookReturn();
            renderModal(hookReturn);
            await userEvent.selectOptions(
                screen.getByRole("combobox", { name: /paid by/i }),
                "Bob",
            );
            expect(hookReturn.handlePayerChange).toHaveBeenCalledWith(2);
        });

        test("SplitModeToggle onChange calls setSplitMode", async () => {
            const hookReturn = makeHookReturn();
            renderModal(hookReturn);
            await userEvent.click(
                screen.getByRole("button", { name: /fixed/i }),
            );
            expect(hookReturn.setSplitMode).toHaveBeenCalledWith("fixed");
        });

        test("EqualSplitSection onToggle calls toggleParticipant", async () => {
            const hookReturn = makeHookReturn({ splitMode: "equal" });
            renderModal(hookReturn);
            await userEvent.click(
                screen.getByRole("checkbox", { name: "Bob" }),
            );
            expect(hookReturn.toggleParticipant).toHaveBeenCalledWith(2);
        });

        test("FixedSplitSection onShareChange calls handleFixedShareChange", () => {
            const hookReturn = makeHookReturn({ splitMode: "fixed" });
            renderModal(hookReturn);
            fireEvent.change(screen.getByRole("textbox", { name: "Bob" }), {
                target: { value: "500" },
            });
            expect(hookReturn.handleFixedShareChange).toHaveBeenCalledWith(
                2,
                500,
            );
        });

        test("PercentageSplitSection onShareChange calls handlePercentageShareChange", () => {
            const hookReturn = makeHookReturn({ splitMode: "percentage" });
            renderModal(hookReturn);
            const spinbuttons = screen.getAllByRole("spinbutton");
            fireEvent.change(spinbuttons[1], { target: { value: "50" } });
            expect(hookReturn.handlePercentageShareChange).toHaveBeenCalledWith(
                2,
                50,
            );
        });

        test("Add button click calls handleSubmit", async () => {
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
        test("select renders with empty string value when payerId is null", () => {
            renderModal(makeHookReturn({ payerId: null }));
            const select = screen.getByRole("combobox", { name: /paid by/i });
            expect(select).toBeInTheDocument();
        });

        test("handleDelete is a no-op when expense is undefined", async () => {
            const hookReturn = makeHookReturn({ isEditing: true });
            const onDelete = vi.fn();
            renderModal(hookReturn, { onDelete });
            await userEvent.click(
                screen.getByRole("button", { name: /^delete$/i }),
            );
            expect(onDelete).not.toHaveBeenCalled();
        });
    });
});
