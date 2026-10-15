# 🤖 Cyber TV Robot Cursor Companion — Centro de Recargas

Una experiencia interactiva donde la imagen de un personaje con cabeza de televisor CRT ([AWWWARDS Element](https://assets.awwwards.com/awards/element/2026/08/6a723ca75432e944538163_static.jpeg)) cobra vida y se transforma en un **Robot Flotante Autónomo** que sigue tu cursor.

---

## ✨ Características

1. **Transformación Visual**:
   - Cabeza de televisor CRT extraída con fondo 100% transparente (`robot-head.png`), preservando el bisel metálico, botones, conectores y cables colgantes.
2. **Física de Inercia 3D y Seguimiento Suave**:
   - Sigue el cursor con aceleración de resorte y desaceleración fluida (Lerp).
   - Inclinación 3D en tres ejes (`rotateX`, `rotateY`, `rotateZ`) respondiendo a la velocidad y dirección del ratón como un dron en vuelo.
   - Levitación antigravitatoria oscilante en reposo.
3. **Ojos CRT Reactivos**:
   - Parpadeo realista temporizado.
   - Reacción a clics: los ojos se arquean en expresión de alegría `^ ^` y expulsan chispas de plasma.
   - Escaneo cibernético: al pasar sobre botones o enlaces, despliega una retícula de objetivo.
4. **Propulsores Iónicos y Chispas**:
   - Toberas gemelas bajo la TV con animación pulsante y estelas de partículas en Canvas 2D.
5. **Efectos de Audio Retro (Web Audio API)**:
   - Sonidos sintetizados nativos (*bip*, *chirp*, *transformación*, *hover*) sin dependencias externas.
6. **Selector de Colores y Modos**:
   - Colores: Cian Cibernético, Verde Neón, Púrpura, Oro Estelar, Blanco Puro.
   - Modos: **Dron Acompañante** (vuelo fluido con inercia) o **Puntero Fijo** (bloqueado al puntero).

---

## 🚀 Cómo Usarlo

### 1. Probar Localmente
Abre [`index.html`](index.html) con un doble clic en tu navegador preferido (Chrome, Edge, Firefox, Safari).

### 2. Usar en Cualquier Página Web
Solo copia [`robot-cursor.js`](robot-cursor.js) y [`robot-head.png`](robot-head.png) en tu proyecto e incluye el script:

```html
<script src="robot-cursor.js"></script>
```

El robot se activará automáticamente para usuarios con ratón/trackpad.

---

## 📁 Estructura de Archivos

```
centro de recargas/
├── index.html            # Demostración interactiva y panel de transformación
├── robot-cursor.js       # Biblioteca JavaScript independiente reutilizable
├── robot-head.png        # Recorte transparente HD de la cabeza del robot
├── robot-source.jpeg     # Imagen estática de referencia original
└── README.md             # Documentación
```
