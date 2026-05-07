# refactor.md

## Objetivo

Documentar el proceso de refactorización relacionado con la creación del nuevo componente de tipo **“Instalación”** y la mejora de la interfaz de selección de tipos de mantenimiento dentro de la aplicación de gestión de órdenes de servicio técnico.

La refactorización tiene como objetivos principales:

- Agregar un nuevo tipo de orden llamado **Instalación**.
- Mantener coherencia visual y estructural con los componentes existentes:
  - Preventivo
  - Correctivo
  - Diagnóstico
- Mejorar la experiencia de usuario cambiando la selección de tipos:
  - De disposición horizontal
  - A disposición vertical
- Mantener un enfoque **mobile-first**.
- Hacer el flujo más escalable para futuros tipos de servicio.
- Reducir tiempo de llenado mediante opciones predefinidas y formularios dinámicos.

---

# Proceso

## 1. Refactorización de la selección de tipos

Anteriormente la selección de tipos de mantenimiento se mostraba de manera horizontal, lo cual generaba varios problemas:

- Poco espacio en dispositivos móviles.
- Escalabilidad limitada al agregar nuevos tipos.
- Diseño comprimido en pantallas pequeñas.
- Mala experiencia visual al aumentar la cantidad de opciones.

### Cambio realizado

La selección de tipos fue modificada para utilizar una estructura vertical.

### Nuevo comportamiento

Ahora los tipos se muestran como una lista vertical de componentes seleccionables:

- Preventivo
- Correctivo
- Diagnóstico
- Instalación

### Beneficios

- Mejor lectura en dispositivos móviles.
- Mayor espacio para descripciones o estados.
- Escalabilidad para nuevos módulos.
- Mejor separación visual entre opciones.
- Interacción táctil más cómoda.

---

## 2. Creación del componente “Instalación”

Se creó un nuevo componente de selección llamado **Instalación**, el cual funciona bajo la misma lógica de selección de los otros tipos de mantenimiento.

Este componente puede ser seleccionado como tipo principal de la orden de servicio.

---

# Implementación y pruebas

## Estructura del componente “Instalación”

El componente contiene validaciones dinámicas mediante checks seleccionables.

### Funcionalidades implementadas

---

## A. Checking de recomendaciones

### Comportamiento

Cuando el usuario selecciona el check de:

- Recomendaciones

Se debe desplegar automáticamente:

- Un input opcional para escribir detalles.
- Opciones de recomendaciones predefinidas.

### Objetivo

Reducir tiempo de escritura y estandarizar recomendaciones frecuentes.

### Ejemplos de recomendaciones predefinidas

- Realizar mantenimiento preventivo cada 6 meses.
- No desconectar el dispositivo incorrectamente.
- Utilizar regulador de voltaje.
- Mantener el equipo en ambiente limpio.
- Verificar conexión de red periódicamente.

### Validaciones

- El input solo debe mostrarse si el check está activo.
- El campo es opcional.
- Debe permitir texto manual adicional.
- Debe permitir seleccionar recomendaciones rápidas.

---

## B. Checking de configuración

### Comportamiento

Cuando el usuario selecciona el check de:

- Configuración

Se debe mostrar una sección para indicar qué configuración fue realizada.

### Ejemplos

- Instalación de impresora.
- Configuración de escáner.
- Configuración de red.
- Configuración WiFi.
- Configuración de drivers.
- Configuración de impresión compartida.

### Objetivo

Permitir documentar claramente las configuraciones realizadas durante la instalación.

### Validaciones

- El bloque solo aparece si el check está activo.
- Debe permitir múltiples tipos de configuración.
- Debe adaptarse según el tipo de dispositivo.
- Debe permitir agregar configuraciones personalizadas.

---

## Refactorización visual

### Antes

- Selección horizontal.
- Componentes comprimidos.
- Difícil navegación en móvil.

### Después

- Selección vertical.
- Componentes con mejor separación.
- Mejor legibilidad.
- Mejor experiencia táctil.
- Diseño escalable.

---

## Consideraciones mobile-first

Durante la implementación se priorizó:

- Compatibilidad móvil.
- Espaciado táctil adecuado.
- Componentes responsivos.
- Inputs de fácil interacción.
- Scroll vertical natural.

---

## Pruebas realizadas

### Selección de tipo

- Selección correcta del componente Instalación.
- Cambio correcto entre tipos.
- Persistencia de estado.

### Recomendaciones

- Aparición dinámica del input.
- Funcionamiento correcto de checks.
- Inserción de recomendaciones predefinidas.
- Escritura manual validada.

### Configuración

- Renderizado dinámico del bloque.
- Visualización correcta en móvil.
- Manejo de múltiples configuraciones.

### Responsive

- Validación en pantallas móviles.
- Validación en tablet.
- Correcto comportamiento del layout vertical.

---

## Resultado esperado

La nueva implementación permite:

- Mejor experiencia de usuario.
- Mayor escalabilidad.
- Formularios más dinámicos.
- Menor fricción en el llenado.
- Mejor adaptación a dispositivos móviles.
- Base más limpia para futuros tipos de órdenes de servicio.
