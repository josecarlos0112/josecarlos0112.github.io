# José Carlos Zorrilla — web personal

Landing page personal construida a partir de mi CV. HTML, CSS y JavaScript sin dependencias ni build.

- **En vivo:** https://josecarlos0112.github.io
- **Datos:** todo el contenido se genera desde [`data/cv.json`](data/cv.json) (bilingüe ES/EN). Para actualizar la web basta con editar ese archivo.
- **Funciones:** selector de idioma ES/EN, tema claro/oscuro, descarga del CV en Word y animaciones que respetan `prefers-reduced-motion`.

## Ver en local

```bash
npx http-server -p 8080
# abre http://localhost:8080
```

(Hace falta un servidor: `cv.json` se carga con `fetch`, que no funciona abriendo el HTML directamente.)
