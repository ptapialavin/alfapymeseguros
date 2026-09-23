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

  let scrollYAlAbrirMenu = 0;

  function abrirMenuMovil() {
    scrollYAlAbrirMenu = window.scrollY;
    navMenu.classList.add('open');
    menuToggle.setAttribute('aria-expanded', 'true');
    // Bloquea el scroll del body en su posición actual para evitar el
    // desplazamiento/salto entre el contenido del index y el menú hamburguesa
    document.body.classList.add('menu-open');
    document.body.style.top = `-${scrollYAlAbrirMenu}px`;
  }

  function cerrarMenuMovil() {
    navMenu.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    document.body.style.top = '';
    window.scrollTo(0, scrollYAlAbrirMenu);
  }

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.contains('open');
      if (isOpen) {
        cerrarMenuMovil();
      } else {
        abrirMenuMovil();
      }
    });

    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        cerrarMenuMovil();
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
      if (targetId.length < 2) return; // href="#" solo: no hay destino
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        if (target.tagName === 'DETAILS') target.open = true;
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
     5. ENVÍO DE SOLICITUDES
     --------------------------------------------------------------------------
     Este sitio es estático (sin backend), así que por defecto la solicitud se
     envía preparando un correo (mailto:) hacia el correo de contacto del sitio
     (el mismo que aparece en el footer / content.json -> site.email).

     Si más adelante se conecta un servicio de formularios (Formspree, Getform,
     un endpoint propio, etc.), basta con poner su URL en FORM_ENDPOINT: las
     solicitudes se enviarán por POST (JSON) y el mailto deja de usarse.
     ========================================================================== */
  const FORM_ENDPOINT = '';

  function correoDeContacto() {
    const link = document.querySelector('.js-email-link');
    const href = link ? link.getAttribute('href') || '' : '';
    return href.replace(/^mailto:/i, '') || 'alfapymes@gmail.com';
  }

  // datos: array de [etiqueta, valor]. Devuelve 'endpoint' o 'mailto'.
  async function enviarSolicitud(asunto, datos) {
    if (FORM_ENDPOINT) {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ asunto, ...Object.fromEntries(datos) }),
      });
      if (!res.ok) throw new Error('No se pudo enviar la solicitud');
      return 'endpoint';
    }
    const cuerpo = datos.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n');
    window.location.href =
      `mailto:${correoDeContacto()}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
    return 'mailto';
  }

  const TEXTO_EXITO = {
    endpoint: 'Recibimos tu solicitud. Un ejecutivo de Alfapymes se pondrá en contacto contigo.',
    mailto: 'Se abrió tu programa de correo con los datos completados: solo presiona "Enviar". Si no se abrió, escríbenos a ' + '%CORREO%' + ' o por WhatsApp.',
  };
  const textoExito = (modo) => TEXTO_EXITO[modo].replace('%CORREO%', correoDeContacto());

  /* ==========================================================================
     6. VALIDACIÓN GENÉRICA DE FORMULARIOS
     --------------------------------------------------------------------------
     Recorre los campos del <form> y valida según sus atributos:
       required            -> no vacío
       type="email" / "tel"-> formato
       data-validar="rut"  -> RUT chileno con dígito verificador
     Convención: el error va en <span id="error-<id del campo>">.
     ========================================================================== */
  function validarFormulario(formEl) {
    let primerError = null;
    formEl.querySelectorAll('input, select, textarea').forEach(campo => {
      if (campo.type === 'checkbox') return;
      const valor = campo.value.trim();
      let mensaje = '';

      if (campo.required && !valor) {
        mensaje = 'Este campo es obligatorio.';
      } else if (valor) {
        if (campo.dataset.validar === 'rut' && !validarRUT(valor)) mensaje = 'El RUT ingresado no es válido.';
        else if (campo.type === 'email' && !validarEmail(valor)) mensaje = 'Ingresa un correo válido.';
        else if (campo.type === 'tel' && !validarTelefono(valor)) mensaje = 'Ingresa un teléfono válido (mín. 9 dígitos).';
      }

      if (mensaje) {
        mostrarError(campo, mensaje);
        if (!primerError) primerError = campo;
      } else {
        limpiarErrorCampo(campo);
      }
    });
    if (primerError) primerError.focus();
    return !primerError;
  }

  // Limpia el error de un campo apenas el usuario vuelve a escribir en él.
  document.addEventListener('input', (e) => {
    const campo = e.target;
    if (campo.matches && campo.matches('input, select, textarea')) limpiarErrorCampo(campo);
  });
  document.addEventListener('change', (e) => {
    if (e.target.matches && e.target.matches('select')) limpiarErrorCampo(e.target);
  });

  // Formateo en vivo del RUT en cualquier campo con data-validar="rut"
  document.addEventListener('input', (e) => {
    const campo = e.target;
    if (campo.matches && campo.matches('input[data-validar="rut"]')) {
      campo.value = formatearRUT(campo.value);
    }
  });

  /* ==========================================================================
     7. FORMULARIOS DE COTIZACIÓN Y CONTACTO (modal)
     --------------------------------------------------------------------------
     Cada formulario se describe como datos: para agregar, quitar o cambiar un
     campo solo hay que editar FORMULARIOS (no hay HTML repetido).
       tipo: text (por defecto) | email | tel | number | select | checks | textarea
       obligatorio: true/false
       validar: 'rut'      -> valida RUT chileno
       ancho: 'completo'   -> ocupa las dos columnas
     ========================================================================== */
  const datosPersonales = [
    { id: 'nombre', etiqueta: 'Nombre completo', obligatorio: true, placeholder: 'Tu nombre' },
    { id: 'rut', etiqueta: 'RUT del contratante', obligatorio: true, validar: 'rut', placeholder: '12.345.678-9' },
    { id: 'telefono', etiqueta: 'Teléfono', tipo: 'tel', obligatorio: true, placeholder: '+56 9 ....' },
    { id: 'correo', etiqueta: 'Correo electrónico', tipo: 'email', obligatorio: true, placeholder: 'tucorreo@ejemplo.cl' },
  ];
  const comentarios = { id: 'comentarios', etiqueta: 'Comentarios (opcional)', tipo: 'textarea', ancho: 'completo', placeholder: 'Cuéntanos algo más que debamos saber' };

  const FORMULARIOS = {
    hogar: {
      titulo: 'Cotizar seguro de Hogar',
      bajada: 'Completa tus datos y te mostramos opciones de varias compañías.',
      asunto: 'Cotización Hogar',
      campos: [
        ...datosPersonales,
        { id: 'tipo-vivienda', etiqueta: 'Tipo de vivienda', tipo: 'select', obligatorio: true, opciones: ['Casa', 'Departamento'] },
        { id: 'comuna', etiqueta: 'Comuna', obligatorio: true },
        { id: 'direccion', etiqueta: 'Dirección de la propiedad', obligatorio: true, ancho: 'completo', placeholder: 'Calle, número, depto.' },
        { id: 'metros', etiqueta: 'Metros cuadrados construidos', tipo: 'number', placeholder: 'Ej: 80' },
        { id: 'anio', etiqueta: 'Año de construcción', tipo: 'number', placeholder: 'Ej: 2005' },
        { id: 'cobertura', etiqueta: '¿Qué quieres asegurar?', tipo: 'checks', ancho: 'completo', opciones: ['Incendio y sismo', 'Robo', 'Contenido', 'Responsabilidad civil'] },
        comentarios,
      ],
    },
    autos: {
      titulo: 'Cotizar seguro de Autos',
      bajada: 'Completa tus datos y te mostramos opciones de varias compañías.',
      asunto: 'Cotización Autos',
      campos: [
        ...datosPersonales,
        { id: 'patente', etiqueta: 'Patente', obligatorio: true, placeholder: 'Ej: ABCD12' },
        { id: 'tipo-vehiculo', etiqueta: 'Tipo de vehículo', tipo: 'select', obligatorio: true, opciones: ['Auto', 'Camioneta', 'SUV', 'Furgón', 'Moto'] },
        { id: 'marca', etiqueta: 'Marca', obligatorio: true },
        { id: 'modelo', etiqueta: 'Modelo', obligatorio: true },
        { id: 'anio', etiqueta: 'Año del vehículo', tipo: 'number', obligatorio: true, placeholder: 'Ej: 2020' },
        { id: 'uso', etiqueta: 'Uso', tipo: 'select', obligatorio: true, opciones: ['Particular', 'Comercial / trabajo', 'Aplicaciones de transporte'] },
        { id: 'cobertura', etiqueta: 'Cobertura que buscas', tipo: 'select', ancho: 'completo', opciones: ['Todo riesgo', 'Daños a terceros', 'No estoy seguro, necesito asesoría'] },
        comentarios,
      ],
    },
    pymes: {
      titulo: 'Cotizar seguro para Pymes',
      bajada: 'Cuéntanos de tu negocio y te mostramos opciones de varias compañías.',
      asunto: 'Cotización Pymes',
      campos: [
        ...datosPersonales,
        { id: 'negocio', etiqueta: 'Nombre o razón social del negocio', obligatorio: true },
        { id: 'giro', etiqueta: 'Giro del negocio', obligatorio: true, placeholder: 'Ej: Comercio, restaurante, taller' },
        { id: 'direccion', etiqueta: 'Dirección del local', obligatorio: true, ancho: 'completo', placeholder: 'Calle, número, local' },
        { id: 'comuna', etiqueta: 'Comuna', obligatorio: true },
        { id: 'metros', etiqueta: 'Metros cuadrados del local', tipo: 'number', placeholder: 'Ej: 60' },
        { id: 'cobertura', etiqueta: '¿Qué quieres asegurar?', tipo: 'checks', ancho: 'completo', opciones: ['Incendio y sismo', 'Robo', 'Equipos y maquinaria', 'Responsabilidad civil', 'Continuidad operativa'] },
        comentarios,
      ],
    },
    contacto: {
      titulo: 'Formulario de contacto',
      bajada: 'Escríbenos y te respondemos a la brevedad.',
      asunto: 'Contacto desde el sitio web',
      campos: [
        { id: 'nombre', etiqueta: 'Nombre completo', obligatorio: true, placeholder: 'Tu nombre' },
        { id: 'telefono', etiqueta: 'Teléfono', tipo: 'tel', obligatorio: true, placeholder: '+56 9 ....' },
        { id: 'correo', etiqueta: 'Correo electrónico', tipo: 'email', obligatorio: true, ancho: 'completo', placeholder: 'tucorreo@ejemplo.cl' },
        { id: 'mensaje', etiqueta: 'Mensaje', tipo: 'textarea', obligatorio: true, ancho: 'completo', placeholder: '¿En qué podemos ayudarte?' },
      ],
    },
  };

  const modal = document.getElementById('form-modal');
  const modalForm = document.getElementById('modal-form');
  const modalCampos = document.getElementById('modal-form-fields');
  const modalExito = document.getElementById('modal-form-success');
  const modalSubmit = document.getElementById('modal-form-submit');
  let formularioActivo = null;

  function crearCampo(c) {
    const id = `mf-${c.id}`;
    const grupo = document.createElement('div');
    grupo.className = 'form-group' + (c.ancho === 'completo' ? ' form-group-full' : '');

    if (c.tipo === 'checks') {
      const fs = document.createElement('fieldset');
      fs.className = 'check-group';
      const lg = document.createElement('legend');
      lg.textContent = c.etiqueta;
      fs.appendChild(lg);
      c.opciones.forEach((op, i) => {
        const lb = document.createElement('label');
        lb.className = 'check-item';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.name = c.id;
        cb.value = op;
        cb.id = `${id}-${i}`;
        lb.append(cb, document.createTextNode(' ' + op));
        fs.appendChild(lb);
      });
      grupo.appendChild(fs);
      return grupo;
    }

    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = c.etiqueta;

    let input;
    if (c.tipo === 'select') {
      input = document.createElement('select');
      const vacio = document.createElement('option');
      vacio.value = '';
      vacio.textContent = 'Selecciona…';
      input.appendChild(vacio);
      c.opciones.forEach(op => {
        const o = document.createElement('option');
        o.value = op;
        o.textContent = op;
        input.appendChild(o);
      });
    } else if (c.tipo === 'textarea') {
      input = document.createElement('textarea');
      input.rows = 3;
    } else {
      input = document.createElement('input');
      input.type = c.tipo || 'text';
      if (c.tipo === 'number') { input.min = '0'; input.inputMode = 'numeric'; }
      if (c.tipo === 'tel') input.inputMode = 'tel';
    }
    input.id = id;
    input.name = c.id;
    if (c.placeholder) input.placeholder = c.placeholder;
    if (c.obligatorio) input.required = true;
    if (c.validar) input.dataset.validar = c.validar;

    const error = document.createElement('span');
    error.className = 'field-error';
    error.id = `error-${id}`;
    error.setAttribute('aria-live', 'polite');

    grupo.append(label, input, error);
    return grupo;
  }

  function abrirFormulario(clave) {
    const config = FORMULARIOS[clave];
    if (!config || !modal || typeof modal.showModal !== 'function') return;
    formularioActivo = config;

    document.getElementById('form-modal-title').textContent = config.titulo;
    document.getElementById('form-modal-lead').textContent = config.bajada;
    modalCampos.replaceChildren(...config.campos.map(crearCampo));
    modalForm.hidden = false;
    modalExito.hidden = true;
    modalSubmit.disabled = false;
    modalSubmit.textContent = 'Enviar solicitud';

    document.body.classList.add('modal-open');
    modal.showModal();
  }

  function cerrarFormulario() {
    if (modal && modal.open) modal.close();
  }

  if (modal) {
    modal.addEventListener('close', () => document.body.classList.remove('modal-open'));
    // Clic en el fondo oscuro (fuera de la tarjeta) cierra el modal.
    modal.addEventListener('click', (e) => { if (e.target === modal) cerrarFormulario(); });
    document.getElementById('form-modal-close').addEventListener('click', cerrarFormulario);
    document.getElementById('modal-form-done').addEventListener('click', cerrarFormulario);

    modalForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!formularioActivo || !validarFormulario(modalForm)) return;

      const datos = formularioActivo.campos.map(c => {
        let valor;
        if (c.tipo === 'checks') {
          valor = [...modalForm.querySelectorAll(`input[name="${c.id}"]:checked`)].map(cb => cb.value).join(', ');
        } else {
          valor = modalForm.elements[c.id].value.trim();
        }
        return [c.etiqueta, valor];
      });

      modalSubmit.disabled = true;
      modalSubmit.textContent = 'Enviando...';
      try {
        const modo = await enviarSolicitud(formularioActivo.asunto, datos);
        document.getElementById('modal-form-success-text').textContent = textoExito(modo);
        modalForm.hidden = true;
        modalExito.hidden = false;
      } catch (err) {
        modalSubmit.disabled = false;
        modalSubmit.textContent = 'Enviar solicitud';
        alert('No pudimos enviar tu solicitud. Inténtalo de nuevo o escríbenos por WhatsApp.');
      }
    });
  }

  // Cualquier elemento con data-form="hogar|autos|pymes|contacto" abre su formulario.
  document.querySelectorAll('[data-form]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      abrirFormulario(el.dataset.form);
    });
  });

  /* ==========================================================================
     8. FORMULARIO DE INSPECCIÓN (sección #inspeccion)
     ========================================================================== */
  const inspectionForm = document.querySelector('.inspection-form');
  const inspectionSuccess = document.getElementById('inspection-success');

  if (inspectionForm) {
    const submitBtn = inspectionForm.querySelector('button[type="submit"]');
    const textoOriginalBtn = submitBtn.textContent;

    inspectionForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validarFormulario(inspectionForm)) return;

      const datos = [...inspectionForm.querySelectorAll('input')].map(input => [
        inspectionForm.querySelector(`label[for="${input.id}"]`).textContent.trim(),
        input.value.trim(),
      ]);

      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';
      try {
        const modo = await enviarSolicitud('Solicitud de inspección de vehículo', datos);
        const texto = document.getElementById('inspection-success-text');
        if (texto) texto.textContent = modo === 'mailto'
          ? textoExito('mailto')
          : 'Un ejecutivo se pondrá en contacto para agendar la visita técnica.';
        inspectionForm.reset();
        inspectionForm.hidden = true;
        if (inspectionSuccess) inspectionSuccess.hidden = false;
      } catch (err) {
        alert('No pudimos enviar tu solicitud. Inténtalo de nuevo o escríbenos por WhatsApp.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = textoOriginalBtn;
      }
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
     9. ABRIR PREGUNTA FRECUENTE AL LLEGAR A ELLA (p. ej. desde la tarjeta GPS)
     ========================================================================== */
  function abrirDetallesDeHash() {
    const id = window.location.hash.slice(1);
    const el = id && document.getElementById(id);
    if (el && el.tagName === 'DETAILS') el.open = true;
  }
  window.addEventListener('hashchange', abrirDetallesDeHash);
  abrirDetallesDeHash();

});
