import type { AppView } from "@app";
import { Button } from "@components/ui/button";
import type { EntityId } from "@domain/common";
import { ArrowLeft } from "lucide-react";
import { ExpenseModal } from "./expenses/ExpenseModal";
import { ExpensesSection } from "./expenses/ExpensesSection";
import { AddMemberModal } from "./members/AddMemberModal";
import { MembersSection } from "./members/MembersSection";
import { SettlementModal } from "./settlements/SettlementModal";
import { SettlementsSection } from "./settlements/SettlementsSection";
import { useGroupScreen } from "./useGroupScreen";

type Props = {
    groupId: EntityId;
    onNavigate: (view: AppView) => void;
};

export function GroupScreen({ groupId, onNavigate }: Props) {
    const state = useGroupScreen(groupId);

    if (!state.group) {
        return (
            <div className="flex items-center justify-center h-full min-h-80">
                <p className="text-muted-foreground text-sm">
                    Group not found.
                </p>
            </div>
        );
    }

    const {
        group,
        users,
        members,
        memberCount,
        canAddMember,
        directDebts,
        editDirectDebts,
        editingExpense,
        isAddMemberOpen,
        isAddExpenseOpen,
        isAddSettlementOpen,
        editingSettlement,
        openAddMember,
        closeAddMember,
        openAddExpense,
        closeAddExpense,
        openEditExpense,
        closeEditExpense,
        openAddSettlement,
        closeAddSettlement,
        openEditSettlement,
        closeEditSettlement,
        removeMember,
        addSettlement,
        updateSettlement,
        deleteExpense,
        deleteSettlement,
    } = state;

    return (
        <div className="px-6 py-8 flex flex-col gap-8 max-w-2xl">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onNavigate({ screen: "home" })}
                    aria-label="Back"
                >
                    <ArrowLeft />
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">
                    {group.name}
                </h1>
            </div>

            <MembersSection
                members={members}
                memberCount={memberCount}
                canAddMember={canAddMember}
                onAddMember={openAddMember}
                onRemoveMember={removeMember}
            />

            <ExpensesSection
                expenses={group.expenses}
                users={users}
                onAddExpense={openAddExpense}
                onEditExpense={openEditExpense}
                onDeleteExpense={deleteExpense}
            />

            <SettlementsSection
                settlements={group.settlements}
                users={users}
                onAddSettlement={openAddSettlement}
                onEditSettlement={openEditSettlement}
                onDeleteSettlement={deleteSettlement}
            />

            <AddMemberModal
                groupId={groupId}
                open={isAddMemberOpen}
                onClose={closeAddMember}
            />

            <ExpenseModal
                groupId={groupId}
                open={isAddExpenseOpen}
                onClose={closeAddExpense}
            />

            {editingExpense !== null && (
                <ExpenseModal
                    groupId={groupId}
                    open
                    expense={editingExpense}
                    onClose={closeEditExpense}
                    onDelete={deleteExpense}
                />
            )}

            <SettlementModal
                open={isAddSettlementOpen}
                members={members}
                directDebts={directDebts}
                onSubmit={addSettlement}
                onClose={closeAddSettlement}
            />

            {editingSettlement !== null && (
                <SettlementModal
                    open
                    members={members}
                    directDebts={editDirectDebts}
                    settlement={editingSettlement}
                    onSubmit={(data) =>
                        updateSettlement({
                            ...data,
                            id: editingSettlement.id,
                            createdAt: editingSettlement.createdAt,
                        })
                    }
                    onClose={closeEditSettlement}
                    onDelete={deleteSettlement}
                />
            )}
        </div>
    );
}
