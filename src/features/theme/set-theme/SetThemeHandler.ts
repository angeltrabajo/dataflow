import type { SetThemeCommand } from './SetThemeCommand';
import type { SetThemeResponse } from './SetThemeResponse';
import { validateSetThemeCommand } from './SetThemeCommand';

export class SetThemeHandler {
  async execute(command: SetThemeCommand): Promise<SetThemeResponse> {
    const errors = validateSetThemeCommand(command);
    if (errors.length > 0) return { success: false, errors };

    return { success: true, data: { theme: command.theme } };
  }
}
