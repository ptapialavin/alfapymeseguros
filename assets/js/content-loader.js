/* ==========================================================================
   CONTENT LOADER
   Lee content.json y aplica sus valores a todos los elementos del index.html
   que tengan el atributo data-cms="ruta.al.valor".

   Convención:
   - <img data-cms="..."> -> se actualiza el atributo src
   - <a data-cms="...">   -> se actualiza el atributo href
   - cualquier otro tag   -> se actualiza el texto (textContent)
   - data-cms-attr="X" fuerza que se actualice el atributo X en vez del
     comportamiento por defecto.

   Este archivo NO necesita tocarse para editar contenido: los cambios se
   hacen en content.json (a mano o con el panel admin.html).
   ========================================================================== */
(function () {
  function obtenerValor(obj, ruta) {
    return ruta
      .split('.')
      .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
  }

  function aplicarValor(el, valor) {
    if (valor === undefined || valor === null) return;

    const attrForzado = el.getAttribute('data-cms-attr');
    if (attrForzado === 'text') {
      el.textContent = valor;
      return;
    }
    if (attrForzado) {
      el.setAttribute(attrForzado, valor);
      return;
    }
    if (el.tagName === 'IMG') {
      el.setAttribute('src', valor);
      return;
    }
    if (el.tagName === 'A') {
      el.setAttribute('href', valor);
      return;
    }
    el.textContent = valor;
  }

  const DRAFT_KEY = 'alfapymes_cms_draft';

  async function obtenerDatos() {
    // Si hay un borrador guardado desde admin.html en ESTE navegador, se usa
    // para poder previsualizar cambios antes de publicarlos. Los visitantes
    // normales del sitio nunca ven este borrador (localStorage es local a
    // cada navegador).
    const borrador = localStorage.getItem(DRAFT_KEY);
    if (borrador) {
      try {
        return { data: JSON.parse(borrador), esBorrador: true };
      } catch (e) {
        /* borrador corrupto, se ignora y se sigue con content.json */
      }
    }
    const res = await fetch('./content.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('No se pudo leer content.json');
    return { data: await res.json(), esBorrador: false };
  }

  function mostrarAvisoBorrador() {
    const aviso = document.createElement('div');
    aviso.textContent =
      '👁 Vista previa de borrador sin publicar (solo visible en este navegador)';
    aviso.style.cssText =
      'position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#241b3a;' +
      'color:#fff;text-align:center;padding:8px 12px;font-size:13px;font-family:sans-serif;';
    document.body.appendChild(aviso);
  }

  async function cargarContenido() {
    try {
      const { data, esBorrador } = await obtenerDatos();
      if (esBorrador) mostrarAvisoBorrador();

      document.querySelectorAll('[data-cms]').forEach((el) => {
        const ruta = el.getAttribute('data-cms');
        const valor = obtenerValor(data, ruta);
        if (valor !== undefined && valor !== '') {
          aplicarValor(el, valor);
        }
      });

      // Caso especial: el link de email debe actualizar texto Y el href mailto:
      document.querySelectorAll('.js-email-link').forEach((el) => {
        const ruta = el.getAttribute('data-cms');
        const valor = obtenerValor(data, ruta);
        if (valor) {
          el.textContent = valor;
          el.setAttribute('href', `mailto:${valor}`);
        }
      });
    } catch (err) {
      // Si content.json no existe o falla la carga, el sitio sigue funcionando
      // con los valores que ya están escritos en el HTML.
      console.warn('content-loader: usando contenido por defecto del HTML.', err);
    }
  }

  document.addEventListener('DOMContentLoaded', cargarContenido);
})();
