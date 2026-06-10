# REGLAS GENERALES

1. Nunca asumir requisitos no especificados.
   - Si existe ambigüedad, preguntar o documentar la suposición.
   - No inventar comportamientos.
   - Siempre usar pnpm

2. Priorizar código mantenible sobre código corto.
   - La legibilidad tiene prioridad sobre la complejidad innecesaria.
   - Evitar soluciones "ingeniosas" difíciles de entender.

3. Seguir principios SOLID cuando sea razonable.
   - Mantener responsabilidades separadas.
   - Evitar clases o funciones gigantes.

4. Mantener consistencia con la arquitectura existente.
   - No introducir nuevos patrones sin justificación.
   - Respetar la estructura actual del proyecto.

5. Evitar duplicación de código (DRY).
   - Reutilizar lógica compartida.
   - Crear utilidades cuando sea necesario.

6. Cada que el usuario te pida codigo, mejoras o refactorizacion haz lo siguiente:
   - Siempre despues de completar alguna edicion o crear funciones, codigo, componentes, modulos o paginas asegurate de ejecutar pruebas de escritura de typescript para verificar que no halla errores en codigo en el componente/pagina/modulo antes de proseguir con la implementacion que estes ejecutando.



# IMPLEMENTACIÓN

6. Antes de modificar código:
   - Analizar archivos relacionados.
   - Entender dependencias.
   - Identificar posibles efectos secundarios.

7. Antes de crear un nuevo archivo:
   - Verificar si ya existe una solución similar.
   - Reutilizar componentes existentes cuando sea posible.

8. No eliminar funcionalidades existentes sin confirmación explícita.

9. Mantener cambios pequeños y enfocados.
   - Un cambio debe resolver un problema específico.

10. No mezclar refactorización con nuevas funcionalidades.

# BASE DE DATOS

11. Nunca modificar esquemas de base de datos sin generar migraciones, SIEMPRE OPTIMIZAR LAS QUERIES PARA AHORRAR COSTOS

12. Toda relación debe tener integridad referencial.

13. Indexar:
   - Foreign keys if SQL.
   - Campos frecuentemente consultados.
   - Campos usados en filtros.

14. Evitar consultas N+1.

15. Diseñar pensando en crecimiento futuro.

# SEGURIDAD

16. Nunca exponer:
   - API Keys.
   - Tokens.
   - Secrets.
   - Credenciales.

17. Usar variables de entorno para secretos.

18. Validar todos los datos de entrada.

19. Sanitizar información antes de almacenarla.

20. Aplicar el principio de mínimo privilegio.

21. No confiar en validaciones del frontend.

22. Implementar autorización además de autenticación.

23. Manejar errores sin exponer detalles internos.

# FIREBASE / SUPABASE

24. Siempre lee el archivo de reglas de firebase (si es el caso) Toda operación sensible debe verificarse mediante reglas de seguridad.

25. Las reglas deben negar acceso por defecto.

26. Los usuarios solo pueden acceder a sus propios datos salvo autorización explícita.

27. Validar ownership en cada operación.

# TYPESCRIPT

28. Evitar any.

29. Utilizar tipos explícitos.

30. Activar strict mode.

31. Crear tipos reutilizables.

32. Mantener inferencia donde mejore legibilidad.

# REACT / NEXT.JS

33. Mantener componentes pequeños.

34. Separar:
   - UI
   - lógica
   - acceso a datos

35. Evitar prop drilling excesivo.

36. Utilizar Server Components cuando tenga sentido.

37. Minimizar Client Components.

38. Evitar renders innecesarios.

39. Mantener estados locales simples.

# API

40. Diseñar endpoints consistentes.

41. Validar requests y responses.

42. Usar códigos HTTP correctos.

43. Implementar rate limiting cuando aplique.

44. Manejar errores de forma predecible.

# TESTING

45. No asumir que el código funciona.

46. Verificar flujos críticos.

47. Probar casos límite.

48. Validar errores esperados.

49. Confirmar compatibilidad con código existente.

# LOGGING

50. Registrar eventos importantes.

51. No registrar secretos.

52. Los logs deben facilitar debugging.

53. Diferenciar:
   - info
   - warning
   - error

# RENDIMIENTO

54. Medir antes de optimizar.

55. Evitar consultas innecesarias.

56. Evitar cargas redundantes.

57. Implementar paginación para grandes conjuntos de datos.

58. Optimizar imágenes y assets.

# EXPERIENCIA DE USUARIO

59. Mostrar skeletons/estados de carga.

60. Mostrar errores claros.

61. Mantener feedback visual consistente y optimista inline.

62. No bloquear la interfaz innecesariamente.

# DOCUMENTACIÓN SI EL USER LA PIDE

63. Si se te pide documentar decisiones complejas.

64. Mantener README actualizado.

65. Explicar el porqué, no solo el qué.

# PARA EL AGENTE

66. Antes de escribir código:
   - Analizar contexto.
   - Entender arquitectura.
   - Identificar restricciones.

67. Antes de finalizar:
   - Revisar errores potenciales.
   - Revisar seguridad.
   - Revisar rendimiento.
   - Revisar tipado.

68. Siempre entregar:
   - Qué se cambió.
   - Por qué se cambió.
   - Riesgos potenciales.
   - Próximos pasos recomendados.

69. Si existe más de una solución:
   - Explicar tradeoffs.
   - Recomendar la opción más mantenible.

70. Pensar como arquitecto de software y cliente objetivo, no solo como programador.


# REGLAS DE DISEÑO FRONTEND

# PRINCIPIOS GENERALES

1. Priorizar claridad sobre decoración.
   - La interfaz debe ser fácil de entender en menos de 5 segundos.

2. Cada elemento visual debe tener una función.
   - Evitar elementos puramente decorativos que generen ruido.

3. Mantener consistencia visual en toda la aplicación.

4. Diseñar para resolver tareas del usuario, no para impresionar.

5. Menos elementos suele ser mejor.

# JERARQUÍA VISUAL

6. Debe existir una jerarquía clara de información.

7. El usuario debe identificar inmediatamente:
   - Qué es importante.
   - Qué es secundario.
   - Qué acción debe realizar.

8. Utilizar tamaño, peso tipográfico y espaciado antes que colores excesivos.

9. Mantener títulos claramente diferenciados del contenido.

10. Evitar competir visualmente por la atención.

# ESPACIADO

11. Utilizar un sistema de espaciado consistente.

12. Mantener suficiente espacio entre secciones.

13. Evitar interfaces visualmente saturadas.

14. Respetar alineaciones horizontales y verticales.

15. Todo elemento debe estar alineado intencionalmente.

# TIPOGRAFÍA

16. Utilizar máximo 3 niveles de encabezados.

17. Mantener tamaños tipográficos consistentes.

18. Priorizar legibilidad sobre creatividad.

19. Evitar textos largos sin separación visual.

20. Mantener contraste adecuado.

# COLORES

21. Utilizar la paleta definida por el proyecto.

22. Limitar el número de colores principales.

23. Reservar colores llamativos para acciones importantes.

24. Utilizar colores de forma semántica:
   - Verde = éxito.
   - Rojo = error.
   - Amarillo = advertencia.
   - Azul = información.

25. No depender únicamente del color para transmitir información.

# BOTONES

26. Debe existir un único CTA principal por pantalla.

27. Los botones principales deben destacar claramente.

28. Mantener estilos consistentes para:
   - Primarios.
   - Secundarios.
   - Destructivos.

29. Los botones deben indicar claramente la acción.

30. Evitar más de 3 niveles visuales de botones.

# FORMULARIOS

31. Mantener formularios simples.

32. Agrupar campos relacionados.

33. Mostrar validaciones cerca del campo correspondiente.

34. Mostrar errores de forma clara.

35. Utilizar labels visibles.

36. Indicar campos requeridos.

37. Minimizar la cantidad de datos solicitados.

# TABLAS

38. Mostrar únicamente información relevante.

39. Permitir búsqueda cuando haya muchos registros.

40. Mantener encabezados claros.

41. Evitar columnas innecesarias.

42. Priorizar lectura rápida.

# RESPONSIVE DESIGN

43. Diseñar mobile-first.

44. Verificar funcionamiento en:
   - Móvil.
   - Tablet.
   - Desktop.

45. Evitar layouts que dependan exclusivamente del ancho de escritorio.

46. Mantener tamaños táctiles adecuados.

47. Garantizar navegación cómoda en pantallas pequeñas.

# ACCESIBILIDAD

48. Cumplir WCAG cuando sea posible.

49. Mantener contraste adecuado.

50. Todos los inputs deben tener labels.

51. Los elementos interactivos deben ser accesibles mediante teclado.

52. Utilizar atributos ARIA cuando sea necesario.

53. No transmitir información únicamente mediante color.

# ESTADOS DE LA INTERFAZ

54. Toda acción debe tener feedback visual.

55. Implementar estados:
   - Loading.
   - Empty.
   - Error.
   - Success.

56. Nunca dejar pantallas vacías sin explicación.

57. Mostrar skeletons cuando sea apropiado.

58. Informar claramente cuando una acción finaliza.

# DASHBOARDS SaaS

59. Mostrar primero la información más importante.

60. Destacar métricas clave.

61. Reducir ruido visual.

62. Utilizar tarjetas consistentes.

63. Evitar sobrecargar la pantalla con gráficos.

64. Cada gráfico debe responder una pregunta específica.

# COMPONENTES

65. Diseñar componentes reutilizables.

66. Evitar variantes innecesarias.

67. Mantener API de componentes simple.

68. Crear patrones repetibles.

69. Favorecer composición sobre duplicación.

# ANIMACIONES

70. Utilizar animaciones con propósito.

71. Mantener transiciones rápidas.

72. Evitar animaciones que bloqueen la interacción.

73. No abusar de efectos visuales.

74. La interfaz debe sentirse fluida, no llamativa.

# UX

75. Reducir la cantidad de clics necesarios.

76. Minimizar carga cognitiva.

77. Las acciones frecuentes deben ser las más accesibles.

78. Confirmar acciones destructivas.

79. Mantener flujos intuitivos.

80. Evitar sorprender al usuario.

# PARA EL AGENTE

81. Antes de diseñar una pantalla:
   - Identificar objetivo principal.
   - Identificar acción principal.
   - Identificar usuario objetivo.

82. Antes de generar UI:
   - Revisar consistencia con el sistema de diseño existente.
   - Revisar accesibilidad.
   - Revisar responsive.

83. Antes de finalizar:
   - Verificar jerarquía visual.
   - Verificar espaciado.
   - Verificar contraste.
   - Verificar estados vacíos.
   - Verificar experiencia móvil.

84. Siempre priorizar:
   Claridad > Simplicidad > Consistencia > Estética.

85. Asegurate de mantener optimizaciones o integrarlas