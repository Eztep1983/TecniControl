Contexto:
Aplicación móvil híbrida desarrollada con Capacitor (Android/iOS). Se requiere refactorizar componentes críticos relacionados con la selección de tipos de trabajo (preventivo/correctivo), gestión de tareas y repuestos, y la visualización de actividades realizadas. El objetivo es corregir problemas de usabilidad, estilos, jerarquía visual y accesibilidad con teclado (especialmente en dispositivos táctiles).

1. Comportamiento de selección de tipo de trabajo (cierre tras selección)
Problema actual:
Al seleccionar un tipo de trabajo (preventivo o correctivo), los demás tipos aún permanecen visibles, lo que genera confusión.

Requisitos de refactorización:

Al hacer clic/toque en un tipo de trabajo (ej. “Preventivo”), se debe ocultar completamente la vista de los otros tipos, mostrando únicamente:

El tipo seleccionado (como cabecera o indicador activo).

El contenido asociado a ese tipo (lista de tareas, repuestos, etc.).

Debe existir una opción clara (botón, enlace o elemento UI) para cambiar de tipo o volver a la selección inicial. Al activarla, se deben mostrar nuevamente todos los tipos disponibles, permitiendo elegir otro.

El cambio de tipo no debe perder datos ya ingresados en el tipo anterior (a menos que sea explícitamente necesario, pero se recomienda mantenerlos en un estado local o no destructivo).

Criterios de aceptación:

Solo un tipo visible a la vez tras la selección.

Opción visible y funcional para volver a la pantalla de selección de tipos.

Transiciones suaves (sin parpadeos ni saltos de layout).

2. Corrección de estilos y problemas al agregar tareas o repuestos (predefinidos o personalizados)
Problemas observados:

Los estilos se rompen al alternar entre tareas/repuestos predefinidos vs personalizados.

Posibles errores de estado (no se agrega correctamente, se duplica, o no se valida).

Mala experiencia al escribir en campos personalizados (teclado móvil cubre input, foco perdido, etc.).

Requisitos de refactorización:

Revisar y unificar los estilos para ambos modos (predefinido y personalizado) tanto en preventivo como correctivo. Asegurar:

Consistencia de tamaños, colores, espaciados y tipografía.

Estados hover/focus/active adecuados para pantallas táctiles (área de toque mínima 44x44px).

Corregir la lógica de agregado:

Validar que no se agreguen tareas o repuestos vacíos.

Mostrar feedback visual (ej. toast o mensaje temporal) al agregar correctamente.

Resolver problemas de teclado en Capacitor:

Ajustar el scroll automático para que el campo activo no quede oculto tras el teclado virtual.

Asegurar que el botón “Agregar” o “Confirmar” sea accesible sin necesidad de cerrar el teclado manualmente.

Manejar correctamente el evento keyboardDidShow / keyboardDidHide (si es necesario).

Criterios de aceptación:

La interfaz no se distorsiona al cambiar entre modos predefinido/personalizado.

Se puede agregar elementos sin errores de duplicación o pérdida de datos.

El teclado móvil no interfiere con la visibilidad ni la acción de agregar.

3. Refactorización de “Actividades Realizadas” y “Repuestos Utilizados” (vista de preventivo/correctivo)
Problemas actuales:

Selección de tarea o repuesto poco intuitiva (especialmente con teclado).

Problemas de jerarquía visual (no se diferencia claramente entre cabeceras, elementos agregados, botones de acción).

Dificultades de navegación por teclado (tabulación, focus, selección con enter/espacio) en una Capacitor App.

Posibles conflictos de estado al alternar entre preventivo y correctivo dentro de esta misma vista.

Requisitos de refactorización:

Selección de tarea/repuesto:

Mejorar el componente de selección (puede ser un modal, un select nativo o lista desplegable) para que funcione bien táctilmente y con teclado externo (si aplica).

Asegurar que se pueda seleccionar usando solo el teclado (foco, flechas, intro).

Jerarquía y estilos:

Usar encabezados claros (por ejemplo, <h3>) para separar secciones.

Cada ítem agregado debe tener un diseño consistente (fondo, borde, botón de eliminar).

Los botones de acción (“Agregar tarea”, “Agregar repuesto”) deben estar bien diferenciados y accesibles.

Problemas de teclado específicos en Capacitor:

Implementar ion-input o elementos nativos con soporte para enter como confirmación de selección.

Manejar el foco automático al abrir un modal de selección, y devolver el foco al elemento anterior al cerrar.

Evitar que la página haga scroll involuntario al usar teclado.

Sincronización entre preventivo y correctivo:

Asegurar que al cambiar entre tipos, los datos de “Actividades Realizadas” y “Repuestos Usados” se mantengan según el tipo correspondiente (no se mezclen).

Si se usa un solo estado, refactorizar para tener dos colecciones independientes.

Criterios de aceptación:

La selección de tareas/repuestos es fluida con toque y con teclado.

La jerarquía visual es clara (secciones diferenciadas).

Navegación por teclado completa y sin atascos.

Los datos de preventivo y correctivo no se sobrescriben ni confunden.

Formato de la respuesta esperada
Por favor, entrega el código refactorizado (o los fragmentos más relevantes) junto con una explicación concisa de los cambios realizados en cada punto. Si la refactorización implica cambios en la arquitectura (estado global, hooks, etc.), menciónalo. Además, incluye notas sobre cómo probar las correcciones en un dispositivo real o emulador con Capacitor.