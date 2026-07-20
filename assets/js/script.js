document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     0. IMAGEN DEL HERO
     --------------------------------------------------------------------------
     Para cambiar la foto, reemplaza solo este link (sirve cualquier URL
     pública jpg/png/webp). No hay que tocar el HTML ni el CSS.
     ========================================================================== */
  const HERO_IMAGE_URL = 'https://plus.unsplash.com/premium_photo-1661688361733-a50696e91db6?q=80&w=901&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

  const heroImg = document.getElementById('hero-img');
  if (heroImg) {
    heroImg.src = HERO_IMAGE_URL;
    heroImg.addEventListener('error', () => { heroImg.style.display = 'none'; });
  }

  /* ==========================================================================
     UTILIDADES DE VALIDACIÓN
     --------------------------------------------------------------------------
     Funciones puras: reciben un valor y devuelven true/false (o el valor
     formateado). No tocan el DOM, así que se pueden reusar en cualquier
     formulario del sitio sin depender de un input en particular.
     ========================================================================== */

  // Deja solo dígitos y la 'K' (mayúscula) de un RUT.
  function limpiarRUT(rut) {
    return rut.replace(/[^0-9kK]/g, '').toUpperCase();
  }

  // Formatea mientras el usuario escribe: 123456789 -> 12.345.678-9
  function formatearRUT(rut) {
    const limpio = limpiarRUT(rut);
    if (limpio.length <= 1) return limpio;
    const cuerpo = limpio.slice(0, -1);
    const dv = limpio.slice(-1);
    const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${cuerpoFormateado}-${dv}`;
  }

  // Algoritmo del dígito verificador (módulo 11) para RUT chileno.
  function validarRUT(rut) {
    const limpio = limpiarRUT(rut);
    if (limpio.length < 2) return false;

    const cuerpo = limpio.slice(0, -1);
    const dvIngresado = limpio.slice(-1);

    let suma = 0;
    let multiplo = 2;

    // Recorremos el cuerpo de derecha a izquierda multiplicando cada
    // dígito por una secuencia 2,3,4,5,6,7,2,3,4...
    for (let i = cuerpo.length - 1; i >= 0; i--) {
      suma += parseInt(cuerpo[i], 10) * multiplo;
      multiplo = multiplo === 7 ? 2 : multiplo + 1;
    }

    const resto = 11 - (suma % 11);
    let dvEsperado;
    if (resto === 11) dvEsperado = '0';
    else if (resto === 10) dvEsperado = 'K';
    else dvEsperado = String(resto);

    return dvEsperado === dvIngresado;
  }

  function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validarTelefono(telefono) {
    const digitos = telefono.replace(/\D/g, '');
    return digitos.length >= 9;
  }

  /* ==========================================================================
     HELPERS DE ERROR POR CAMPO
     --------------------------------------------------------------------------
     Convención: cada <input id="X"> que se valida tiene, justo después,
     un <span class="field-error" id="error-X"></span> en el HTML.
     mostrarError() lo llena; limpiarErrorCampo() lo vacía.
     ========================================================================== */
  function mostrarError(inputEl, mensaje) {
    if (!inputEl) return;
    inputEl.classList.add('is-invalid');
    inputEl.setAttribute('aria-invalid', 'true');
    const errorEl = document.getElementById(`error-${inputEl.id}`);
    if (errorEl) errorEl.textContent = mensaje;
  }

  function limpiarErrorCampo(inputEl) {
    if (!inputEl) return;
    inputEl.classList.remove('is-invalid');
    inputEl.removeAttribute('aria-invalid');
    const errorEl = document.getElementById(`error-${inputEl.id}`);
    if (errorEl) errorEl.textContent = '';
  }

  function limpiarErroresForm(formEl) {
    formEl.querySelectorAll('.is-invalid').forEach(limpiarErrorCampo);
  }

  /* ==========================================================================
     1. MENÚ MÓVIL (hamburguesa)
     ========================================================================== */
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', isOpen);
    });

    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ==========================================================================
     2. RESALTAR EL LINK ACTIVO SEGÚN LA SECCIÓN VISIBLE
     ========================================================================== */
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.nav-menu a');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.remove('active');
          link.removeAttribute('aria-current');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
          }
        });
      }
    });
  }, { root: null, rootMargin: '-50% 0px -50% 0px', threshold: 0 });

  sections.forEach(section => sectionObserver.observe(section));

  /* ==========================================================================
     3. SCROLL SUAVE
     ========================================================================== */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const headerHeight = document.querySelector('.main-header').offsetHeight;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
      }
    });
  });

  /* ==========================================================================
     4. HEADER CON SOMBRA AL SCROLL
     ========================================================================== */
  const header = document.querySelector('.main-header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 10);
    });
  }

  /* ==========================================================================
     5. TABS DEL COTIZADOR (Hogar / Autos / Pymes)
     --------------------------------------------------------------------------
     Los campos que cambian según el ramo se describen como datos
     (camposPorRamo), no como un if/else repetido en el DOM.
     ========================================================================== */
  const quoteTabs = document.querySelectorAll('.quote-tab');
  const tipoViviendaGroup = document.getElementById('tipo-vivienda');
  const quoteResult = document.getElementById('quote-result');

  const camposPorRamo = {
    hogar: { label: 'Tipo de vivienda', opciones: ['Casa', 'Departamento', 'Oficina / local'] },
    autos: { label: 'Tipo de vehículo', opciones: ['Auto', 'Camioneta', 'Moto'] },
    pymes: { label: 'Tipo de negocio', opciones: ['Local comercial', 'Oficina', 'Bodega'] }
  };

  quoteTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      quoteTabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      const ramo = tab.dataset.ramo;
      const config = camposPorRamo[ramo];
      if (config && tipoViviendaGroup) {
        const labelEl = document.querySelector('label[for="tipo-vivienda"]');
        if (labelEl) labelEl.textContent = config.label;
        tipoViviendaGroup.innerHTML = config.opciones.map(op => `<option>${op}</option>`).join('');
      }

      // Si había un resultado de una cotización anterior, lo ocultamos:
      // cambiar de ramo invalida ese resultado.
      if (quoteResult) quoteResult.hidden = true;
    });
  });

  /* ==========================================================================
     6. FORMATEO EN VIVO DEL RUT (mientras el usuario escribe)
     ========================================================================== */
  const rutInput = document.getElementById('rut');
  if (rutInput) {
    rutInput.addEventListener('input', () => {
      const posicionCursor = rutInput.selectionStart;
      const largoAntes = rutInput.value.length;

      rutInput.value = formatearRUT(rutInput.value);

      // Reubicamos el cursor considerando los puntos/guión que se agregaron.
      const diferenciaLargo = rutInput.value.length - largoAntes;
      rutInput.setSelectionRange(posicionCursor + diferenciaLargo, posicionCursor + diferenciaLargo);

      limpiarErrorCampo(rutInput);
    });
  }

  /* ==========================================================================
     7. VALIDACIÓN Y ENVÍO — Formulario de cotización rápida (hero)
     ========================================================================== */
  const quoteForm = document.querySelector('.quote-form');
  if (quoteForm) {
    const comunaInput = document.getElementById('comuna');
    const correoInput = document.getElementById('correo-cotizacion');
    const submitBtn = quoteForm.querySelector('button[type="submit"]');
    const textoOriginalBtn = submitBtn.textContent;

    // Apenas el usuario vuelve a escribir en un campo con error, lo limpiamos.
    [comunaInput, correoInput].forEach(input => {
      input.addEventListener('input', () => limpiarErrorCampo(input));
    });

    quoteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (quoteResult) quoteResult.hidden = true;

      // --- Validación ---
      let esValido = true;

      if (!comunaInput.value.trim()) {
        mostrarError(comunaInput, 'Ingresa tu comuna.');
        esValido = false;
      }

      if (!correoInput.value.trim()) {
        mostrarError(correoInput, 'Ingresa tu correo.');
        esValido = false;
      } else if (!validarEmail(correoInput.value.trim())) {
        mostrarError(correoInput, 'Ingresa un correo válido.');
        esValido = false;
      }

      if (!esValido) return;

      // --- "Envío" (simulado) ---
      const ramoActivo = document.querySelector('.quote-tab.active')?.dataset.ramo || 'hogar';

      submitBtn.disabled = true;
      submitBtn.textContent = 'Calculando...';

      // Aquí iría la llamada real a tu backend, por ejemplo:
      // const res = await fetch('/api/cotizar', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     ramo: ramoActivo,
      //     tipoVivienda: tipoViviendaGroup.value,
      //     comuna: comunaInput.value.trim(),
      //     correo: correoInput.value.trim(),
      //   }),
      // });
      // const data = await res.json();
      await new Promise(resolve => setTimeout(resolve, 900));

      const primaBase = { hogar: 12000, autos: 25000, pymes: 40000 }[ramoActivo];
      const factorAleatorio = 0.85 + Math.random() * 0.5;
      const primaEstimada = Math.round((primaBase * factorAleatorio) / 100) * 100;
      const companiasComparadas = ramoActivo === 'pymes' ? 3 : 5;

      if (quoteResult) {
        quoteResult.innerHTML = `
          <strong>Prima estimada: $${primaEstimada.toLocaleString('es-CL')}/mes</strong>
          <p>Comparamos ${companiasComparadas} compañías para tu ${ramoActivo}. Un ejecutivo te contactará con el detalle.</p>
        `;
        quoteResult.hidden = false;
      }

      submitBtn.disabled = false;
      submitBtn.textContent = textoOriginalBtn;
      quoteForm.reset();
    });
  }

  /* ==========================================================================
     8. VALIDACIÓN Y ENVÍO — Formulario de inspección
     ========================================================================== */
  const inspectionForm = document.querySelector('.inspection-form');
  const inspectionSuccess = document.getElementById('inspection-success');

  if (inspectionForm) {
    const campos = {
      nombre: document.getElementById('nombre-completo'),
      rut: document.getElementById('rut'),
      correo: document.getElementById('correo-inspeccion'),
      telefono: document.getElementById('telefono'),
      direccion: document.getElementById('direccion'),
    };
    const submitBtn = inspectionForm.querySelector('button[type="submit"]');
    const textoOriginalBtn = submitBtn.textContent;

    Object.values(campos).forEach(input => {
      if (input) input.addEventListener('input', () => limpiarErrorCampo(input));
    });

    inspectionForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // --- Validación ---
      let esValido = true;

      if (!campos.nombre.value.trim()) {
        mostrarError(campos.nombre, 'Ingresa tu nombre completo.');
        esValido = false;
      }

      if (!campos.rut.value.trim()) {
        mostrarError(campos.rut, 'Ingresa tu RUT.');
        esValido = false;
      } else if (!validarRUT(campos.rut.value)) {
        mostrarError(campos.rut, 'El RUT ingresado no es válido.');
        esValido = false;
      }

      if (!campos.correo.value.trim()) {
        mostrarError(campos.correo, 'Ingresa tu correo.');
        esValido = false;
      } else if (!validarEmail(campos.correo.value.trim())) {
        mostrarError(campos.correo, 'Ingresa un correo válido.');
        esValido = false;
      }

      if (!campos.telefono.value.trim()) {
        mostrarError(campos.telefono, 'Ingresa tu teléfono.');
        esValido = false;
      } else if (!validarTelefono(campos.telefono.value)) {
        mostrarError(campos.telefono, 'Ingresa un teléfono válido (mín. 9 dígitos).');
        esValido = false;
      }

      if (!campos.direccion.value.trim()) {
        mostrarError(campos.direccion, 'Ingresa la dirección a inspeccionar.');
        esValido = false;
      }

      if (!esValido) return;

      // --- "Envío" (simulado) ---
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';

      // Aquí iría el fetch real a tu backend Node/Express, por ejemplo:
      // const datos = Object.fromEntries(new FormData(inspectionForm));
      // await fetch('/api/solicitudes-inspeccion', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(datos),
      // });
      await new Promise(resolve => setTimeout(resolve, 1000));

      submitBtn.disabled = false;
      submitBtn.textContent = textoOriginalBtn;

      inspectionForm.reset();
      limpiarErroresForm(inspectionForm);

      // Reemplazamos el formulario por el mensaje de éxito.
      inspectionForm.hidden = true;
      if (inspectionSuccess) inspectionSuccess.hidden = false;
    });
  }

  // Botón "Enviar otra solicitud" dentro del mensaje de éxito.
  const btnOtraSolicitud = document.getElementById('btn-otra-solicitud');
  if (btnOtraSolicitud && inspectionForm && inspectionSuccess) {
    btnOtraSolicitud.addEventListener('click', () => {
      inspectionSuccess.hidden = true;
      inspectionForm.hidden = false;
    });
  }

  /* ==========================================================================
     9. BOTONES "Cotizar Hogar / Autos / Pymes" (sección #cotizar)
     --------------------------------------------------------------------------
     Al hacer clic, activan la pestaña correspondiente del cotizador del
     hero (el listener de scroll suave ya se encarga de subir hasta ahí).
     ========================================================================== */
  document.querySelectorAll('.js-cotizar-ramo').forEach(btn => {
    btn.addEventListener('click', () => {
      const ramo = btn.dataset.ramo;
      const tab = document.querySelector(`.quote-tab[data-ramo="${ramo}"]`);
      if (tab) tab.click();
    });
  });

});
