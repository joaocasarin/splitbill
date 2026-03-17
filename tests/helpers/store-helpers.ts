import type { Group } from "@domain/group";
import { useAppStore } from "@store";

export function setupTwoUsers(): void {
    useAppStore.getState().addUser("Alice");
    useAppStore.getState().addUser("Bob");
}

export function setupGroupWithTwoMembers(): Group {
    setupTwoUsers();
    useAppStore.getState().addGroup("Trip", [1, 2]);
    return useAppStore.getState().global.groups[0];
}

export function setupGroupWithNonMember(): Group {
    setupTwoUsers();
    useAppStore.getState().addUser("Carol");
    useAppStore.getState().addGroup("Trip", [1, 2]);
    return useAppStore.getState().global.groups[0];
}

export function setupGroupWithInlineMembers(): Group {
    setupTwoUsers();
    useAppStore.getState().addGroup("Trip", [1, 2]);
    return useAppStore.getState().global.groups[0];
}
