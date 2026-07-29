/* ==========================================================================
   PANEL ADMIN — admin.js
   Panel simple para editar content.json sin tocar código.
   No tiene backend: guarda un borrador en localStorage (solo en este
   navegador, para previsualizar) y permite descargar el content.json
   actualizado para reemplazarlo en el repositorio.
   ========================================================================== */
(function () {
  const DRAFT_KEY = 'alfapymes_cms_draft';
  let state = null;

  function obtenerValor(obj, ruta) {
    return ruta
      .split('.')
      .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
  }

  function fijarValor(obj, ruta, valor) {
    const partes = ruta.split('.');
    let cur = obj;
    for (let i = 0; i < partes.length - 1; i++) {
      cur = cur[partes[i]];
      if (cur === undefined) return; // la ruta no existe en la plantilla, se ignora
    }
    cur[partes[partes.length - 1]] = valor;
  }

  function mostrarToast(mensaje) {
    const toast = document.getElementById('admin-toast');
    toast.textContent = mensaje;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function actualizarBadgeEstado() {
    const badge = document.getElementById('admin-status');
    if (localStorage.getItem(DRAFT_KEY)) {
      badge.textContent = 'Borrador sin publicar (solo en este navegador)';
      badge.classList.add('is-draft');
    } else {
      badge.textContent = 'Mostrando content.json publicado';
      badge.classList.remove('is-draft');
    }
  }

  function llenarFormulario() {
    document.querySelectorAll('[data-path]').forEach((input) => {
      const ruta = input.getAttribute('data-path');
      const valor = obtenerValor(state, ruta);
      if (valor !== undefined) input.value = valor;
      actualizarPreview(input);
    });
  }

  function actualizarPreview(input) {
    const previewId = input.getAttribute('data-preview');
    if (!previewId) return;
    const img = document.getElementById(previewId);
    if (img) img.src = input.value || '';
  }

  function leerFormularioHaciaState() {
    document.querySelectorAll('[data-path]').forEach((input) => {
      fijarValor(state, input.getAttribute('data-path'), input.value.trim());
    });
  }

  async function cargarEstadoInicial() {
    const borrador = localStorage.getItem(DRAFT_KEY);
    if (borrador) {
      try {
        state = JSON.parse(borrador);
        llenarFormulario();
        actualizarBadgeEstado();
        return;
      } catch (e) {
        localStorage.removeItem(DRAFT_KEY);
      }
    }
    const res = await fetch('./content.json', { cache: 'no-store' });
    state = await res.json();
    llenarFormulario();
    actualizarBadgeEstado();
  }

  function guardarBorrador(mensaje) {
    leerFormularioHaciaState();
    localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
    actualizarBadgeEstado();
    if (mensaje) mostrarToast(mensaje);
  }

  function previsualizar() {
    guardarBorrador('Borrador guardado. Abriendo vista previa…');
    window.open('./index.html', '_blank');
  }

  function descargarJSON() {
    leerFormularioHaciaState();
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'content.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    mostrarToast('content.json descargado. Reemplázalo en tu repositorio y sube (push) los cambios para publicarlos.');
  }

  async function restablecerOriginal() {
    if (!confirm('¿Descartar el borrador y volver a cargar el content.json publicado? Perderás los cambios no descargados.')) return;
    localStorage.removeItem(DRAFT_KEY);
    const res = await fetch('./content.json', { cache: 'no-store' });
    state = await res.json();
    llenarFormulario();
    actualizarBadgeEstado();
    mostrarToast('Contenido restablecido al último content.json publicado.');
  }

  document.addEventListener('DOMContentLoaded', () => {
    cargarEstadoInicial();

    document.querySelectorAll('[data-path]').forEach((input) => {
      input.addEventListener('input', () => actualizarPreview(input));
    });

    document.getElementById('btn-preview').addEventListener('click', previsualizar);
    document.getElementById('btn-download').addEventListener('click', descargarJSON);
    document.getElementById('btn-reset').addEventListener('click', restablecerOriginal);
    document.getElementById('btn-save-draft').addEventListener('click', () =>
      guardarBorrador('Borrador guardado en este navegador.')
    );
  });
})();
