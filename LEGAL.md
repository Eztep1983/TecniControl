# DOCUMENTO LEGAL DE TECNICONTROL: TÉRMINOS Y CONDICIONES & POLÍTICA DE PRIVACIDAD
*Última actualización: 18 de junio de 2026*

Este documento establece las condiciones legales, términos de uso y políticas de tratamiento de datos personales de la aplicación **TecniControl** (en adelante, la "Aplicación" o "Plataforma"). La Plataforma está diseñada principalmente para empresas de mantenimiento técnico y técnicos independientes en la República de Colombia.

---

# PARTE I: TÉRMINOS Y CONDICIONES DE SERVICIO

Las presentes condiciones regulan el uso de la Plataforma TecniControl. Al registrarse, acceder o utilizar la Aplicación, el usuario acepta de manera expresa y sin reserva alguna los presentes Términos y Condiciones. Si no está de acuerdo, deberá abstenerse de utilizar la Plataforma.

## 1. Identificación del Proveedor Tecnológico y Relación Contractual
*   **Intermediario Tecnológico:** TecniControl se ofrece como una solución de software bajo el modelo de Software como Servicio (SaaS). El proveedor de la plataforma actúa única y exclusivamente como facilitador de la infraestructura tecnológica.
*   **El Responsable del Servicio (El Cliente de la Plataforma):** Cada empresa de mantenimiento, establecimiento de comercio o técnico independiente que crea una cuenta en TecniControl (el "Usuario Profesional") es responsable de registrar su propia identificación (Razón Social, NIT o Cédula, Dirección de domicilio y Datos de contacto) en el módulo de configuración de la Aplicación. 
*   **Exclusión de Relación Comercial Directa:** TecniControl no forma parte, ni es responsable, de las relaciones comerciales, contractuales o de prestación de servicios técnicos celebradas entre el Usuario Profesional y el cliente final (el "Cliente Final").

## 2. Descripción de las Funcionalidades de la Aplicación
TecniControl es una plataforma web y móvil (compilada mediante Capacitor para entornos nativos) que proporciona las siguientes funcionalidades clave para la digitalización del servicio técnico:
1.  **Registro y Gestión de Clientes y Equipos:** Almacenamiento sistematizado de los datos de contacto de Clientes Finales y la creación de un inventario detallado de sus dispositivos (tipo, marca, modelo, número de serie, estado técnico inicial y observaciones).
2.  **Creación de Órdenes de Mantenimiento (`OrdenMantenimiento`):** Generación de documentos digitales numerados que registran observaciones iniciales, pruebas realizadas, posibles causas de fallas, diagnóstico final e indicaciones sobre el tipo de servicio (Preventivo, Correctivo, Diagnóstico, Instalación o Garantía).
3.  **Gestión de Catálogos Predefinidos:** Configuración personalizada de listas de tareas comunes y repuestos/piezas de recambio frecuentes, facilitando al técnico la rápida selección y costeo durante su labor en campo.
4.  **Sistemas de Mediciones y Contadores:** Registro cuantitativo del desgaste o uso de los equipos (impresiones, copias, escaneos, horas de uso o unidades personalizadas) para un seguimiento preciso del mantenimiento.
5.  **Garantías e Instalaciones:** Gestión de la trazabilidad de garantías de servicios (fechas límite, motivos e historial) y especificación de parámetros de instalación.
6.  **Captura de Firma Digitalizada (`FirmaInput`):** Módulo gráfico que permite al Cliente Final plasmar su firma manuscrita de forma digitalizada sobre la pantalla del dispositivo del técnico, otorgando aceptación de la orden de servicio.
7.  **Sincronización Offline-First con Firebase:** Arquitectura técnica que almacena localmente la cola de operaciones pendientes (`OfflineSyncProvider`) de forma encriptada cuando el dispositivo carece de conexión a Internet, sincronizando automáticamente los datos con Firestore al restablecerse la red.
8.  **Generación de Reportes e Impresión:** Generación dinámica de reportes de servicio optimizados para impresión térmica o formato digital.
9.  **Asistente de Voz (Speech-to-Text):** Integración con herramientas de reconocimiento de voz de Capacitor para dictar diagnósticos y observaciones directamente a los campos de texto sin requerir escritura manual.

## 3. Cuentas de Usuario, Seguridad y Dispositivo Único
*   **Registro y Verificación:** Para utilizar TecniControl, el usuario profesional debe registrarse con un correo electrónico válido o autenticarse mediante Google Auth (Firebase Authentication). La verificación del correo electrónico es un requisito obligatorio de seguridad para el uso regular de la cuenta.
*   **Seguridad y Confidencialidad:** El usuario profesional es el único responsable de la confidencialidad de sus credenciales de acceso.
*   **Verificación del Dispositivo (`deviceId`):** La Plataforma lee el identificador único de hardware del dispositivo del usuario (en plataformas nativas mediante Capacitor) para validar que la sesión corresponda al dispositivo registrado del técnico, detectando inconsistencias para mitigar el riesgo de suplantación de identidad.
*   **Suspensión y Terminación:** TecniControl se reserva el derecho de suspender o cancelar cuentas de usuarios profesionales que violen las leyes locales, realicen fraude con las firmas, manipulen indebidamente los identificadores de la aplicación o incurran en impago de sus planes.

### 3.1. Política de Eliminación de Cuenta
De conformidad con los requisitos de distribución de tiendas de aplicaciones (como Google Play Console):
*   **Solicitud de Eliminación:** El Usuario Profesional podrá solicitar la eliminación permanente de su cuenta y todos sus datos directamente desde el panel de perfil en la aplicación o mediante el envío de un correo electrónico al soporte técnico oficial.
*   **Alcance de la Depuración:** Al procesarse la eliminación de la cuenta de usuario profesional, se procederá a borrar definitivamente del servidor: el perfil del usuario, la configuración del negocio, el catálogo de repuestos y tareas personalizadas, los perfiles de todos los Clientes Finales creados bajo ese negocio, y la totalidad de sus correspondientes dispositivos, órdenes de mantenimiento e imágenes base64 de firmas digitalizadas.
*   **Plazos de Ejecución:** Una vez recibida y confirmada la solicitud, el proceso de eliminación definitiva de los entornos de producción tardará un tiempo máximo de treinta (30) días calendario.
*   **Conservación Legal de Respaldo:** Ciertos datos de transacciones financieras o registros históricos de cobro e impuestos podrán conservarse en bases de datos contables separadas durante los plazos mínimos exigidos por la legislación tributaria y civil colombiana (generalmente cinco [5] años), tras lo cual serán completamente destruidos.

## 4. Roles y Permisos en la Plataforma
La Aplicación estructura los niveles de acceso bajo los siguientes perfiles:
1.  **Administrador:** Perfil con control completo sobre el perfil del negocio (`Negocio`), configuración de NIT, tarifas, logos de impresión, edición de catálogos globales de tareas y piezas de repuesto, acceso a estadísticas financieras y control global de la cola de sincronización.
2.  **Técnico / Colaborador (Usuario General):** Perfil orientado a la labor operativa en campo. Puede gestionar clientes, asociar dispositivos, diligenciar órdenes de servicio, registrar firmas de Clientes Finales y transcribir por voz sus diagnósticos. No posee facultades para alterar las configuraciones generales del negocio ni el logotipo.
3.  **Cliente Final:** Persona natural o jurídica que recibe el servicio de mantenimiento técnico. No posee una cuenta de acceso ni credenciales para ingresar a la plataforma. Su intervención se limita al suministro de información al técnico, la recepción física o digital del reporte de servicio, y la firma digital manuscrita sobre la pantalla del técnico en señal de conformidad.

## 5. Licencia de Uso y Propiedad Intelectual
*   **Licencia Limitada:** TecniControl otorga al Usuario Profesional una licencia de uso limitada, no exclusiva, revocable, personal y no transferible para utilizar la Aplicación de acuerdo con los planes contratados. Estos términos no constituyen una venta del software.
*   **Propiedad Exclusiva:** Todo el código fuente, la arquitectura de base de datos (incluidas las reglas de Firestore), los diseños de interfaz, los algoritmos de sincronización offline, la marca, logos y desarrollos de software asociados a TecniControl son propiedad intelectual exclusiva de los desarrolladores del sistema y están protegidos por las leyes de propiedad intelectual de la República de Colombia e internacionales.

## 6. Usos Prohibidos
Queda estrictamente prohibido a cualquier usuario:
*   Realizar ingeniería inversa, descompilación o intentar extraer el código fuente de la Aplicación.
*   Manipular, falsificar o inyectar firmas digitales en el lienzo gráfico (`FirmaInput`).
*   Alterar de forma fraudulenta los consecutives de las órdenes (`idPersonalizado`) o los contadores de las máquinas.
*   Registrar información falsa de clientes finales o de cédulas/NIT.
*   Utilizar la Aplicación como canal para subir contenido malicioso, virus o material ofensivo a la base de datos de Google Firebase.

## 7. Evidencias y Firma Digitalizada
*   **Firma Capturada como Evidencia:** La firma capturada a través del componente digital de lienzo (`FirmaInput`) podrá utilizarse como evidencia electrónica del consentimiento manifestado por el Cliente Final, de conformidad con la legislación colombiana aplicable (Ley 527 de 1999 y normas concordantes). 
*   **Intermediación Tecnológica:** TecniControl no certifica la identidad de los Clientes Finales que firman el dispositivo. La autenticidad y correspondencia de la firma con el titular de los datos es de exclusiva responsabilidad del técnico y de la empresa de mantenimiento que la recolectan.

## 8. Disponibilidad, Mantenimiento y Acuerdo de Nivel de Servicio (SLA)
*   **Acuerdo de Nivel de Servicio (SLA):** TecniControl procurará una disponibilidad técnica anual del 99% en el acceso a sus servidores y base de datos Firestore. No obstante, el Usuario Profesional reconoce que esta métrica es una meta operativa y no constituye una garantía de disponibilidad absoluta e ininterrumpida.
*   **Exclusión de Mantenimientos:** El cálculo del SLA excluye las ventanas de mantenimiento programado (notificadas con antelación) y eventos ajenos al control razonable del proveedor.
*   **Resiliencia Offline:** Para mitigar caídas de conectividad, la Plataforma incorpora una arquitectura offline que almacena de manera temporal y encriptada las órdenes en el dispositivo del técnico. No obstante, TecniControl no se responsabiliza por la pérdida de datos si el usuario desinstala la aplicación o borra el almacenamiento local (caché/IndexedDB) antes de que la sincronización se haya completado.

### 8.1. Copias de Seguridad y Recuperación de Datos
*   **Respaldo Técnico:** TecniControl implementa mecanismos de respaldo razonables y periódicos (snapshots automatizados) de la base de datos de Firestore para asegurar la continuidad del servicio en caso de desastres.
*   **Datos Eliminados por el Usuario:** La Plataforma no garantiza la recuperación ni restauración de información que haya sido eliminada de forma voluntaria o accidental por el Usuario Profesional (tales como la eliminación manual de un cliente o una orden de mantenimiento) utilizando la interfaz de la Aplicación, considerándose un borrado definitivo en caliente.
*   **Tiempos de Restauración:** Los tiempos de restauración frente a incidentes mayores de infraestructura dependerán de los acuerdos de servicio de Google Cloud Platform.

## 9. Suscripciones, Pagos y Facturación
*   **Planes:** La Plataforma cuenta con dos modalidades principales reflejadas en el perfil de usuario: plan gratuito (`free`) y plan profesional (`pro`). 
*   **Modelos de Pago:** El acceso al plan `pro` se rige bajo una suscripción recurrente mensual o anual. Los precios, términos de pago y renovaciones automáticas se detallan al momento de la adquisición del plan.
*   **Reembolsos:** Debido a que el software ofrece un plan de prueba o modalidad gratuita para comprobar su compatibilidad operativa, las solicitudes de reembolso se procesarán únicamente dentro de los primeros cinco (5) días hábiles siguientes al cobro, siempre que no se haya hecho un uso extensivo de las herramientas de exportación masiva o generación ilimitada de órdenes en ese periodo.

## 10. Limitación de Responsabilidad
*   **Daños Operativos:** TecniControl no asume responsabilidad alguna por pérdidas económicas, daños físicos causados por los técnicos a los equipos de los Clientes Finales, o decisiones comerciales o de garantía basadas en el uso de la Plataforma.
*   **Responsabilidad Civil Extracontractual:** En ningún caso el proveedor de la Plataforma será responsable por lucro cesante, daño emergente o perjuicios indirectos derivados del uso o de la imposibilidad de uso de la Aplicación.

### 10.1. Cláusula de Fuerza Mayor
TecniControl quedará completamente eximido de cualquier responsabilidad por interrupciones, pérdidas de datos, fallas o demoras en la disponibilidad de la plataforma que sean consecuencia directa de un caso fortuito o fuerza mayor, incluyendo sin limitarse a:
*   Interrupciones o fallas globales de conectividad y servicios de proveedores de telecomunicaciones locales.
*   Ataques informáticos a gran escala, ataques de denegación de servicio (DDoS) o intrusiones de malware que comprometan la infraestructura.
*   Desastres naturales, eventos meteorológicos extremos, incendios, inundaciones o pandemias.
*   Fallas técnicas masivas, caídas de centros de datos o degradación crítica de servicios provistos por Google Cloud Platform (Firebase).
*   Actos de autoridades gubernamentales, reglamentaciones de telecomunicaciones nacionales, decretos restrictivos o huelgas.

## 11. Titularidad y Portabilidad de los Datos
*   **Propiedad de los Datos:** Todos los datos, marcas de dispositivos, detalles de clientes finales, registros de contadores y firmas digitalizadas cargados en la Plataforma pertenecen de manera exclusiva al Usuario Profesional (la empresa o técnico) que los genera. TecniControl no adquiere ningún derecho de propiedad, explotación comercial ni uso de propiedad intelectual sobre dicha información, actuando estrictamente como custodio tecnológico.
*   **Portabilidad:** En línea con las mejores prácticas y derechos de portabilidad, el Usuario Profesional podrá, mientras su cuenta se encuentre activa, generar copias de seguridad locales y exportar sus registros históricos de órdenes, clientes y dispositivos a formatos universales estructurados como PDF, Excel (.xlsx) o archivos CSV.

## 12. Servicios de Terceros y Canales de Comunicación
*   **Envío de Mensajes:** La Plataforma permite al Usuario Profesional invocar y utilizar servicios de terceros (tales como la API oficial o de integración de WhatsApp de Meta, gestores de correo electrónico corporativo o sistemas de notificaciones push de Firebase) para el envío de los reportes y estados de servicio a sus Clientes Finales.
*   **Garantía de Entrega:** TecniControl no garantiza la entrega efectiva, recepción o lectura final de estos mensajes, ya que su distribución exitosa depende de la disponibilidad de las redes de terceros, del estado del plan telefónico del receptor, de la configuración de filtros de spam y de las políticas cambiantes de los operadores externos de mensajería.

## 13. Herramientas Automatizadas y Futuras Integraciones de IA
*   **Asistencia Tecnológica:** Algunas funcionalidades de la Plataforma, presentes o futuras, podrán utilizar algoritmos automatizados, plantillas sugeridas o herramientas de Inteligencia Artificial (IA) para asistir en la redacción de diagnósticos, traducción o predicción de fallas repetitivas.
*   **Responsabilidad del Criterio:** Estas herramientas se proporcionan exclusivamente como apoyo operativo de productividad. El Usuario Profesional comprende que los sistemas automatizados pueden cometer errores o interpretaciones inexactas y asume la responsabilidad de verificar y validar el contenido final del diagnóstico antes de imprimirlo, guardarlo o enviarlo al Cliente Final, prevaleciendo siempre el criterio humano y profesional del técnico asignado.

## 14. Ley Aplicable y Jurisdicción
Los presentes términos se rigen en su totalidad por las leyes comerciales, civiles y de comercio electrónico vigentes en la República de Colombia. Cualquier controversia derivada de la interpretación o ejecución de este contrato se someterá a la jurisdicción de los tribunales competentes de la República de Colombia.

---

# PARTE II: POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES (Habeas Data)

La presente Política de Privacidad y Tratamiento de Datos Personales se redacta en estricto cumplimiento de la **Ley Estatutaria 1581 de 2012** (Régimen General de Protección de Datos Personales) y el **Decreto 1377 de 2013** (incorporado en el Decreto Único Reglamentario 1074 de 2015) de la República de Colombia.

## 1. Roles en el Tratamiento de Datos (Ley 1581)
Es indispensable distinguir el alcance de las obligaciones legales en TecniControl:
*   **El Responsable del Tratamiento:** Es la empresa de mantenimiento, taller de servicio o técnico independiente (Usuario Profesional) que recolecta de primera mano los datos de sus clientes y decide sobre la finalidad de las bases de datos de servicios. Como Responsable, está obligado a obtener la autorización de Habeas Data de sus clientes finales y a responder ante la Superintendencia de Industria y Comercio (SIC).
*   **El Encargado del Tratamiento:** Es TecniControl (como plataforma tecnológica) que provee la infraestructura en la nube (a través de Google Firebase/Firestore) y almacena, procesa y encripta temporalmente la información parametrizada por el Responsable. TecniControl actúa bajo las instrucciones operativas del Responsable.

## 2. Categorías de Datos Recolectados
TecniControl recopila las siguientes categorías de datos en función del uso del sistema:

### A. Datos del Usuario Profesional (Técnico / Administrador)
*   **Identificación y Contacto:** Nombre completo, dirección de correo electrónico, foto de perfil (suministrada por Google Auth), número telefónico.
*   **Datos Corporativos:** Nombre comercial del negocio, dirección física del taller, teléfono de contacto corporativo, NIT o identificación tributaria, y logotipo empresarial.
*   **Datos Técnicos del Dispositivo:** Identificador único de hardware (`deviceId`), marca y modelo del dispositivo móvil, sistema operativo (Android/iOS/Web) y dirección IP de conexión.

### B. Datos del Cliente Final (Suministrados por el Técnico)
*   **Información Básica y de Contacto:** Nombre completo, número de identificación (Cédula de Ciudadanía, Extranjería o NIT), dirección física de residencia o local comercial, correo electrónico, números telefónicos de contacto.
*   **Datos de Equipos:** Tipo de dispositivo (computador, electrodoméstico, impresora, maquinaria, etc.), marca, modelo, número de serie, y descripción del estado técnico y fallas del equipo.

### C. Datos Sensibles y Biométricos
*   **Firma Manuscrita Digitalizada:** Se recolecta la firma manuscrita del Cliente Final digitalizada en formato de imagen base64. De acuerdo con el artículo 5 de la Ley 1581 de 2012, esta firma digitalizada es considerada un dato sensible/biométrico. Su recolección es estrictamente necesaria para validar la entrega, aceptación técnica de conformidad y perfeccionamiento del servicio de mantenimiento. 
*   **Autorización Biométrica:** El titular de los datos comprende y acepta de manera expresa que la firma digitalizada constituye un dato biométrico sensible y autoriza de manera voluntaria y explícita su tratamiento para los fines exclusivos de trazabilidad, auditoría contractual y validación del servicio técnico recibido.

## 3. Finalidad del Tratamiento de los Datos
Las finalidades para las cuales se recolectan y procesan los datos en la Plataforma son específicas y legítimas:
1.  **Gestión Operativa:** Creación, edición, consulta e impresión de órdenes de servicio técnico y mantenimiento.
2.  **Historial Técnico:** Almacenamiento y consulta histórica de mantenimientos realizados a los equipos asociados a cada cliente para facilitar garantías y futuros diagnósticos.
3.  **Trazabilidad y Conformidad Legal:** Registro formal de la aceptación del Cliente Final mediante su firma y datos de identificación, previniendo reclamaciones indebidas sobre el estado en el que se entregaron los equipos.
4.  **Seguridad y Auditoría:** Autenticación de sesiones de técnicos, prevención de accesos concurrentes no autorizados desde dispositivos ajenos y monitoreo de la integridad de la sincronización offline.
5.  **Registro de Auditoría (Logging):** La Plataforma registra eventos críticos de seguridad que incluyen la fecha y hora de los accesos, la creación o modificación de órdenes de servicio, las marcas de tiempo de las sincronizaciones offline y la actividad de administración de catálogos para fines de auditoría informática y prevención de fraude.
6.  **Notificaciones del Servicio:** Facilitar al técnico el envío de reportes al Cliente Final a través de canales de mensajería (como WhatsApp corporativo o correo electrónico).
7.  **Soporte Técnico:** Análisis de errores de sincronización offline, corrección de registros duplicados en la cola y optimización general de la Plataforma.

## 4. Consentimiento y Autorización del Titular
*   **Autorización del Cliente Final:** El Usuario Profesional (técnico o empresa de mantenimiento), en su calidad de *Responsable del Tratamiento*, se obliga a informar a sus Clientes Finales sobre el tratamiento de sus datos y a obtener su consentimiento libre, previo, expreso e informado. La firma en el componente digital de la orden de servicio junto con la selección de validación constituye la confirmación del consentimiento explícito respecto de la orden y la política de Habeas Data aquí descrita.
*   **Autorización del Técnico:** El Usuario Profesional autoriza el tratamiento de sus datos de registro al momento de crear su perfil en la Plataforma.

## 5. Derechos de los Titulares de los Datos
De conformidad con el artículo 8 de la Ley 1581 de 2012, todo titular de datos personales (Clientes Finales y Usuarios Profesionales) tiene derecho a:
*   Conocer, actualizar y rectificar sus datos personales frente a los Responsables o Encargados del Tratamiento.
*   Solicitar prueba de la autorización otorgada al Responsable del Tratamiento.
*   Ser informado por el Responsable o el Encargado del Tratamiento, previa solicitud, respecto del uso que le ha dado a sus datos personales.
*   Presentar ante la Superintendencia de Industria y Comercio (SIC) quejas por infracciones a lo dispuesto en la Ley 1581 de 2012.
*   Revocar la autorización y/o solicitar la supresión del dato cuando en el tratamiento no se respeten los principios, derechos y garantías constitucionales y legales.
*   Acceder en forma gratuita a sus datos personales que hayan sido objeto de tratamiento.

## 6. Procedimiento para Ejercer los Derechos de Habeas Data
Cualquier titular que desee consultar, actualizar, rectificar o solicitar la supresión de sus datos personales de las bases de datos de TecniControl podrá realizarlo de la siguiente manera:
1.  **Canal de Atención:** Envío de comunicación formal al correo electrónico de soporte técnico oficial configurado en el negocio.
2.  **Requisitos de la Solicitud:** La petición debe contener el nombre completo del titular, número de identificación (cédula o NIT), descripción de los hechos que dan lugar a la solicitud, dirección física o electrónica de contacto para recibir notificaciones, y copia del documento de identidad.
3.  **Tiempos de Respuesta (Ley 1581):**
    *   **Consultas:** Serán atendidas en un término máximo de diez (10) días hábiles contados a partir de la fecha de recibo. Si no fuere posible resolverla en ese plazo, se informará al interesado antes de su vencimiento y se dispondrá de hasta cinco (5) días hábiles adicionales.
    *   **Reclamos (Actualización, Rectificación, Supresión):** Serán atendidos en un término máximo de quince (15) días hábiles. Si no fuere posible resolverlo en este plazo, se notificará al interesado justificando la demora y se dispondrá de hasta ocho (8) días hábiles adicionales.

## 7. Medidas de Seguridad de la Información
Para garantizar la confidencialidad, integridad y disponibilidad de los datos personales, la Plataforma incorpora las siguientes salvaguardas técnicas:
*   **Cifrado Local de Datos (PII) con CryptoJS:** Todos los datos de identificación personal (PII) y payloads de órdenes de servicio que se almacenan en el almacenamiento local del navegador o de la base de datos local del móvil (LocalStorage/IndexedDB) son cifrados utilizando algoritmos **AES (Advanced Encryption Standard)** con claves de seguridad dinámicas vinculadas al UID del usuario autenticado. Esto previene que personas no autorizadas con acceso físico al dispositivo móvil lean los datos personales de los clientes.
*   **Control de Acceso Basado en Roles:** La base de datos Firebase restringe los accesos mediante políticas de seguridad específicas (`firestore.rules`). Ningún técnico puede leer o modificar clientes, dispositivos u órdenes pertenecientes a otra cuenta o negocio diferente al suyo.
*   **Cifrado en Tránsito:** Toda transmisión de datos entre la Aplicación y los servidores de Google Firebase se realiza mediante canales seguros utilizando el protocolo HTTPS y SSL/TLS.
*   **Firebase App Check:** Implementación de tokens de atestación para verificar que las peticiones a la base de datos y al almacenamiento provengan exclusivamente de la Aplicación oficial de TecniControl, bloqueando clientes no autorizados o peticiones directas de APIs externas.

## 8. Permisos de Hardware del Dispositivo (Móvil y Web)
La Aplicación requiere de la autorización de ciertos permisos en el dispositivo para ejecutar sus funciones esenciales:
*   **Acceso a Contactos (`@capacitor-community/contacts`):** Permiso opcional que se solicita en dispositivos móviles para permitir al usuario profesional importar la información de contacto de sus clientes (nombre, teléfono y correo electrónico) directamente desde su agenda telefónica sin digitación manual. Estos datos importados se almacenan localmente y se transmiten a la base de datos de Firestore bajo la exclusiva instrucción del técnico al crear el cliente.
*   **Micrófono y Reconocimiento de Voz (`@capacitor-community/speech-recognition`):** Utilizado para habilitar el copiado de diagnósticos y comentarios por voz en los campos de texto correspondientes de las órdenes de servicio. El audio capturado es transformado en texto localmente o a través de las APIs del sistema operativo y no se almacena en archivos de sonido en la nube.
*   **Estado de Red (`NetworkStatus`):** Permiso del sistema para detectar en tiempo real si el dispositivo está en línea u offline, gestionando el desvío automático de transacciones a la cola local encriptada.
*   **Información del Dispositivo (`Device`):** Solicitud del ID del dispositivo para el enrolamiento de sesión única del técnico y evitar suplantaciones de identidad.

## 9. Geolocalización
*   **Ausencia de Rastreo Continuo:** TecniControl **no realiza rastreo de geolocalización en segundo plano (background GPS tracking)** de los técnicos durante su jornada de trabajo.
*   **Ubicación Manual de Servicios:** Los datos geográficos almacenados corresponden exclusivamente a la dirección física del domicilio o local comercial del Cliente Final que el técnico digita manualmente en el campo `address` del formulario de cliente para programar el servicio técnico de campo.

## 10. Compartición con Terceros y Transferencia Internacional de Datos
*   **Proveedores de Infraestructura (Encargados de Soporte):** Los datos personales procesados se almacenan en servidores provistos por Google Cloud Platform (Google Firebase / Firestore / Authentication). El técnico y los clientes finales consienten de manera expresa esta compartición técnica imprescindible.
*   **Transferencia Internacional:** Dado que Google Firebase almacena información en centros de datos ubicados fuera del territorio de la República de Colombia (principalmente en Estados Unidos), el registro y uso de la Plataforma implica una **Transferencia Internacional de Datos Personales** debidamente autorizada por el titular del dato al aceptar esta política, de conformidad con lo establecido en el literal g) del artículo 26 de la Ley 1581 de 2012.

## 11. Cookies, Analítica y Monitoreo de Rendimiento
La Plataforma utiliza servicios analíticos y de monitoreo provistos por Google Firebase para mejorar de forma continua la usabilidad, la estabilidad técnica y la velocidad de respuesta del sistema. Específicamente se emplean:
*   **Firebase Analytics:** Monitorea de forma agregada y anónima cómo interactúan los técnicos con las diferentes secciones de la aplicación (creación de órdenes, catálogo de piezas, etc.).
*   **Firebase Crashlytics:** Registra de manera automatizada reportes de fallas técnicas críticas del código, cierres inesperados de la aplicación y trazas de error de sincronización local.
*   **Firebase Performance Monitoring:** Analiza los tiempos de carga de la interfaz, el rendimiento del renderizado del lienzo de firmas y la latencia de respuesta de los servidores de Firestore en Colombia.
*   *Nota:* Estas herramientas emplean identificadores de almacenamiento local (tipo cookies o tokens) de carácter estrictamente técnico y anónimo. No se realiza segmentación de datos con fines publicitarios ni de marketing invasivo.

## 12. Gestión de Incidentes y Brechas de Seguridad
*   **Mitigación Activa:** En caso de identificarse algún incidente técnico o violación de seguridad que comprometa la integridad de los datos personales almacenados en Firestore o en la caché local cifrada, TecniControl activará de forma inmediata sus protocolos de mitigación de daños y auditoría de accesos.
*   **Notificación a las Partes:** De conformidad con la ley aplicable en Colombia, se procederá a reportar la brecha de seguridad a la Superintendencia de Industria y Comercio (SIC) y a notificar oportunamente a los Usuarios Profesionales afectados mediante correo electrónico o avisos en la Plataforma, a fin de que tomen medidas preventivas (como el cambio de contraseña de acceso).

## 13. Tiempo de Conservación de los Datos
*   **Retención Operativa:** Los datos personales de clientes y los historiales de órdenes de servicio técnico serán conservados en la base de datos mientras se encuentre activa la cuenta del Usuario Profesional y sea necesario para garantizar los periodos de garantía comercial pactados, el cumplimiento de obligaciones legales de protección al consumidor e historial técnico.
*   **Eliminación Definitiva:** Ante una solicitud válida de supresión de datos o la cancelación de la cuenta del negocio en la Plataforma, se procederá a la depuración, borrado y anonimización de la información de las bases de datos de producción de Firestore en un plazo máximo de treinta (30) días calendario, salvo que exista una obligación legal o contractual que obligue a mantener la conservación del registro.

## 14. Enlaces a Sitios de Terceros y WebView
La Plataforma puede contener enlaces a sitios web de terceros o pasarelas de pago externas. TecniControl no ejerce control ni se responsabiliza por las políticas de privacidad, medidas de seguridad ni el tratamiento de datos que realicen estos terceros en sus respectivos dominios.

## 15. Menores de Edad
La Plataforma está dirigida exclusivamente a personas mayores de edad con capacidad legal para contratar. Queda prohibido el registro de datos personales de menores de edad en el sistema, salvo que se cuente con la representación legal explícita e intervención formal de sus padres o tutores en casos excepcionales de equipos de su propiedad.

## 16. Vigencia y Modificaciones de la Política
*   **Vigencia:** La presente política de privacidad entra en vigencia a partir del 17 de junio de 2026 y las bases de datos asociadas se mantendrán vigentes durante el tiempo que sea necesario para cumplir con sus finalidades operativas e impositivas.
*   **Modificaciones:** Nos reservamos el derecho de modificar esta política en cualquier momento para adaptarla a novedades legislativas de la Superintendencia de Industria y Comercio (SIC) o evoluciones técnicas de la Aplicación. Las modificaciones serán notificadas a través de alertas dentro de la Aplicación o mediante correo electrónico a los usuarios registrados.

---

### DATOS DE CONTACTO Y SOPORTE LEGAL
Para la radicación de PQRs relacionadas con Habeas Data, solicitudes de corrección de datos o reclamos contractuales sobre los presentes términos de servicio, puede comunicarse al canal oficial de soporte técnico de **TecniControl** a través del correo electrónico de atención al cliente configurado en la pantalla de bienvenida o en el panel de perfil de su negocio.
