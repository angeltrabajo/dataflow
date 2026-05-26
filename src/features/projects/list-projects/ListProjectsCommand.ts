/**
 * Comando para listar todos los proyectos.
 * No requiere parámetros adicionales.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ListProjectsCommand {}

/**
 * Valida los datos del comando.
 * Retorna un array de errores (vacío si es válido).
 */
export const validateListProjectsCommand = (_cmd: ListProjectsCommand): string[] => [];
