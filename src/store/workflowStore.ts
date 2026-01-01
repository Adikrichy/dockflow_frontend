import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface WorkflowState {
    currentCompanyId: number | null;
    activeTab: number;
    selectedTaskIds: number[];

    setCompanyId: (id: number | null) => void;
    setActiveTab: (tab: number) => void;
    setSelectedTaskIds: (ids: number[]) => void;
    toggleTaskSelection: (id: number) => void;
    clearSelection: () => void;
}

export const useWorkflowStore = create<WorkflowState>()(
    devtools(
        persist(
            (set) => ({
                currentCompanyId: null,
                activeTab: 0,
                selectedTaskIds: [],

                setCompanyId: (id) => set({ currentCompanyId: id }),
                setActiveTab: (tab) => set({ activeTab: tab }),
                setSelectedTaskIds: (ids) => set({ selectedTaskIds: ids }),
                toggleTaskSelection: (id) =>
                    set((state) => ({
                        selectedTaskIds: state.selectedTaskIds.includes(id)
                            ? state.selectedTaskIds.filter((taskId) => taskId !== id)
                            : [...state.selectedTaskIds, id],
                    })),
                clearSelection: () => set({ selectedTaskIds: [] }),
            }),
            {
                name: 'workflow-storage',
                version: 1,
            }
        )
    )
);
