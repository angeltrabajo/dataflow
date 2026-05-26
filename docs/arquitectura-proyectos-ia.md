---
tags: [arquitectura, vertical-slice, ia, principios, guia-core]
type: guia-arquitectura
version: 1.0
sistema-parte-de: sistema-directrices-ia
uso: contexto-para-ia
---

# 🏗️ Arquitectura y Principios de Estructura para Proyectos con IA

> **Propósito**: Este documento es la fuente única de verdad sobre cómo deben estructurarse los proyectos de programación asistidos por IA. Está diseñado para ser compartido directamente con un chat de IA como contexto de referencia, permitiéndole comprender profundamente la arquitectura, los principios de diseño y las convenciones que rigen nuestro trabajo. Puede aplicarse al inicio de un proyecto como guía fundacional o a mitad del desarrollo como referencia para reestructuración.
>
> **Parte de**: Sistema Mayor de Directrices para IA (documento core del ecosistema).

---

## 📋 Guía de Uso para la IA

Cuando recibas este documento como contexto, debes:

1. **Interiorizar la filosofía**: No se trata de reglas arbitrarias sino de principios que maximizan la eficiencia de la colaboración humano-IA en desarrollo de software.
2. **Aplicar en cada decisión**: Ante cualquier decisión de estructura, nomenclatura o organización, consulta este documento antes de proponer una solución.
3. **Verificar cumplimiento**: Usa los checklists al final de este documento para validar que tu trabajo cumple con las directrices.
4. **Señalar desviaciones**: Si el código existente no cumple estas directrices, propón correcciones alineadas con este documento antes de ampliar funcionalidad.
5. **Priorizar consistencia sobre preferencia**: Si tienes un estilo personal preferido pero este documento indica lo contrario, sigue el documento.

---

## 🏛️ Filosofía Fundamental

Nuestra arquitectura se sustenta en tres pilares que guían toda decisión de diseño:

### Pilar 1: Contexto Autocontenido

Cada unidad de trabajo (feature, módulo, slice) debe contener toda la información necesaria para ser comprendida de forma aislada. La IA no debería necesitar navegar entre decenas de archivos dispersos para entender una funcionalidad. Este principio reduce la carga cognitiva, minimiza errores de interpretación y permite que tanto humanos como IA trabajen en una feature sin dependencias ocultas.

**Implicaciones prácticas**:
- Los archivos relacionados deben vivir juntos físicamente en el sistema de archivos.
- Las dependencias externas deben ser explícitas e inyectadas, no implícitas.
- Cada feature debe poder explicarse sin referencia a la implementación interna de otras features.

### Pilar 2: Bajo Acoplamiento, Alta Cohesión

Los cambios en una parte del sistema deben tener el mínimo impacto posible en otras. Cada módulo debe tener una responsabilidad clara y bien definida, agrupando lo que pertenece junto y separando lo que no. Esto permite que la IA modifique una feature sin temor a provocar efectos en cascada impredecibles, y que los equipos trabajen en paralelo sin conflictos constantes.

**Implicaciones prácticas**:
- La comunicación entre features se realiza mediante contratos explícitos (interfaces, eventos, DTOs).
- No se accede directamente al estado interno de otra feature.
- Las dependencias entre features se declaran abiertamente, nunca se ocultan.

### Pilar 3: Flujos Lineales y Predecibles

La lógica debe fluir de entrada a salida de forma clara y directa, sin saltos innecesarios entre capas dispersas. Un desarrollador o una IA debería poder leer el código de una feature de arriba hacia abajo y comprender completamente qué hace, cómo lo hace y qué devuelve. Los patrones de indirección excesiva, callbacks encadenados profundos y herencia múltiple oscurecen el flujo y dificultan el razonamiento.

**Implicaciones prácticas**:
- Se prefiere composición sobre herencia.
- Se prefiere orquestación explícita sobre event-driven implícito para flujos principales.
- El código se lee como una narrativa: entrada → validación → transformación → salida.

---

## 🏗️ Arquitectura Core: Vertical Slice Architecture

### ¿Qué es?

La Vertical Slice Architecture es la piedra angular de nuestros proyectos. En lugar de organizar el código por capas técnicas horizontales (Controller, Service, Repository, Model), organizamos el código por característica o caso de uso (feature), de principio a fin. Cada slice vertical encapsula todo lo necesario para una funcionalidad específica: desde la entrada del usuario hasta el acceso a datos, pasando por la lógica de negocio.

### Comparativa: Arquitectura Tradicional vs Vertical Slice

**Arquitectura tradicional por capas** (lo que NO hacemos):
```
src/
├── controllers/
│   ├── TaskController.java
│   ├── UserController.java
│   └── AuthController.java
├── services/
│   ├── TaskService.java
│   ├── UserService.java
│   └── AuthService.java
├── repositories/
│   ├── TaskRepository.java
│   ├── UserRepository.java
│   └── AuthRepository.java
└── models/
    ├── Task.java
    ├── User.java
    └── Auth.java
```

**Problemas de la arquitectura por capas para la IA**:
- Para entender la feature "completar tarea", la IA debe abrir 4 archivos en 4 directorios distintos.
- Un cambio en una feature requiere modificar archivos en múltiples directorios.
- El acoplamiento entre capas es alto: TaskController depende de TaskService que depende de TaskRepository.
- La IA pierde contexto al saltar entre archivos, incrementando la probabilidad de errores.

**Vertical Slice Architecture** (lo que SÍ hacemos):
```
src/
├── features/
│   ├── complete-task/
│   │   ├── CompleteTaskCommand.ts      # DTO de entrada
│   │   ├── CompleteTaskHandler.ts       # Lógica de negocio y orquestación
│   │   ├── CompleteTaskResponse.ts      # DTO de salida
│   │   ├── complete-task.test.ts        # Pruebas específicas
│   │   └── index.ts                     # Exportación pública
│   ├── create-task/
│   │   ├── CreateTaskCommand.ts
│   │   ├── CreateTaskHandler.ts
│   │   ├── CreateTaskResponse.ts
│   │   ├── create-task.test.ts
│   │   └── index.ts
│   └── delete-task/
│       ├── DeleteTaskCommand.ts
│       ├── DeleteTaskHandler.ts
│       ├── DeleteTaskResponse.ts
│       ├── delete-task.test.ts
│       └── index.ts
├── shared/                              # Código compartido entre features
│   ├── domain/
│   ├── infrastructure/
│   └── types/
└── app.ts                               # Punto de entrada
```

### ¿Por qué es AI-Friendly?

| Aspecto | Beneficio para la IA |
|---------|---------------------|
| **Contexto Autocontenido** | La IA solo necesita leer los archivos dentro de `features/complete-task/` para entender completamente esa funcionalidad, sin saltar entre múltiples archivos y capas dispersas. Esto reduce la ventana de contexto necesaria y mejora la precisión de las respuestas. |
| **Bajo Acoplamiento** | Los cambios en una feature (slice) rara vez afectan a otras, reduciendo el riesgo de que la IA introduzca errores en cascada. La IA puede modificar una feature con confianza sin temor a romper funcionalidades distantes. |
| **Flujo Claro** | La lógica fluye de entrada a salida de forma lineal, imitando cómo un humano (o una IA) piensa en un problema: "Dado este comando, ejecuto esta lógica y devuelvo esta respuesta". No hay indirección ni saltos entre capas. |
| **Descubribilidad** | La estructura de directorios es un mapa del sistema. Ver `features/` es ver todas las capacidades del sistema. La IA puede localizar funcionalidad relevante sin búsquedas exhaustivas. |
| **Testing Co-locado** | Las pruebas viven junto al código que prueban, permitiendo a la IA validar su trabajo inmediatamente sin buscar archivos de test en directorios lejanos. |

### Componentes de un Slice

Cada slice vertical debe contener los siguientes componentes como mínimo:

#### 1. Command (DTO de Entrada)

Define qué datos recibe la feature. Es el contrato de entrada que valida y tipa los datos que el usuario o sistema envía. Debe ser explícito sobre qué campos son obligatorios y cuáles opcionales, e incluir validaciones de formato y rango.

```typescript
// features/complete-task/CompleteTaskCommand.ts

/**
 * Comando para completar una tarea existente.
 * Requiere el ID de la tarea y el ID del usuario que la completa.
 */
export interface CompleteTaskCommand {
  taskId: string;        // UUID de la tarea a completar
  completedBy: string;   // UUID del usuario que completa la tarea
  completedAt?: Date;    // Opcional: fecha de completado (default: ahora)
  notes?: string;        // Opcional: notas al completar
}

/**
 * Esquema de validación para CompleteTaskCommand.
 * Aplicar antes de procesar el comando.
 */
export const validateCompleteTaskCommand = (cmd: CompleteTaskCommand): string[] => {
  const errors: string[] = [];
  if (!cmd.taskId || cmd.taskId.trim().length === 0) {
    errors.push('taskId es obligatorio');
  }
  if (!cmd.completedBy || cmd.completedBy.trim().length === 0) {
    errors.push('completedBy es obligatorio');
  }
  return errors;
};
```

#### 2. Handler (Lógica de Negocio)

Contiene la lógica de negocio y orquestación. Es el corazón del slice: recibe el command, ejecuta la lógica necesaria (validaciones, transformaciones, acceso a datos, eventos) y devuelve el response. El handler es el único punto donde se concentra la lógica de esa feature, sin delegaciones ocultas a servicios externos que no estén explícitamente inyectados.

```typescript
// features/complete-task/CompleteTaskHandler.ts

import type { CompleteTaskCommand } from './CompleteTaskCommand';
import type { CompleteTaskResponse } from './CompleteTaskResponse';
import type { TaskRepository } from '../../shared/domain/TaskRepository';
import type { EventBus } from '../../shared/domain/EventBus';
import { validateCompleteTaskCommand } from './CompleteTaskCommand';

/**
 * Handler para la feature "Completar Tarea".
 * Orquesta la lógica de negocio: validar, buscar, actualizar, emitir evento.
 */
export class CompleteTaskHandler {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly eventBus: EventBus
  ) {}

  async execute(command: CompleteTaskCommand): Promise<CompleteTaskResponse> {
    // 1. Validar comando
    const errors = validateCompleteTaskCommand(command);
    if (errors.length > 0) {
      return { success: false, errors };
    }

    // 2. Buscar la tarea
    const task = await this.taskRepository.findById(command.taskId);
    if (!task) {
      return { success: false, errors: ['Tarea no encontrada'] };
    }

    // 3. Aplicar lógica de negocio
    if (task.status === 'completed') {
      return { success: false, errors: ['La tarea ya estaba completada'] };
    }

    // 4. Actualizar estado
    task.status = 'completed';
    task.completedBy = command.completedBy;
    task.completedAt = command.completedAt ?? new Date();
    task.notes = command.notes;

    // 5. Persistir
    await this.taskRepository.save(task);

    // 6. Emitir evento de dominio
    await this.eventBus.publish({
      type: 'task.completed',
      data: { taskId: task.id, completedBy: command.completedBy },
      timestamp: new Date()
    });

    // 7. Retornar respuesta
    return {
      success: true,
      data: {
        id: task.id,
        status: task.status,
        completedAt: task.completedAt
      }
    };
  }
}
```

#### 3. Response (DTO de Salida)

Define qué datos devuelve la feature. Es el contrato de salida que tipifica la respuesta, tanto para casos de éxito como de error. Un response bien definido permite a la IA y a otros consumidores saber exactamente qué esperar sin necesidad de leer la implementación.

```typescript
// features/complete-task/CompleteTaskResponse.ts

/**
 * Respuesta de la feature "Completar Tarea".
 * Incluye éxito/fallo y datos o errores según corresponda.
 */
export interface CompleteTaskResponse {
  success: boolean;
  data?: {
    id: string;
    status: string;
    completedAt: Date;
  };
  errors?: string[];
}
```

#### 4. Test (Pruebas Específicas)

Pruebas co-ubicadas con la feature que validan el comportamiento esperado del handler. Deben ser rápidas (unitarias, con mocks), legibles (patrón Arrange-Act-Assert) y exhaustivas (cubren casos de éxito, error y bordes). La IA debe poder ejecutarlas y verificar su trabajo en segundos, no minutos.

```typescript
// features/complete-task/complete-task.test.ts

import { CompleteTaskHandler } from './CompleteTaskHandler';
import type { TaskRepository } from '../../shared/domain/TaskRepository';
import type { EventBus } from '../../shared/domain/EventBus';

describe('CompleteTaskHandler', () => {
  let handler: CompleteTaskHandler;
  let mockRepo: jest.Mocked<TaskRepository>;
  let mockBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    mockRepo = { findById: jest.fn(), save: jest.fn() };
    mockBus = { publish: jest.fn() };
    handler = new CompleteTaskHandler(mockRepo, mockBus);
  });

  it('debe completar una tarea pendiente exitosamente', async () => {
    // Arrange
    mockRepo.findById.mockResolvedValue({
      id: 'task-1', status: 'pending', completedBy: null, completedAt: null, notes: null
    });

    // Act
    const result = await handler.execute({
      taskId: 'task-1', completedBy: 'user-1'
    });

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.status).toBe('completed');
    expect(mockRepo.save).toHaveBeenCalled();
    expect(mockBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'task.completed' })
    );
  });

  it('debe fallar si la tarea no existe', async () => {
    mockRepo.findById.mockResolvedValue(null);

    const result = await handler.execute({
      taskId: 'inexistente', completedBy: 'user-1'
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Tarea no encontrada');
  });

  it('debe fallar si la tarea ya estaba completada', async () => {
    mockRepo.findById.mockResolvedValue({
      id: 'task-1', status: 'completed', completedBy: 'user-1', completedAt: new Date(), notes: null
    });

    const result = await handler.execute({
      taskId: 'task-1', completedBy: 'user-2'
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain('La tarea ya estaba completada');
  });
});
```

#### 5. Index (Exportación Pública)

Archivo barril que define la API pública del slice. Solo exporta lo que otros módulos necesitan consumir, manteniendo los detalles de implementación privados. Esto es crucial: el index.ts es el contrato de interfaz del slice hacia el resto del sistema.

```typescript
// features/complete-task/index.ts

export { CompleteTaskHandler } from './CompleteTaskHandler';
export type { CompleteTaskCommand } from './CompleteTaskCommand';
export type { CompleteTaskResponse } from './CompleteTaskResponse';
```

---

## 📁 Estructura de Directorios de Referencia

La siguiente es la estructura canónica que debe seguir todo proyecto. Adaptar los nombres de dominio según el contexto, pero mantener la organización y jerarquía:

```
proyecto/
├── src/
│   ├── features/                          # Todas las features del sistema
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   ├── LoginCommand.ts
│   │   │   │   ├── LoginHandler.ts
│   │   │   │   ├── LoginResponse.ts
│   │   │   │   ├── login.test.ts
│   │   │   │   └── index.ts
│   │   │   ├── register/
│   │   │   │   ├── RegisterCommand.ts
│   │   │   │   ├── RegisterHandler.ts
│   │   │   │   ├── RegisterResponse.ts
│   │   │   │   ├── register.test.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts                   # Exporta todas las features de auth
│   │   │
│   │   ├── tasks/
│   │   │   ├── create-task/
│   │   │   ├── complete-task/
│   │   │   ├── delete-task/
│   │   │   ├── list-tasks/
│   │   │   └── index.ts
│   │   │
│   │   └── users/
│   │       ├── get-user-profile/
│   │       ├── update-user-profile/
│   │       └── index.ts
│   │
│   ├── shared/                            # Código compartido entre features
│   │   ├── domain/                        # Tipos y contratos de dominio
│   │   │   ├── Entity.ts                  # Clase base para entidades
│   │   │   ├── ValueObject.ts             # Clase base para value objects
│   │   │   ├── DomainEvent.ts             # Clase base para eventos
│   │   │   └── Repository.ts              # Contrato base para repositorios
│   │   │
│   │   ├── infrastructure/                # Implementaciones técnicas compartidas
│   │   │   ├── database/
│   │   │   ├── messaging/
│   │   │   └── logging/
│   │   │
│   │   ├── types/                         # Tipos compartidos globales
│   │   │   ├── Result.ts                  # Tipo Result<T, E> para manejo de errores
│   │   │   └── Pagination.ts              # Tipos de paginación
│   │   │
│   │   └── utils/                         # Utilidades puras sin estado
│   │       ├── date.ts
│   │       ├── string.ts
│   │       └── validation.ts
│   │
│   ├── api/                               # Capa de presentación / adaptadores
│   │   ├── routes/                        # Definición de rutas HTTP
│   │   │   ├── auth.routes.ts
│   │   │   ├── tasks.routes.ts
│   │   │   └── users.routes.ts
│   │   ├── middleware/                    # Middleware de la API
│   │   └── dto/                           # DTOs de entrada/salida de la API
│   │
│   └── app.ts                             # Composición de la aplicación
│
├── tests/                                 # Tests de integración e2e
│   ├── integration/
│   └── e2e/
│
├── docs/                                  # Documentación del proyecto
│   ├── architecture.md
│   └── api-reference.md
│
├── README.md                              # Punto de entrada del proyecto
├── package.json
└── tsconfig.json
```

### Reglas de la Estructura de Directorios

1. **Una feature, un directorio**: Cada feature tiene su propio directorio bajo `features/`. No se agrupan features en subdirectorios adicionales más allá del dominio funcional (auth, tasks, users).
2. **shared es mínimo**: El directorio `shared/` solo contiene código que genuinamente es reutilizado por múltiples features. Si algo es usado por una sola feature, pertenece a esa feature.
3. **api/ es adaptador**: La capa de API es un adaptador que traduce HTTP a commands y responses. No contiene lógica de negocio. Los handlers de rutas son delgados: reciben request, crean command, llaman handler, devuelven response.
4. **Tests co-ubicados**: Los tests unitarios viven junto al código que prueban dentro de cada feature. Los tests de integración y e2e viven en el directorio `tests/` raíz.

---

## 🧩 Principios de Diseño y Estructura que Facilitan la IA

### Principio 1: Modularidad y Límites Claros

**Qué significa**: Divide el sistema en módulos con responsabilidades únicas y bien definidas. Cada módulo tiene una frontera clara que separa lo que es interno (detalle de implementación) de lo que es público (API del módulo). Las dependencias entre módulos son explícitas y unidireccionales cuando sea posible.

**Por qué ayuda a la IA**: La IA puede razonar sobre un módulo a la vez, sin verse abrumada por un monolito. Cuando necesita modificar una feature, sabe que solo necesita entender esa feature y sus dependencias explícitas, no todo el sistema. Esto reduce drásticamente la ventana de contexto necesaria y aumenta la precisión.

**Ejemplo práctico**:
```
❌ Mal: Un módulo auth/ que también maneja tareas porque "están relacionadas"
✅ Bien: Un módulo auth/ separado de tasks/, comunicados solo por eventos
```

**Reglas de aplicación**:
- Cada feature es un módulo con su propio directorio y archivo index.ts que define su API pública.
- Las dependencias entre features se declaran en el handler (inyección de dependencias), nunca se accede directamente a archivos internos de otra feature.
- Si dos features necesitan compartir lógica, esa lógica se mueve a `shared/`.
- Un módulo no debe tener más de 7±2 elementos públicos (principio de Miller aplicado a APIs).

### Principio 2: Nombres Descriptivos y Consistentes

**Qué significa**: Usa nombres de funciones, variables, clases y archivos que revelen intención, no abreviaturas crípticas. El nombre debe responder a la pregunta "¿qué hace esto?" sin necesidad de leer la implementación. La consistencia en la nomenclatura es tan importante como la descriptividad: si una acción se llama "create" en un lugar, no se llama "add" en otro.

**Por qué ayuda a la IA**: Reduce la necesidad de adivinar el propósito. Cuando la IA lee `getUserById()`, sabe exactamente qué hace sin necesidad de abrir la función. Si lee `gubi()`, tiene que abrir el archivo, leer la implementación y hacer inferencias, aumentando la probabilidad de error. La consistencia permite a la IA predecir patrones: si vio `createTask`, `createUser`, puede inferir con confianza que `createOrder` sigue el mismo patrón.

**Convenciones de nomenclatura**:

| Elemento | Convención | Ejemplo Correcto | Ejemplo Incorrecto |
|----------|-----------|-----------------|-------------------|
| Feature (directorio) | kebab-case, verbo-sustantivo | `complete-task/` | `CompleteTask/`, `ct/` |
| Command | PascalCase, Verbo+Sustantivo+Command | `CompleteTaskCommand` | `CTCmd`, `TaskComplete` |
| Handler | PascalCase, Verbo+Sustantivo+Handler | `CompleteTaskHandler` | `Handler1`, `TaskH` |
| Response | PascalCase, Verbo+Sustantivo+Response | `CompleteTaskResponse` | `Resp`, `TaskResp` |
| Función | camelCase, verbo + complemento | `getUserById()` | `gubi()`, `userData()` |
| Variable | camelCase, sustantivo descriptivo | `completedTaskCount` | `cnt`, `n` |
| Constante | SCREAMING_SNAKE_CASE | `MAX_RETRY_ATTEMPTS` | `max`, `mr` |
| Interface | PascalCase, sustantivo o adjetivo | `TaskRepository`, `Serializable` | `ITaskRepo`, `IRepo` |
| Tipo | PascalCase, sustantivo | `TaskStatus` | `ts`, `Status` |
| Archivo test | kebab-case, nombre-feature.test.ext | `complete-task.test.ts` | `test1.ts`, `task.test.ts` |
| Archivo index | Siempre `index.ts` | `index.ts` | `main.ts`, `mod.ts` |

**Regla de oro**: Si un nombre necesita un comentario para ser entendido, el nombre no es suficientemente descriptivo. Renombra antes de comentar.

### Principio 3: Documentación Estructurada y Única

**Qué significa**: Comenta el por qué, no el qué. El código debe explicar qué hace mediante nombres descriptivos y estructura clara; los comentarios deben explicar por qué se tomó una decisión, qué alternativas se consideraron y por qué se eligió esta. Mantén una fuente única de verdad (README, wiki) y evita la dispersión de documentación contradictoria.

**Por qué ayuda a la IA**: La IA no tiene que elegir entre 5 guías contradictorias. Estudios indican que hasta el 40% del tiempo de un agente de IA se pierde buscando qué documentación creer cuando hay múltiples fuentes que se contradicen. Una fuente única de verdad elimina esta ambigüedad y permite a la IA actuar con confianza.

**Niveles de documentación**:

1. **Nivel de proyecto** (`README.md`): Qué es el proyecto, cómo se ejecuta, arquitectura general, enlace a este documento.
2. **Nivel de feature** (`features/xxx/README.md` opcional): Descripción de la feature si es compleja, decisiones de diseño tomadas.
3. **Nivel de código** (comentarios inline): Solo el por qué de decisiones no obvias, advertencias sobre edge cases, TODOs con contexto.
4. **Nivel de API** (`docs/api-reference.md`): Contratos públicos de cada feature.

**Qué documentar y qué no**:

```typescript
// ❌ Mal: Comentar el qué (el código ya lo dice)
// Incrementa el contador en 1
counter++;

// ✅ Bien: Comentar el por qué
// Usamos incremento manual en lugar de ++ porque necesitamos
// logging de cada incremento para auditoría en modo debug
counter = incrementWithLog(counter);
```

```typescript
// ❌ Mal: Comentar lo obvio
// Retorna true si el usuario es admin
function isAdmin(user: User): boolean {
  return user.role === 'admin';
}

// ✅ Bien: Comentar el por qué de la decisión
// Consideramos 'superadmin' como admin porque hereda todos los permisos.
// Esto fue una decisión de producto en sprint 23, no cambiar sin consultar.
function isAdmin(user: User): boolean {
  return user.role === 'admin' || user.role === 'superadmin';
}
```

### Principio 4: Testing Explícito y Rápido

**Qué significa**: Escribe pruebas que sean fáciles de encontrar y ejecutar. Prefiere tests unitarios rápidos sobre tests de integración lentos. Los tests deben ser deterministas (misma entrada, misma salida), independientes (no dependen del orden de ejecución) y legibles (un test por comportamiento, patrón Arrange-Act-Assert).

**Por qué ayuda a la IA**: La IA puede validar su trabajo inmediatamente. Ejecutar una build completa de 60 segundos para validar un formato es ineficiente. Los tests unitarios rápidos (<2 segundos por suite de feature) permiten ciclos de retroalimentación instantáneos, donde la IA puede escribir código, ejecutar tests, corregir y re-ejecutar en segundos en lugar de minutos.

**Estructura de tests**:

```
features/
├── complete-task/
│   ├── complete-task.test.ts        # Tests unitarios del handler
│   └── complete-task.integration.test.ts  # Tests de integración (opcional)
```

**Convenciones de testing**:

- **Nombre del archivo**: `{feature-name}.test.ts` para unitarios, `{feature-name}.integration.test.ts` para integración.
- **Estructura del test**: Patrón Arrange-Act-Assert con comentarios que delimitan cada sección.
- **Un test, un comportamiento**: No tests que verifican 5 cosas a la vez. Si falla, debe ser obvio qué comportamiento falló.
- **Mocks explícitos**: Los mocks se crean en el `beforeEach`, no se reutilizan entre tests. Cada test es independiente.
- **Nombres descriptivos**: `it('debe fallar si la tarea no existe')` no `it('error case 2')`.

**Jerarquía de tests**:

| Tipo | Propósito | Velocidad | Cantidad |
|------|-----------|-----------|----------|
| Unitarios | Validar lógica del handler | <100ms por test | Muchos (80%) |
| Integración | Validar interacción con BD/mensajería | 1-5s por test | Algunos (15%) |
| E2E | Validar flujos completos de usuario | 10-60s por test | Pocos (5%) |

### Principio 5: Inmutabilidad y Transparencia Referencial

**Qué significa**: Prefiere datos inmutables y funciones puras siempre que sea posible. Los Commands son inmutables una vez creados. Los Responses son snapshots inmutables del estado. Los handlers no mantienen estado interno entre invocaciones. Las transformaciones de datos crean nuevos objetos en lugar de mutar los existentes.

**Por qué ayuda a la IA**: La mutación implícita es una fuente importante de bugs difíciles de rastrear, tanto para humanos como para IA. Con datos inmutables, la IA puede razonar sobre el flujo de datos sin preocuparse por efectos secundarios ocultos. Si una variable vale X al inicio de una función, vale X al final, sin importar qué otra función se haya llamado en medio.

**Aplicación práctica**:

```typescript
// ❌ Mal: Mutación del objeto original
function completeTask(task: Task): void {
  task.status = 'completed';
  task.completedAt = new Date();
}

// ✅ Bien: Crear nuevo objeto con los cambios
function completeTask(task: Task): CompletedTask {
  return {
    ...task,
    status: 'completed',
    completedAt: new Date()
  };
}
```

### Principio 6: Manejo Explícito de Errores

**Qué significa**: Los errores son ciudadanos de primera clase, no excepciones que se lanzan y se olvidan. Cada handler devuelve un resultado que puede ser éxito o error. Los tipos de error son explícitos y específicos. No se usan `try/catch` para control de flujo; se usan para errores verdaderamente inesperados.

**Por qué ayuda a la IA**: Cuando los errores son explícitos en el tipo de retorno, la IA puede ver de un vistazo qué puede fallar y cómo manejarlo. Con excepciones implícitas, la IA tiene que adivinar qué puede fallar, dónde se lanza la excepción y quién la captura, lo que lleva a manejos de error incompletos o incorrectos.

**Patrón Result**:

```typescript
// shared/types/Result.ts
export type Result<T, E = string> =
  | { success: true; data: T }
  | { success: false; errors: E[] };
```

```typescript
// En el handler
async execute(cmd: Command): Promise<Result<Response>> {
  const task = await this.repo.findById(cmd.taskId);
  if (!task) {
    return { success: false, errors: ['Tarea no encontrada'] };
  }
  // ... lógica
  return { success: true, data: { /* ... */ } };
}
```

---

## 🔄 Patrones de Comunicación entre Features

Las features no viven en aislamiento total. Necesitan comunicarse, pero esta comunicación debe ser explícita, desacoplada y rastreable.

### Patrón 1: Eventos de Dominio (Desacoplado)

Cuando una feature necesita notificar a otra que algo ocurrió, usa eventos de dominio. La feature emisora no sabe ni le importa quién la escucha; la feature receptora se suscribe al evento y reacciona.

```
features/complete-task/ → emite "task.completed" → features/send-notification/ reacciona
```

**Regla**: Los eventos se emiten después de que la transacción principal se completa exitosamente. Si el handler falla, no se emiten eventos.

### Patrón 2: Inyección de Dependencias (Acoplado Controlado)

Cuando una feature necesita usar directamente la funcionalidad de otra, inyecta su handler o servicio a través del constructor. La dependencia es explícita, tipada y reversible.

```typescript
class AssignTaskHandler {
  constructor(
    private readonly taskRepo: TaskRepository,
    private readonly notifyHandler: SendNotificationHandler  // dependencia explícita
  ) {}
}
```

**Regla**: Preferir eventos sobre inyección directa. Solo inyectar cuando la dependencia es sincrónica y estrictamente necesaria para el flujo principal.

### Patrón 3: Shared Kernel (Compartido)

Tipos y contratos compartidos que ambas features conocen. Esto incluye interfaces de repositorio, tipos de eventos y value objects compartidos. El shared kernel debe ser mínimo y estable; cambiarlo requiere coordinación.

---

## 🚫 Anti-Patrones: Lo que NO debemos hacer

Conocer lo que está prohibido es tan importante como conocer lo que está permitido. Estos anti-patrones son señales de alarma que la IA debe identificar y corregir.

### Anti-Patrón 1: God Feature

Una feature que hace demasiado. Si un handler tiene más de 100 líneas de lógica de negocio, probablemente está haciendo más de una cosa. Si un comando tiene más de 8 campos, probablemente debería ser dos comandos.

**Señales**:
- Handler con múltiples ramas `if/else` por tipo de operación
- Un comando que sirve para crear y actualizar
- Un response que cambia de forma radical según parámetros de entrada

**Corrección**: Dividir en features más pequeñas y específicas. "create-task" y "update-task" son features distintas, no una sola feature "manage-task".

### Anti-Patrón 2: Shared mutable state

Estado compartido mutable entre features. Variables globales que varias features leen y escriben. Singletons con estado. Cualquier mecanismo que permita que una feature afecte el comportamiento de otra mediante estado compartido no declarado.

**Señales**:
- Variables globales modificadas desde múltiples features
- Singletons con estado interno
- Cachés compartidos sin mecanismo de invalidación

**Corrección**: Usar inyección de dependencias para compartir estado, eventos para sincronizar cambios, y cachés con invalidación explícita.

### Anti-Patrón 3: Arrow Code / Callback Hell

Anidamiento profundo de condicionales, callbacks o promesas que hace el código ilegible horizontal y verticalmente. Si necesitas hacer scroll horizontal o el código tiene más de 3 niveles de indentación, hay un problema.

**Señales**:
- Más de 3 niveles de indentación en un handler
- `then().then().then()` encadenados profundamente
- `if` dentro de `if` dentro de `if` dentro de `else`

**Corrección**: Early returns, extracción de funciones auxiliares, async/await en lugar de then encadenados.

### Anti-Patrón 4: Abstracción Prematura

Crear capas de abstracción "por si acaso" antes de tener un caso de uso concreto. Interfaces con una sola implementación, clases base sin subclases, patrones de diseño aplicados sin necesidad real.

**Señales**:
- Interfaces con una sola implementación (y ninguna planeada)
- Capas de abstracción que solo delegan a la siguiente capa sin añadir valor
- Patrones de diseño (Strategy, Factory, etc.) usados donde un simple `if` sería más claro

**Corrección**: Aplicar la Regla de Tres: la primera vez, hazlo simple; la segunda vez, considera abstraer; la tercera vez, abstrae. No abstraigas antes de tener tres casos concretos.

### Anti-Patrón 5: Feature Entangled

Features que están tan acopladas que no se pueden entender por separado. Acceso directo a archivos internos de otra feature, dependencias circulares, estado compartido no declarado.

**Señales**:
- Imports que cruzan fronteras de features (importar desde `features/other-feature/SomeHandler.ts` en lugar de `features/other-feature/index.ts`)
- Features que se importan mutuamente
- Modificar una feature rompe tests de otra feature

**Corrección**: Solo importar desde el index.ts público de otra feature. Usar eventos para comunicación asíncrona. Si hay dependencia circular, extraer la lógica compartida a `shared/`.

---

## 📐 Plantillas de Código de Referencia

### Plantilla de Feature Completa

Al crear una nueva feature, seguir esta plantilla:

```
features/{verb}-{noun}/
├── {Verb}{Noun}Command.ts      # DTO de entrada con validación
├── {Verb}{Noun}Handler.ts      # Lógica de negocio
├── {Verb}{Noun}Response.ts     # DTO de salida
├── {verb}-{noun}.test.ts       # Tests unitarios
└── index.ts                     # API pública del slice
```

### Plantilla de Handler

```typescript
import type { {Verb}{Noun}Command } from './{Verb}{Noun}Command';
import type { {Verb}{Noun}Response } from './{Verb}{Noun}Response';
// Importar dependencias inyectadas desde shared o index de otras features

/**
 * Handler para la feature "{verb} {noun}".
 * [Descripción breve de qué hace y por qué existe esta feature]
 */
export class {Verb}{Noun}Handler {
  constructor(
    // Dependencias inyectadas explícitamente
  ) {}

  async execute(command: {Verb}{Noun}Command): Promise<{Verb}{Noun}Response> {
    // 1. Validar comando
    // 2. Cargar datos necesarios
    // 3. Aplicar reglas de negocio
    // 4. Persistir cambios
    // 5. Emitir eventos (si aplica)
    // 6. Retornar respuesta
  }
}
```

### Plantilla de Command

```typescript
/**
 * Comando para {verbo en infinitivo} {sustantivo}.
 * [Cuándo se usa, qué representa]
 */
export interface {Verb}{Noun}Command {
  // Campos obligatorios primero
  // Campos opcionales después, con ?
}

/**
 * Valida los datos del comando.
 * Retorna un array de errores (vacío si es válido).
 */
export const validate{Verb}{Noun}Command = (
  cmd: {Verb}{Noun}Command
): string[] => {
  const errors: string[] = [];
  // Validaciones explícitas
  return errors;
};
```

### Plantilla de Response

```typescript
/**
 * Respuesta de la feature "{verb} {noun}".
 */
export interface {Verb}{Noun}Response {
  success: boolean;
  data?: {
    // Campos de éxito
  };
  errors?: string[];
}
```

---

## ✅ Checklists de Verificación

La IA debe usar estos checklists para validar que su trabajo cumple con las directrices de este documento.

### Checklist: Creación de Nueva Feature

- [ ] La feature tiene su propio directorio bajo `features/`
- [ ] El nombre del directorio sigue kebab-case verbo-sustantivo (`create-order/`)
- [ ] Existe un archivo Command con interfaz y validación
- [ ] Existe un archivo Handler con lógica de negocio autocontenido
- [ ] Existe un archivo Response con tipo de éxito y error
- [ ] Existe un archivo index.ts que exporta solo la API pública
- [ ] Existen tests unitarios co-ubicados con patrón Arrange-Act-Assert
- [ ] El handler no excede 100 líneas de lógica (si excede, considerar división)
- [ ] Las dependencias están inyectadas, no importadas directamente desde implementaciones
- [ ] Los nombres son descriptivos y consistentes con las convenciones
- [ ] No hay imports a archivos internos de otras features (solo index.ts)
- [ ] Los errores se manejan con el patrón Result, no con excepciones de control de flujo

### Checklist: Modificación de Feature Existente

- [ ] El cambio se limita a los archivos de la feature afectada
- [ ] No se rompe la API pública de la feature (index.ts)
- [ ] Si se añade un campo al Command, es opcional o se actualizan todos los consumidores
- [ ] Si se añade un campo al Response, no se eliminan campos existentes
- [ ] Los tests existentes siguen pasando
- [ ] Se añadieron tests para el nuevo comportamiento
- [ ] No se introdujo dependencia a archivos internos de otra feature
- [ ] No se creó estado mutable compartido

### Checklist: Reestructuración de Feature

- [ ] La feature se puede dividir en features más pequeñas sin perder cohesión
- [ ] Las nuevas features mantienen la estructura canónica (Command, Handler, Response, test, index)
- [ ] La comunicación entre features divididas usa eventos o inyección explícita
- [ ] No hay dependencias circulares entre las features resultantes
- [ ] Los tests se redistribuyen a las features correspondientes
- [ ] La API pública original se mantiene o se migra explícitamente

### Checklist: Adición a shared/

- [ ] El código es genuinamente usado por 2+ features (Regla de Tres: esperar al tercer uso)
- [ ] No contiene lógica de negocio específica de un dominio
- [ ] Es estable (no cambia frecuentemente)
- [ ] Tiene su propia suite de tests
- [ ] Su API pública está bien definida y documentada

---

## 🔀 Flujos de Trabajo con la IA

### Al inicio de un proyecto

Cuando la IA reciba este documento al inicio de un proyecto nuevo, debe:

1. Proponer la estructura de directorios basada en las features identificadas en los requisitos.
2. Crear el esqueleto del proyecto con `src/features/`, `src/shared/`, `src/api/`.
3. Definir los contratos (interfaces) de las features principales antes de implementar.
4. Establecer el shared kernel mínimo necesario (Result, Entity, DomainEvent).
5. Implementar las features una por una, siguiendo la plantilla canónica.

### A mitad de un proyecto (reestructuración)

Cuando la IA reciba este documento para reestructurar un proyecto existente, debe:

1. Analizar la estructura actual y mapear código existente a features.
2. Identificar violaciones de los principios (God Features, acoplamiento, etc.).
3. Proponer un plan de migración incremental (no reescribir todo de golpe).
4. Mover código a la estructura de Vertical Slice feature por feature.
5. Asegurar que los tests pasan después de cada migración de feature.
6. Eliminar capas técnicas innecesarias (services, repositories genéricos) que no aporten valor en el nuevo modelo.

### Durante el desarrollo diario

Cuando la IA esté trabajando en una feature existente, debe:

1. Leer primero el index.ts de la feature para entender su API pública.
2. Leer el Handler para entender la lógica actual.
3. Hacer cambios respetando la estructura canónica.
4. Ejecutar tests de la feature para validar.
5. Verificar que no se rompen features dependientes.

---

## 📊 Resumen de Decisiones Arquitectónicas

| Decisión | Elección | Alternativa Descartada | Razón |
|----------|----------|----------------------|-------|
| Arquitectura principal | Vertical Slice | Capas horizontales | Contexto autocontenido para IA, bajo acoplamiento |
| Organización de features | Por caso de uso | Por entidad de dominio | Flujo lineal, cohesión funcional |
| Manejo de errores | Pattern Result | Excepciones | Errores explícitos en tipos, predecibles para IA |
| Comunicación entre features | Eventos + DI | Llamadas directas | Desacoplamiento, extensibilidad |
| Estado compartido | Inmutable | Mutable | Razonamiento simplificado, menos bugs |
| Abstracción | Regla de Tres | Abstracción prematura | Simplicidad, YAGNI |
| Nomenclatura | Descriptiva y consistente | Abreviada | Legibilidad para IA sin contexto previo |
| Testing | Unitario rápido + integración mínima | Solo integración | Feedback instantáneo para IA |
| Documentación | Fuente única, por qué no qué | Múltiples fuentes | Evita ambigüedad, 40% tiempo ahorrado |

---

## 🔧 Adaptaciones por Stack Tecnológico

Los principios de este documento son independientes del lenguaje y framework. Sin embargo, cada stack tiene particularidades que requieren adaptaciones menores:

### TypeScript / Node.js
- Usar interfaces para Commands y Responses (tipado estructural).
- Preferir `type` para uniones y `interface` para objetos.
- Usar `readonly` para propiedades inmutables en Commands.
- Tests con Jest o Vitest, mocks con `jest.Mocked<T>`.

### Python
- Usar `dataclasses` o `pydantic` para Commands y Responses.
- Usar `Protocol` para interfaces de dependencias.
- Tests con pytest, fixtures para setup.
- Usar `@dataclass(frozen=True)` para inmutabilidad.

### Java / Kotlin
- Usar `record` para Commands y Responses.
- Usar interfaces para contratos de repositorios.
- Tests con JUnit 5 + Mockito.
- En Kotlin, `data class` con `val` para inmutabilidad.

### C# / .NET
- Usar `record` para Commands y Responses.
- Usar `interface` para contratos.
- MediatR para despacho de commands a handlers.
- Tests con xUnit + NSubstitute.

---

> **Nota final**: Este documento es un organismo vivo. Debe evolucionar con cada proyecto y cada lección aprendida. Cuando la IA o el equipo identifiquen un patrón recurrente que no está cubierto aquí, debe proponerse una enmienda siguiendo el mismo formato y nivel de detalle. La consistencia del documento es tan importante como la consistencia del código.
