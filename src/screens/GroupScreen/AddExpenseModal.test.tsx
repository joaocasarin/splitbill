import { EXPENSE_TITLE_MAX } from "@domain/common";
import * as expenseDomain from "@domain/expense";
import { useAppStore } from "@store";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupGroupWithTwoMembers } from "@tests/helpers";
import { setupStoreOnly } from "@tests/setup";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { AddExpenseModal } from "./AddExpenseModal";

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

beforeEach(() => {
    setupStoreOnly();
});

afterEach(() => {
    vi.restoreAllMocks();
});

function renderModal(open = true, onClose = vi.fn()) {
    const group = setupGroupWithTwoMembers();
    return {
        group,
        onClose,
        ...render(
            <AddExpenseModal
                groupId={group.id}
                open={open}
                onClose={onClose}
            />,
        ),
    };
}

async function fillValidForm() {
    await userEvent.type(screen.getByPlaceholderText(/e\.g\./i), "Hotel");
    fireEvent.keyDown(screen.getByRole("textbox", { name: /total/i }), {
        key: "1",
    });
    await userEvent.click(screen.getByRole("checkbox", { name: "Bob" }));
}

async function fillValidFormFixed() {
    await userEvent.type(screen.getByPlaceholderText(/e\.g\./i), "Hotel");
    fireEvent.keyDown(screen.getByRole("textbox", { name: /total/i }), {
        key: "1",
    });
    await userEvent.click(screen.getByRole("button", { name: /fixed/i }));
    // Set Bob's share to 1 cent (total = 1 cent) via mock input
    fireEvent.change(screen.getByRole("textbox", { name: "Bob" }), {
        target: { value: "1" },
    });
}

async function fillValidFormPercentage() {
    await userEvent.type(screen.getByPlaceholderText(/e\.g\./i), "Hotel");
    fireEvent.keyDown(screen.getByRole("textbox", { name: /total/i }), {
        key: "1",
    });
    await userEvent.click(screen.getByRole("button", { name: /percentage/i }));
    // Set Alice 50% and Bob 50% (spinbuttons ordered by member)
    const spinbuttons = screen.getAllByRole("spinbutton");
    fireEvent.change(spinbuttons[0], { target: { value: "50" } });
    fireEvent.change(spinbuttons[1], { target: { value: "50" } });
}

describe("AddExpenseModal", () => {
    describe("initial state", () => {
        test("renders title input", () => {
            renderModal();
            expect(screen.getByPlaceholderText(/e\.g\./i)).toBeInTheDocument();
        });

        test("renders total input showing 0,00", () => {
            renderModal();
            expect(screen.getByRole("textbox", { name: /total/i })).toHaveValue(
                "0,00",
            );
        });

        test("renders paid by select", () => {
            renderModal();
            expect(
                screen.getByRole("combobox", { name: /paid by/i }),
            ).toBeInTheDocument();
        });

        test("renders a checkbox for each member", () => {
            renderModal();
            expect(
                screen.getByRole("checkbox", { name: "Alice" }),
            ).toBeInTheDocument();
            expect(
                screen.getByRole("checkbox", { name: "Bob" }),
            ).toBeInTheDocument();
        });

        test("first member is pre-selected as payer", () => {
            renderModal();
            expect(
                screen.getByRole("combobox", { name: /paid by/i }),
            ).toHaveValue("1");
        });

        test("first member is pre-checked as participant", () => {
            renderModal();
            expect(
                screen.getByRole("checkbox", { name: "Alice" }),
            ).toBeChecked();
        });

        test("Add button is disabled initially", () => {
            renderModal();
            expect(
                screen.getByRole("button", { name: /^add$/i }),
            ).toBeDisabled();
        });

        test("renders empty state when group does not exist", () => {
            render(
                <AddExpenseModal groupId={999} open={true} onClose={vi.fn()} />,
            );
            expect(
                screen.getByRole("button", { name: /^add$/i }),
            ).toBeDisabled();
        });
    });

    describe("payer select", () => {
        test("shows member names as options", () => {
            renderModal();
            expect(
                screen.getByRole("option", { name: "Alice" }),
            ).toBeInTheDocument();
            expect(
                screen.getByRole("option", { name: "Bob" }),
            ).toBeInTheDocument();
        });

        test("changing payer auto-adds them as participant", async () => {
            renderModal();
            await userEvent.selectOptions(
                screen.getByRole("combobox", { name: /paid by/i }),
                "Bob",
            );
            expect(screen.getByRole("checkbox", { name: "Bob" })).toBeChecked();
        });
    });

    describe("participant checkboxes", () => {
        test("clicking unchecked checkbox selects participant", async () => {
            renderModal();
            await userEvent.click(
                screen.getByRole("checkbox", { name: "Bob" }),
            );
            expect(screen.getByRole("checkbox", { name: "Bob" })).toBeChecked();
        });

        test("clicking checked checkbox deselects participant", async () => {
            renderModal();
            await userEvent.click(
                screen.getByRole("checkbox", { name: "Alice" }),
            );
            expect(
                screen.getByRole("checkbox", { name: "Alice" }),
            ).not.toBeChecked();
        });

        test("payer can be removed from participants", async () => {
            renderModal();
            await userEvent.click(
                screen.getByRole("checkbox", { name: "Alice" }),
            );
            expect(
                screen.getByRole("checkbox", { name: "Alice" }),
            ).not.toBeChecked();
            expect(
                screen.getByRole("combobox", { name: /paid by/i }),
            ).toHaveValue("1");
        });
    });

    describe("split mode sections", () => {
        test("switching to fixed shows fixed shares section", async () => {
            renderModal();
            await userEvent.click(
                screen.getByRole("button", { name: /fixed/i }),
            );
            expect(
                screen.getByRole("button", { name: /fixed/i }),
            ).toHaveAttribute("aria-pressed", "true");
            expect(
                screen.getByRole("textbox", { name: "Alice" }),
            ).toBeInTheDocument();
            expect(
                screen.getByRole("textbox", { name: "Bob" }),
            ).toBeInTheDocument();
        });

        test("switching to percentage shows percentage shares section", async () => {
            renderModal();
            await userEvent.click(
                screen.getByRole("button", { name: /percentage/i }),
            );
            expect(
                screen.getByRole("button", { name: /percentage/i }),
            ).toHaveAttribute("aria-pressed", "true");
            expect(screen.getAllByRole("spinbutton")).toHaveLength(2);
        });

        test("switching back to equal shows participant checkboxes", async () => {
            renderModal();
            await userEvent.click(
                screen.getByRole("button", { name: /fixed/i }),
            );
            await userEvent.click(
                screen.getByRole("button", { name: /equal/i }),
            );
            expect(
                screen.getByRole("checkbox", { name: "Alice" }),
            ).toBeInTheDocument();
        });
    });

    describe("validation", () => {
        describe("equal split", () => {
            test("Add is disabled when title is too short", async () => {
                renderModal();
                await userEvent.type(
                    screen.getByPlaceholderText(/e\.g\./i),
                    "Hi",
                );
                fireEvent.keyDown(
                    screen.getByRole("textbox", { name: /total/i }),
                    { key: "1" },
                );
                await userEvent.click(
                    screen.getByRole("checkbox", { name: "Bob" }),
                );
                expect(
                    screen.getByRole("button", { name: /^add$/i }),
                ).toBeDisabled();
            });

            test("Add is disabled when total is 0", async () => {
                renderModal();
                await userEvent.type(
                    screen.getByPlaceholderText(/e\.g\./i),
                    "Hotel",
                );
                await userEvent.click(
                    screen.getByRole("checkbox", { name: "Bob" }),
                );
                expect(
                    screen.getByRole("button", { name: /^add$/i }),
                ).toBeDisabled();
            });

            test("Add is disabled when only the payer is a participant", async () => {
                renderModal();
                await userEvent.type(
                    screen.getByPlaceholderText(/e\.g\./i),
                    "Hotel",
                );
                fireEvent.keyDown(
                    screen.getByRole("textbox", { name: /total/i }),
                    { key: "1" },
                );
                expect(
                    screen.getByRole("button", { name: /^add$/i }),
                ).toBeDisabled();
            });

            test("Add is enabled with one non-payer participant", async () => {
                renderModal();
                await userEvent.type(
                    screen.getByPlaceholderText(/e\.g\./i),
                    "Hotel",
                );
                fireEvent.keyDown(
                    screen.getByRole("textbox", { name: /total/i }),
                    { key: "1" },
                );
                await userEvent.click(
                    screen.getByRole("checkbox", { name: "Alice" }),
                );
                await userEvent.click(
                    screen.getByRole("checkbox", { name: "Bob" }),
                );
                expect(
                    screen.getByRole("button", { name: /^add$/i }),
                ).toBeEnabled();
            });

            test("Add is disabled when title is too long", async () => {
                renderModal();
                await userEvent.type(
                    screen.getByPlaceholderText(/e\.g\./i),
                    "A".repeat(EXPENSE_TITLE_MAX + 1),
                );
                fireEvent.keyDown(
                    screen.getByRole("textbox", { name: /total/i }),
                    { key: "1" },
                );
                await userEvent.click(
                    screen.getByRole("checkbox", { name: "Bob" }),
                );
                expect(
                    screen.getByRole("button", { name: /^add$/i }),
                ).toBeDisabled();
            });

            test("Add is enabled when title, total and participants are valid", async () => {
                renderModal();
                await fillValidForm();
                expect(
                    screen.getByRole("button", { name: /^add$/i }),
                ).toBeEnabled();
            });
        });

        describe("fixed split", () => {
            test("Add is disabled when fixed shares do not sum to total", async () => {
                renderModal();
                await userEvent.type(
                    screen.getByPlaceholderText(/e\.g\./i),
                    "Hotel",
                );
                fireEvent.keyDown(
                    screen.getByRole("textbox", { name: /total/i }),
                    { key: "1" },
                );
                await userEvent.click(
                    screen.getByRole("button", { name: /fixed/i }),
                );
                expect(
                    screen.getByRole("button", { name: /^add$/i }),
                ).toBeDisabled();
            });

            test("Add is disabled when no non-payer has a fixed share", async () => {
                renderModal();
                await userEvent.type(
                    screen.getByPlaceholderText(/e\.g\./i),
                    "Hotel",
                );
                fireEvent.keyDown(
                    screen.getByRole("textbox", { name: /total/i }),
                    { key: "1" },
                );
                await userEvent.click(
                    screen.getByRole("button", { name: /fixed/i }),
                );
                // Only payer (Alice) gets share
                fireEvent.change(
                    screen.getByRole("textbox", { name: "Alice" }),
                    { target: { value: "1" } },
                );
                expect(
                    screen.getByRole("button", { name: /^add$/i }),
                ).toBeDisabled();
            });

            test("Add is enabled when shares match total and non-payer has share", async () => {
                renderModal();
                await fillValidFormFixed();
                expect(
                    screen.getByRole("button", { name: /^add$/i }),
                ).toBeEnabled();
            });
        });

        describe("percentage split", () => {
            test("Add is disabled when percentages do not sum to 100%", async () => {
                renderModal();
                await userEvent.type(
                    screen.getByPlaceholderText(/e\.g\./i),
                    "Hotel",
                );
                fireEvent.keyDown(
                    screen.getByRole("textbox", { name: /total/i }),
                    { key: "1" },
                );
                await userEvent.click(
                    screen.getByRole("button", { name: /percentage/i }),
                );
                expect(
                    screen.getByRole("button", { name: /^add$/i }),
                ).toBeDisabled();
            });

            test("Add is disabled when no non-payer has percentage", async () => {
                renderModal();
                await userEvent.type(
                    screen.getByPlaceholderText(/e\.g\./i),
                    "Hotel",
                );
                fireEvent.keyDown(
                    screen.getByRole("textbox", { name: /total/i }),
                    { key: "1" },
                );
                await userEvent.click(
                    screen.getByRole("button", { name: /percentage/i }),
                );
                // Only payer (Alice, index 0) gets 100%
                const spinbuttons = screen.getAllByRole("spinbutton");
                fireEvent.change(spinbuttons[0], { target: { value: "100" } });
                expect(
                    screen.getByRole("button", { name: /^add$/i }),
                ).toBeDisabled();
            });

            test("Add is enabled when percentages sum to 100% and non-payer has share", async () => {
                renderModal();
                await fillValidFormPercentage();
                expect(
                    screen.getByRole("button", { name: /^add$/i }),
                ).toBeEnabled();
            });
        });
    });

    describe("creating expense", () => {
        describe("equal split", () => {
            test("calls addExpense with correct data", async () => {
                const { group } = renderModal();
                await fillValidForm();
                await userEvent.click(
                    screen.getByRole("button", { name: /^add$/i }),
                );
                const expenses = useAppStore
                    .getState()
                    .global.groups.find((g) => g.id === group.id)?.expenses;
                expect(expenses).toHaveLength(1);
                expect(expenses?.[0]).toMatchObject({
                    title: "Hotel",
                    payerId: 1,
                    splitMode: "equal",
                });
            });

            test("trims title whitespace", async () => {
                const { group } = renderModal();
                await userEvent.type(
                    screen.getByPlaceholderText(/e\.g\./i),
                    "  Hotel  ",
                );
                fireEvent.keyDown(
                    screen.getByRole("textbox", { name: /total/i }),
                    { key: "1" },
                );
                await userEvent.click(
                    screen.getByRole("checkbox", { name: "Bob" }),
                );
                await userEvent.click(
                    screen.getByRole("button", { name: /^add$/i }),
                );
                const expense = useAppStore
                    .getState()
                    .global.groups.find((g) => g.id === group.id)?.expenses[0];
                expect(expense?.title).toBe("Hotel");
            });

            test("calls onClose after creating", async () => {
                const { onClose } = renderModal();
                await fillValidForm();
                await userEvent.click(
                    screen.getByRole("button", { name: /^add$/i }),
                );
                expect(onClose).toHaveBeenCalledOnce();
            });
        });

        describe("fixed split", () => {
            test("calls addExpense with fixed splitMode", async () => {
                const { group } = renderModal();
                await fillValidFormFixed();
                await userEvent.click(
                    screen.getByRole("button", { name: /^add$/i }),
                );
                const expenses = useAppStore
                    .getState()
                    .global.groups.find((g) => g.id === group.id)?.expenses;
                expect(expenses).toHaveLength(1);
                expect(expenses?.[0]).toMatchObject({
                    title: "Hotel",
                    splitMode: "fixed",
                });
            });
        });

        describe("percentage split", () => {
            test("calls addExpense with percentage splitMode", async () => {
                const { group } = renderModal();
                await fillValidFormPercentage();
                await userEvent.click(
                    screen.getByRole("button", { name: /^add$/i }),
                );
                const expenses = useAppStore
                    .getState()
                    .global.groups.find((g) => g.id === group.id)?.expenses;
                expect(expenses).toHaveLength(1);
                expect(expenses?.[0]).toMatchObject({
                    title: "Hotel",
                    splitMode: "percentage",
                });
            });
        });
    });

    describe("cancelling", () => {
        test("clicking Cancel calls onClose", async () => {
            const { onClose } = renderModal();
            await userEvent.click(
                screen.getByRole("button", { name: /cancel/i }),
            );
            expect(onClose).toHaveBeenCalledOnce();
        });

        test("does not create expense when cancelled", async () => {
            const { group } = renderModal();
            await fillValidForm();
            await userEvent.click(
                screen.getByRole("button", { name: /cancel/i }),
            );
            const expenses = useAppStore
                .getState()
                .global.groups.find((g) => g.id === group.id)?.expenses;
            expect(expenses).toHaveLength(0);
        });
    });

    describe("handleOpenChange", () => {
        test("calling with true is a no-op", async () => {
            const onClose = vi.fn();
            const group = setupGroupWithTwoMembers();
            render(
                <AddExpenseModal
                    groupId={group.id}
                    open={true}
                    onClose={onClose}
                />,
            );
            await userEvent.click(screen.getByTestId("__dialog_open__"));
            expect(onClose).not.toHaveBeenCalled();
        });
    });

    describe("defensive guards (unreachable in valid usage)", () => {
        test("shows User {id} when member has no matching user", () => {
            useAppStore.getState().addUser("Alice");
            useAppStore.getState().addUser("Bob");
            useAppStore.getState().addGroup("Trip", [1, 2]);
            useAppStore.getState().addMemberToGroup(1, 999);
            const group = useAppStore.getState().global.groups[0];
            render(
                <AddExpenseModal
                    groupId={group.id}
                    open={true}
                    onClose={vi.fn()}
                />,
            );
            expect(
                screen.getByRole("option", { name: "User 999" }),
            ).toBeInTheDocument();
            expect(
                screen.getByRole("checkbox", { name: "User 999" }),
            ).toBeInTheDocument();
        });

        test("reset sets participantIds to empty set when firstMemberId is null", async () => {
            const onClose = vi.fn();
            render(
                <AddExpenseModal groupId={999} open={true} onClose={onClose} />,
            );
            await userEvent.click(
                screen.getByRole("button", { name: /cancel/i }),
            );
            expect(onClose).toHaveBeenCalledOnce();
        });

        test("handleCreate returns early when buildEqualExpense returns null", async () => {
            vi.spyOn(expenseDomain, "buildEqualExpense").mockReturnValueOnce(
                null,
            );
            const { onClose } = renderModal();
            await fillValidForm();
            await userEvent.click(
                screen.getByRole("button", { name: /^add$/i }),
            );
            expect(onClose).not.toHaveBeenCalled();
        });

        test("handleCreate returns early when buildFixedExpense returns null", async () => {
            vi.spyOn(expenseDomain, "buildFixedExpense").mockReturnValueOnce(
                null,
            );
            const { onClose } = renderModal();
            await fillValidFormFixed();
            await userEvent.click(
                screen.getByRole("button", { name: /^add$/i }),
            );
            expect(onClose).not.toHaveBeenCalled();
        });

        test("handleCreate returns early when buildPercentageExpense returns null", async () => {
            vi.spyOn(
                expenseDomain,
                "buildPercentageExpense",
            ).mockReturnValueOnce(null);
            const { onClose } = renderModal();
            await fillValidFormPercentage();
            await userEvent.click(
                screen.getByRole("button", { name: /^add$/i }),
            );
            expect(onClose).not.toHaveBeenCalled();
        });
    });
});
