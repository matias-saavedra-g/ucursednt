# Logros de U-Cursos

39 logros que se desbloquean haciendo cosas normales en U-Cursos, no usando funciones de la extensión. Se muestran en la página de Logros en cuatro secciones: Foros, Ramos/notas/tareas, Comunidad/perfil y Hábitos/exploración.

## Archivos

- **`js/catalog.js`**: `ACTION_GROUPS` (las 4 secciones) y `UCURSOS_ACTIONS` (id, grupo, ícono, nombre, descripción y rareza de cada logro). `findAchievement` también busca en esta lista, así el toast de `achievementToast.js` funciona sin cambios.
- **`js/ucursosActivity.js`**: content script en todas las páginas de U-Cursos (mismo bloque del manifest que `achievementToast.js`). Detecta las acciones y llama a `UcursedntUtils.Achievements.unlock`.
- **`js/achievementsGen.js`**: agrega una sección por grupo y cuenta estos logros en el progreso total.
- **`scripts/crawl_ucursos.py`**: crawler de solo lectura para verificar los selectores (ver el README).

## Cómo se detecta

| Momento | Qué se mira |
|---|---|
| Al cargar la página | Módulo actual (`ul.modulos li.servicio.sel`, o la clase de `#body`), hilos del foro (`div[id^="raiz_"]`, `.msg.hijo`, `#mensaje-titulo`), mascota sin tareas (`.mascota-ok`), tema (`link#css_ucampus`), idioma (`<html lang>`), `?p=` de la paginación, año del curso en la URL, perfil propio (`#widget_perfil`) y hora/fecha local. |
| Click | Estrella (`a.star.off`), reacción (`.reaccion-reaccionar span` dentro del modal `?adh_accion=modal`), Favoritos/Inicio (`subaccion=favorito` / `subaccion=inicio`, sin `.sel`), tema (`ul.themes a`), título de hilo y descargas (`a.download` → `bajar?id=…`). |
| Envío de formulario | Foro: `form[method=post][action=mensaje]` con `textarea[name=contenido]`. Correo: `post` con `textarea[name=mensaje]`. Afiche: `post` con `afiche[titulo]` o los campos ocultos `_file`/`archivo[]` del cargador. Tareas, encuestas y votaciones: cualquier `post` en ese módulo. |

Los clicks y envíos casi siempre navegan antes de que termine la escritura en `browser.storage`, así que se encolan en `sessionStorage` (`ucursedntActivityQueue`) y se procesan de inmediato o al cargar la página siguiente. La cola se vacía antes de procesarla para no contar dos veces.

## Estado guardado

`ucursosActivity` en `storage.sync`, escrito solo cuando cambia algo:

```json
{
  "lastDay": "2026-10-16", "streak": 3,
  "modules": ["foro", "notas", "..."],
  "communities": ["uchile/2008/0/COCEIMEC/1"],
  "gradesVisits": { "day": "2026-10-16", "course": "ingenieria/2026/2/ME4240/1", "count": 2 },
  "forumPosts": 1, "downloads": 4
}
```

Los umbrales (10 posts, 5 visitas a notas, 10 descargas, 3 comunidades, 12 módulos, página 50, cursos de hace 5 años, hilos de 10 respuestas) están en `LIMITS`, al inicio de `ucursosActivity.js`.

## Pendiente de verificar

En la cuenta usada para el crawl no había formularios de votación, encuesta ni entrega de tarea abiertos, así que esos tres logros usan la regla genérica "formulario `post` en el módulo". Si alguno no se desbloquea, corre el crawler cuando haya uno abierto y revisa `report.md`.
