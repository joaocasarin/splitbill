import type { Group } from "@domain/group";
import { useAppStore } from "@store";

/**
 * Cria dois usuários (Alice, Bob) e um grupo "Trip" com eles. Retorna o grupo criado.
 * Útil para testes da store que precisam de um grupo com membros.
 */
export function setupGroupWithTwoMembers(): Group {
    useAppStore.getState().addUser("Alice");
    useAppStore.getState().addUser("Bob");
    useAppStore.getState().addGroup("Trip", [1, 2]);
    return useAppStore.getState().global.groups[0];
}
