import { SetThemeHandler } from './SetThemeHandler';
import type { SetThemeCommand } from './SetThemeCommand';

describe('SetThemeHandler', () => {
  let handler: SetThemeHandler;

  beforeEach(() => {
    handler = new SetThemeHandler();
  });

  it('debe establecer el tema claro exitosamente', async () => {
    // Arrange
    const command: SetThemeCommand = {
      theme: 'light',
    };

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data!.theme).toBe('light');
  });

  it('debe establecer el tema oscuro exitosamente', async () => {
    // Arrange
    const command: SetThemeCommand = {
      theme: 'dark',
    };

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data!.theme).toBe('dark');
  });

  it('debe fallar si el tema no es válido', async () => {
    // Arrange
    const command: SetThemeCommand = {
      theme: 'invalid' as any,
    };

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });
});
