// Hello Khata OS - Business Health Score Store
// হ্যালো খাতা - বিজনেস হেলথ স্কোর স্টোর

import { create } from 'zustand';
import type { BusinessHealthScore, HealthScoreComponents, HealthSuggestion } from '@/types';

interface HealthScoreState {
  // State
  healthScore: BusinessHealthScore | null;
  isLoading: boolean;
  lastUpdated: Date | null;

  // Actions
  setHealthScore: (score: BusinessHealthScore) => void;
  updateComponent: (component: keyof HealthScoreComponents, data: Partial<HealthScoreComponents[keyof HealthScoreComponents]>) => void;
  setLoading: (loading: boolean) => void;
  clearHealthScore: () => void;
}

export const useHealthScoreStore = create<HealthScoreState>()((set, get) => ({
  // Initial state
  healthScore: null,
  isLoading: false,
  lastUpdated: null,

  // Actions
  setHealthScore: (score) => {
    set({
      healthScore: score,
      lastUpdated: new Date(),
    });
  },

  updateComponent: (component, data) => {
    set((state) => {
      if (!state.healthScore) return state;
      
      const updatedComponents = {
        ...state.healthScore.components,
        [component]: {
          ...state.healthScore.components[component],
          ...data,
        },
      };

      // Recalculate overall score
      const overallScore = calculateOverallScore(updatedComponents);
      const grade = getGradeFromScore(overallScore);

      return {
        healthScore: {
          ...state.healthScore,
          components: updatedComponents,
          overallScore,
          grade,
        },
        lastUpdated: new Date(),
      };
    });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  clearHealthScore: () => {
    set({
      healthScore: null,
      lastUpdated: null,
    });
  },
}));

// Helper functions
function calculateOverallScore(components: HealthScoreComponents): number {
  const totalWeight = Object.values(components).reduce((sum, c) => sum + c.weight, 0);
  const weightedSum = Object.values(components).reduce((sum, c) => sum + (c.score * c.weight), 0);
  return Math.round(weightedSum / totalWeight);
}

function getGradeFromScore(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

// Helper hooks
export const useHealthScore = () => useHealthScoreStore((state) => state.healthScore?.overallScore ?? 0);
export const useHealthGrade = () => useHealthScoreStore((state) => state.healthScore?.grade ?? 'F');
export const useHealthComponents = () => useHealthScoreStore((state) => state.healthScore?.components);
export const useHealthSuggestions = () => useHealthScoreStore((state) => state.healthScore?.suggestions ?? []);
