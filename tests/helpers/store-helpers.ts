import type { Group } from "@domain/group";
import { useAppStore } from "@store";

export function setupGroupWithTwoMembers(): Group {
    useAppStore.getState().addUser("Alice");
    useAppStore.getState().addUser("Bob");
    useAppStore.getState().addGroup("Trip", [1, 2]);
    return useAppStore.getState().global.groups[0];
}
