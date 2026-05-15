## CONTEXTO DEL PROYECTO

Estoy desarrollando una aplicación con:
- **Next.js** como framework
- **Firebase/Firestore** como base de datos
- **Capacitor** para desplegar en Android e iOS
- Formulario multi-step tipo Stepper con navegación condicional
- Estado manejado con **useReducer** (patrón reducer)
- Cada step del formulario está en un componente separado

## COMPORTAMIENTO ACTUAL DEL STEPPER

- No se permite avanzar al siguiente step si el actual no está completo
- Una vez completado un step, el usuario puede navegar libremente hacia atrás y adelante para corregir datos
- **Problema principal**: los datos no persisten correctamente al navegar entre steps. Al volver atrás, los campos pierden su valor previo

## REQUERIMIENTOS ESPECÍFICOS

### 1. Implementar useReducer correctamente

Quiero migrar/mantener el estado global del formulario usando `useReducer`. El estado debe contener TODOS los campos de todos los steps y el reducer debe manejar acciones para cada campo. Esto debe garantizar que:

- Los datos persistan al navegar entre steps (atrás y adelante)
- El estado sea inmutable y predecible
- El step actual también sea parte del estado del reducer

2. Campo de firma digital (Canvas)
El step de firma tiene:

Un Canvas para dibujar la firma digital

Un toggle para hacer la firma opcional (on/off)

Un checkbox de validación/aceptación

NOTA: NO incluir input de texto para nombre del firmante (es redundante, ya se pide en otro step)

Comportamiento requerido:

Toggle ON: el usuario puede dibujar en el Canvas. La firma se almacena como string base64 en el estado

Toggle OFF: el Canvas se deshabilita/oculta. El campo firmaCliente debe ser null (no un string vacío). El formulario debe ser válido sin firma

Checkbox de aceptación: debe estar marcado para que el step sea válido

Al volver atrás y adelante: si el usuario firmó, la firma debe seguir visible en el Canvas. Si no firmó, el Canvas debe aparecer en blanco

3. Persistencia de datos entre steps
El estado del reducer DEBE mantener todos los valores al navegar entre steps

Si el usuario va al step de resumen (step final) y vuelve atrás para cambiar algo, el valor modificado debe reflejarse correctamente en el resumen al avanzar de nuevo

El toggle de firma en OFF no debe eliminar una firma previa si el usuario vuelve atrás después de haber firmado (manejar el caso: usuario firma → va al resumen → vuelve atrás → el toggle sigue ON y la firma sigue visible)

4. Resumen final
El step final muestra todos los datos del formulario

Debe reflejar en tiempo real cualquier cambio que el usuario haga al volver atrás y modificar datos

Si la firma está habilitada y tiene valor, mostrar la imagen de la firma. Si está deshabilitada o es null, mostrar "Sin firma" o equivalente

5. Almacenamiento en Firestore
La firma debe guardarse en Firestore de forma óptima:

Usar el formato más económico posible (base64 comprimido o representación vectorial si es viable sin perder fidelidad visual)

La firma guardada debe poder visualizarse correctamente al recuperarla

Si firmaHabilitada es false o firmaCliente es null, guardar explícitamente null en Firestore (no string vacío ni undefined)

6. Mejores prácticas para Capacitor (Android/iOS)
El Canvas de firma debe funcionar correctamente en dispositivos táctiles (stylus y dedo)

Manejar eventos touchstart, touchmove, touchend además de los eventos de mouse

Prevenir el scroll/zoom de la página mientras se dibuja en el Canvas (usar touch-action: none y e.preventDefault())

El Canvas debe ser responsive y mantener la relación de aspecto en diferentes tamaños de pantalla y orientaciones (landscape/portrait)

Usar window.devicePixelRatio para que la firma se vea nítida en pantallas de alta densidad (Retina)

RESTRICCIONES
No inventar funcionalidades no solicitadas

No romper el funcionamiento existente del Stepper

No cambiar la estructura de navegación del Stepper 

No modificar otros steps que no sean el de firma, excepto para integrar el reducer


Eliminar el input de texto del nombre del firmante del step de firma (es redundante)

DE no ser estrictamente necesario.

El código debe ser TypeScript

ENTREGABLE ESPERADO
Necesito el código completo para:

El reducer (formReducer) con todas las acciones necesarias

El componente FirmaInput actualizado (sin input de nombre, solo Canvas + toggle + checkbox)

La integración del reducer en el componente padre del Stepper

La lógica para guardar/recuperar la firma en Firestore de forma óptima

El step de resumen mostrando correctamente el estado de la firma