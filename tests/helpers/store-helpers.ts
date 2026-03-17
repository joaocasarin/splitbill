import type { Group } from "@domain/group";
import { useAppStore } from "@store";

export function setupGroupWithTwoMembers(): Group {
    useAppStore.getState().addGroupWithMembers("Trip", ["Alice", "Bob"]);
    return useAppStore.getState().global.groups[0];
}

export function setupGroupWithNonMember(): Group {
    useAppStore.getState().addGroupWithMembers("Trip", ["Alice", "Bob"]);
    return useAppStore.getState().global.groups[0];
}

export function setupGroupWithInlineMembers(): Group {
    useAppStore.getState().addGroupWithMembers("Trip", ["Alice", "Bob"]);
    return useAppStore.getState().global.groups[0];
}
