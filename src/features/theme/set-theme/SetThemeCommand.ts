import type { ThemeMode } from '@/shared/types/ViewType';

export interface SetThemeCommand {
  theme: ThemeMode;
}

export const validateSetThemeCommand = (cmd: SetThemeCommand): string[] => {
  const errors: string[] = [];
  if (!cmd.theme || (cmd.theme !== 'light' && cmd.theme !== 'dark')) errors.push('theme debe ser "light" o "dark"');
  return errors;
};
