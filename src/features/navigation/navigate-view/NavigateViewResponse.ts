import type { ViewType } from '@/shared/types/ViewType';

export interface NavigateViewResponse {
  success: boolean;
  data?: {
    view: ViewType;
    selectedProjectId: string | null;
    selectedTableId: string | null;
  };
  errors?: string[];
}
