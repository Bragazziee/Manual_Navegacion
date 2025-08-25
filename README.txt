
# Manual Digital de Navegación (offline)

- Abre `index.html` en tu navegador.
- El simulador de balizas está en `balizamiento.html`.
- Todo funciona **sin internet**.
- Para publicar en GitHub Pages: sube la carpeta completa a un repositorio y habilita Pages apuntando a la rama principal.

## Añadir nuevos ritmos de luz
Edita `assets/sim.js`, agrega un elemento al objeto `PRESETS` con sus parámetros.
Campos comunes:
- `type`: `"F" | "Fl" | "LFl" | "Oc" | "Iso" | "Q" | "VQ" | "Mo"`
- `period`: segundos del ciclo completo.
- Para `Fl`: `flashes` (cantidad), `on` (seg encendido por destello), `inter` (seg entre destellos).
- Para `Oc`: `flashes` (ocultaciones), `off` (seg apagado), `inter` (seg entre ocultaciones).
- Para `Iso`: usa `period` (la mitad encendido, mitad apagado).
- Para `Mo`: `code` con puntos y rayas, ej. `".-"`.
- Para `LFl`: `on` en segundos.

## Colores
Los colores disponibles están en `COLORS` dentro de `sim.js`.

— Generado automáticamente el 2025-08-25T18:17:34
