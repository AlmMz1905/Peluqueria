const NUMERO_WHATSAPP = "5491122334455"; 
const LINK_SEÑA_MP = "https://mpago.la/tu-link"; 
const MONTO_SEÑA = "$10.000";

// Pegá acá la URL de tu Google Apps Script (la que termina en /exec)
const URL_GOOGLE_SCRIPT = "https://script.google.com/macros/s/AKfycbyKUfMVXBztsxrENVfHOKHqSv5YtUCFk2FvDA9wrw2N8rkhZy-ONov8rfPLlhBTHgcZ/exec"; 

const HORARIOS_TOTALES = [
  "10:00", "10:45", "11:30", "12:15", 
  "14:00", "14:45", "15:30", "16:15", "17:00", "17:45", "18:30"
];

let turnosOcupados = {};
let diaSeleccionado = null;
let esSabado = false;
let horaSeleccionada = null;

const diasContainer = document.getElementById("diasContainer");
const horariosContainer = document.getElementById("horariosContainer");
const avisoSabado = document.getElementById("avisoSabado");
const seccionTurnosActiva = document.getElementById("seccionTurnosActiva");
const btnReservar = document.getElementById("btnReservar");
const modal = document.getElementById("modalConfirmacion");
const linkMpBtn = document.getElementById("linkMercadoPago");
const btnWhatsapp = document.getElementById("btnWhatsapp");
const btnCerrarModal = document.getElementById("btnCerrarModal");
const resumenModal = document.getElementById("resumenModal");

// --- FUNCIÓN PARA MOSTRAR MENSAJES CON ESTILO PROPIO DE LA BARBERÍA ---
function mostrarToast(titulo, mensaje, esError = true) {
  const toast = document.getElementById("customToast");
  const toastTitle = document.getElementById("toastTitle");
  const toastMsg = document.getElementById("toastMessage");
  const toastIcon = document.getElementById("toastIcon");

  toastTitle.innerText = titulo;
  toastMsg.innerText = mensaje;

  if (esError) {
    toastIcon.className = "w-9 h-9 rounded-xl bg-red-950/80 border border-red-500/50 text-red-400 flex items-center justify-center text-lg flex-shrink-0";
    toastIcon.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i>`;
    toast.style.borderColor = "#ef4444";
  } else {
    toastIcon.className = "w-9 h-9 rounded-xl bg-[#c59b48]/20 border border-[#c59b48]/50 text-[#e8c87e] flex items-center justify-center text-lg flex-shrink-0";
    toastIcon.innerHTML = `<i class="fa-solid fa-check"></i>`;
    toast.style.borderColor = "#c59b48";
  }

  toast.classList.remove("hidden");
  
  // Ocultar solo a los 4 segundos
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 4000);
}

// Consultar turnos ocupados desde Google Sheets
async function obtenerTurnosOcupados() {
  if (!URL_GOOGLE_SCRIPT || URL_GOOGLE_SCRIPT.includes("TU_SCRIPT_ID")) return;
  try {
    const res = await fetch(URL_GOOGLE_SCRIPT);
    turnosOcupados = await res.json();
    if (diaSeleccionado && !esSabado) cargarHorarios(diaSeleccionado);
  } catch (err) {
    console.error("Error al leer turnos:", err);
  }
}

function cargarDias() {
  diasContainer.innerHTML = "";
  const hoy = new Date();
  const nombresDias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  for (let i = 0; i < 7; i++) {
    const fecha = new Date();
    fecha.setDate(hoy.getDate() + i);

    if (fecha.getDay() === 0) continue; // No abre domingos

    const diaNombre = nombresDias[fecha.getDay()];
    const diaNumero = fecha.getDate();
    const fechaISO = fecha.toISOString().split("T")[0];
    const esDiaSabado = (fecha.getDay() === 6);

    const boton = document.createElement("button");
    const esPrimero = !diaSeleccionado && i === 0;
    
    boton.className = `min-w-[65px] py-2.5 px-2 rounded-xl flex flex-col items-center slot-btn ${
      esPrimero ? "slot-btn-selected" : ""
    }`;
    boton.innerHTML = `
      <span class="text-[10px] tracking-wider uppercase font-bold">${diaNombre}</span>
      <span class="font-vintage text-base font-extrabold">${diaNumero}</span>
    `;

    boton.onclick = () => {
      document.querySelectorAll("#diasContainer button").forEach(b => {
        b.className = "min-w-[65px] py-2.5 px-2 rounded-xl flex flex-col items-center slot-btn";
      });
      boton.className = "min-w-[65px] py-2.5 px-2 rounded-xl flex flex-col items-center slot-btn slot-btn-selected";
      diaSeleccionado = fechaISO;
      procesarSeleccionDia(fechaISO, esDiaSabado);
    };

    diasContainer.appendChild(boton);

    if (!diaSeleccionado) {
      diaSeleccionado = fechaISO;
      esSabado = esDiaSabado;
    }
  }

  procesarSeleccionDia(diaSeleccionado, esSabado);
}

function procesarSeleccionDia(fecha, esDiaSabado) {
  esSabado = esDiaSabado;
  horaSeleccionada = null;

  if (esDiaSabado) {
    avisoSabado.classList.remove("hidden");
    seccionTurnosActiva.classList.add("hidden");
  } else {
    avisoSabado.classList.add("hidden");
    seccionTurnosActiva.classList.remove("hidden");
    cargarHorarios(fecha);
  }
}

function cargarHorarios(fecha) {
  horariosContainer.innerHTML = "";
  horaSeleccionada = null;

  const ocupados = turnosOcupados[fecha] || [];

  HORARIOS_TOTALES.forEach(hora => {
    const estaOcupado = ocupados.includes(hora);
    const boton = document.createElement("button");

    if (estaOcupado) {
      boton.disabled = true;
      boton.className = "py-2.5 px-2 rounded-xl text-xs font-semibold bg-[#051a1a] border border-zinc-800 text-zinc-500 flex items-center justify-between px-3 cursor-not-allowed opacity-40";
      boton.innerHTML = `
        <span class="line-through">${hora}</span>
        <i class="fa-solid fa-lock text-[10px]"></i>
      `;
    } else {
      boton.className = "py-2.5 px-3 rounded-xl text-xs font-semibold slot-btn flex items-center justify-between transition group";
      boton.innerHTML = `
        <span class="font-bold">${hora}</span>
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
      `;

      boton.onclick = () => {
        document.querySelectorAll("#horariosContainer button:not([disabled])").forEach(b => {
          b.className = "py-2.5 px-3 rounded-xl text-xs font-semibold slot-btn flex items-center justify-between transition group";
          const dot = b.querySelector(".rounded-full");
          if (dot) dot.className = "w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]";
        });

        boton.className = "py-2.5 px-3 rounded-xl text-xs font-bold slot-btn slot-btn-selected flex items-center justify-between";
        const selectedDot = boton.querySelector(".rounded-full");
        if (selectedDot) selectedDot.className = "w-2.5 h-2.5 rounded-full bg-[#041717]";

        horaSeleccionada = hora;
      };
    }

    horariosContainer.appendChild(boton);
  });
}

// PROCESO DE RESERVA + TEST DE BASE DE DATOS
btnReservar.onclick = async () => {
  const nombre = document.getElementById("nombreCliente").value.trim();
  const telefono = document.getElementById("telefonoCliente").value.trim();

  // VALIDACIONES CON ALERTA DE LA APP
  if (!diaSeleccionado || !horaSeleccionada) {
    mostrarToast("FALTA EL HORARIO", "Por favor seleccioná un horario disponible de la lista.");
    return;
  }
  if (!nombre) {
    mostrarToast("FALTA TU NOMBRE", "Por favor ingresá tu nombre y apellido para la reserva.");
    document.getElementById("nombreCliente").focus();
    return;
  }
  if (!telefono || telefono.length < 7) {
    mostrarToast("TELÉFONO INVÁLIDO", "Por favor ingresá un número de WhatsApp válido.");
    document.getElementById("telefonoCliente").focus();
    return;
  }

  // Feedback visual en el botón
  btnReservar.disabled = true;
  btnReservar.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><span>GUARDANDO EN AGENDA...</span>`;

  // --- ENVÍO DIRECTO A GOOGLE SHEETS (SIN PAGAR NADA) ---
  if (URL_GOOGLE_SCRIPT && !URL_GOOGLE_SCRIPT.includes("TU_SCRIPT_ID")) {
    try {
      await fetch(URL_GOOGLE_SCRIPT, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: diaSeleccionado,
          hora: horaSeleccionada,
          cliente: nombre,
          telefono: telefono
        })
      });
      console.log("Dato enviado exitosamente a Google Sheets.");
    } catch (err) {
      console.error("Error al impactar en Google Sheets:", err);
    }
  }

  btnReservar.disabled = false;
  btnReservar.innerHTML = `<span>CONTINUAR A LA SEÑA</span><i class="fa-solid fa-angle-right"></i>`;

  // Resumen del turno en el modal
  resumenModal.innerText = `Turno: ${diaSeleccionado} a las ${horaSeleccionada} hs para ${nombre}.`;
  linkMpBtn.href = LINK_SEÑA_MP;

  // Botón de WhatsApp preparado
  btnWhatsapp.onclick = () => {
    const texto = encodeURIComponent(
      `¡Hola! Quiero confirmar mi turno en Barbería MR:\n\n` +
      `👤 *Cliente:* ${nombre}\n` +
      `📅 *Fecha:* ${diaSeleccionado}\n` +
      `⏰ *Hora:* ${horaSeleccionada} hs\n` +
      `📱 *Contacto:* ${telefono}\n\n` +
      `Te adjunto el comprobante de la seña de ${MONTO_SEÑA}.`
    );
    window.open(`https://wa.me/${NUMERO_WHATSAPP}?text=${texto}`, "_blank");
  };

  modal.classList.remove("hidden");
};

btnCerrarModal.onclick = () => {
  modal.classList.add("hidden");
  obtenerTurnosOcupados(); // Refresca los turnos ocupados
};

// Menú mobile
const btnMenuMobile = document.getElementById("btnMenuMobile");
const menuMobile = document.getElementById("menuMobile");
if (btnMenuMobile && menuMobile) {
  btnMenuMobile.onclick = () => menuMobile.classList.toggle("hidden");
  document.querySelectorAll("#menuMobile a").forEach(l => l.onclick = () => menuMobile.classList.add("hidden"));
}

// Iniciar
cargarDias();
obtenerTurnosOcupados();