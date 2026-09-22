const NUMERO_WHATSAPP = "5491122334455"; 
const LINK_SEÑA_MP = "https://mpago.la/tu-link"; 
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

// Consultar turnos desde Google Sheets
async function obtenerTurnosOcupados() {
  if (!URL_GOOGLE_SCRIPT) return;
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

// Decide si muestra horarios o el cartel de orden de llegada
function procesarSeleccionDia(fecha, esDiaSabado) {
  esSabado = esDiaSabado;
  horaSeleccionada = null;

  if (esDiaSabado) {
    // Es sábado: ocultar horarios y mostrar aviso
    avisoSabado.classList.remove("hidden");
    seccionTurnosActiva.classList.add("hidden");
  } else {
    // Día de semana regular: mostrar turnos
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

// Proceso de reserva
btnReservar.onclick = async () => {
  const nombre = document.getElementById("nombreCliente").value.trim();
  const telefono = document.getElementById("telefonoCliente").value.trim();

  if (!diaSeleccionado || !horaSeleccionada) {
    alert("Por favor seleccioná un horario disponible.");
    return;
  }
  if (!nombre || !telefono) {
    alert("Por favor completá tu nombre y número de WhatsApp.");
    return;
  }

  btnReservar.disabled = true;
  btnReservar.innerText = "PROCESANDO RESERVA...";

  if (URL_GOOGLE_SCRIPT) {
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
    } catch (err) {
      console.error("Error al guardar en Sheets:", err);
    }
  }

  btnReservar.disabled = false;
  btnReservar.innerHTML = `<span>CONTINUAR A LA SEÑA</span><i class="fa-solid fa-angle-right"></i>`;

  resumenModal.innerText = `Turno: ${diaSeleccionado} a las ${horaSeleccionada} hs para ${nombre}.`;
  linkMpBtn.href = LINK_SEÑA_MP;

  btnWhatsapp.onclick = () => {
    const texto = encodeURIComponent(
      `¡Hola! Acabo de transferir la seña para mi turno en Barbería MR:\n\n` +
      `👤 *Cliente:* ${nombre}\n` +
      `📅 *Fecha:* ${diaSeleccionado}\n` +
      `⏰ *Hora:* ${horaSeleccionada} hs\n` +
      `📱 *Contacto:* ${telefono}\n\n` +
      `Te adjunto acá el comprobante de la seña de $3.000.`
    );
    window.open(`https://wa.me/${NUMERO_WHATSAPP}?text=${texto}`, "_blank");
  };

  modal.classList.remove("hidden");
};

btnCerrarModal.onclick = () => {
  modal.classList.add("hidden");
  obtenerTurnosOcupados();
};

// Menú mobile
const btnMenuMobile = document.getElementById("btnMenuMobile");
const menuMobile = document.getElementById("menuMobile");
if (btnMenuMobile && menuMobile) {
  btnMenuMobile.onclick = () => menuMobile.classList.toggle("hidden");
  document.querySelectorAll("#menuMobile a").forEach(l => l.onclick = () => menuMobile.classList.add("hidden"));
}

cargarDias();
obtenerTurnosOcupados();