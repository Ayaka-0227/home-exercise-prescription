import { create } from 'zustand';

type ExerciseState = {
  completedIds: string[];
  painLevel: number | null;
  completeExercise: (exerciseId: string) => void;
  setPainLevel: (painLevel: number) => void;
};

export const useExerciseStore = create<ExerciseState>((set) => ({
  completedIds: [],
  painLevel: null,
  completeExercise: (exerciseId) =>
    set((state) => ({
      completedIds: state.completedIds.includes(exerciseId)
        ? state.completedIds
        : [...state.completedIds, exerciseId],
    })),
  setPainLevel: (painLevel) => set({ painLevel }),
}));
