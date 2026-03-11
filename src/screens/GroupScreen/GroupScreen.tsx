import type { AppView } from "@app";
import { Button } from "@components/ui/button";
import type { EntityId } from "@domain/common";
import { ArrowLeft } from "lucide-react";
import { AddExpenseModal } from "./expenses/AddExpenseModal";
import { ExpensesSection } from "./expenses/ExpensesSection";
import { AddMemberModal } from "./members/AddMemberModal";
import { MembersSection } from "./members/MembersSection";
import { AddSettlementModal } from "./settlements/AddSettlementModal";
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
        isAddMemberOpen,
        isAddExpenseOpen,
        isAddSettlementOpen,
        openAddMember,
        closeAddMember,
        openAddExpense,
        closeAddExpense,
        openAddSettlement,
        closeAddSettlement,
        removeMember,
        addSettlement,
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
                onDeleteExpense={deleteExpense}
            />

            <SettlementsSection
                settlements={group.settlements}
                users={users}
                onAddSettlement={openAddSettlement}
                onDeleteSettlement={deleteSettlement}
            />

            <AddMemberModal
                groupId={groupId}
                open={isAddMemberOpen}
                onClose={closeAddMember}
            />

            <AddExpenseModal
                groupId={groupId}
                open={isAddExpenseOpen}
                onClose={closeAddExpense}
            />

            <AddSettlementModal
                open={isAddSettlementOpen}
                members={members}
                directDebts={directDebts}
                onSubmit={addSettlement}
                onClose={closeAddSettlement}
            />
        </div>
    );
}
