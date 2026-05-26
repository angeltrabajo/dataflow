import type { ThemeMode } from '@/shared/types/ViewType';

export interface SetThemeResponse {
  success: boolean;
  data?: {
    theme: ThemeMode;
  };
  errors?: string[];
}
