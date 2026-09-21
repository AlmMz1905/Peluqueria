const NUMERO_WHATSAPP = "5491122334455"; 
const LINK_SEÑA_MP = "https://mpago.la/tu-link"; 
const URL_GOOGLE_SCRIPT = ""; 

const HORARIOS_TOTALES = [
  "10:00", "10:45", "11:30", "12:15", 
  "14:00", "14:45", "15:30", "16:15", "17:00", "17:45", "18:30"
];

// Horarios de prueba tomados (luego vendrán de tu Google Sheets)
const turnosOcupados = {
  // Ejemplo: en la fecha de hoy bloqueamos dos turnos para ver el efecto
};

let diaSeleccionado = null;
let horaSeleccionada = null;

const diasContainer = document.getElementById("diasContainer");
const horariosContainer = document.getElementById("horariosContainer");
const btnReservar = document.getElementById("btnReservar");
const modal = document.getElementById("modalConfirmacion");
const linkMpBtn = document.getElementById("linkMercadoPago");
const btnWhatsapp = document.getElementById("btnWhatsapp");
const btnCerrarModal = document.getElementById("btnCerrarModal");
const resumenModal = document.getElementById("resumenModal");

// Generar días dinámicos basados en la fecha actual
function cargarDias() {
  diasContainer.innerHTML = "";
  const hoy = new Date();
  const nombresDias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  for (let i = 0; i < 7; i++) {
    const fecha = new Date();
    fecha.setDate(hoy.getDate() + i);

    if (fecha.getDay() === 0) continue; // Si cierran los domingos

    const diaNombre = nombresDias[fecha.getDay()];
    const diaNumero = fecha.getDate();
    const fechaISO = fecha.toISOString().split("T")[0];

    // Para probar: bloqueamos dos horarios en el día actual
    if (i === 0 && !turnosOcupados[fechaISO]) {
      turnosOcupados[fechaISO] = ["11:30", "16:15"];
    }

    const boton = document.createElement("button");
    const esPrimero = !diaSeleccionado && i === 0;
    
    boton.className = `min-w-[65px] py-2.5 px-2 rounded-xl flex flex-col items-center slot-btn ${
      esPrimero ? "slot-btn-selected" : ""
    }`;
    boton.innerHTML = `
      <span class="text-[10px] tracking-wider uppercase">${diaNombre}</span>
      <span class="font-vintage text-base font-bold">${diaNumero}</span>
    `;

    boton.onclick = () => {
      document.querySelectorAll("#diasContainer button").forEach(b => {
        b.className = "min-w-[65px] py-2.5 px-2 rounded-xl flex flex-col items-center slot-btn";
      });
      boton.className = "min-w-[65px] py-2.5 px-2 rounded-xl flex flex-col items-center slot-btn slot-btn-selected";
      diaSeleccionado = fechaISO;
      cargarHorarios(fechaISO);
    };

    diasContainer.appendChild(boton);

    if (!diaSeleccionado) diaSeleccionado = fechaISO;
  }

  cargarHorarios(diaSeleccionado);
}

// Cargar horarios mostrando puntito verde si está libre o candado si está ocupado
function cargarHorarios(fecha) {
  horariosContainer.innerHTML = "";
  horaSeleccionada = null;

  const ocupados = turnosOcupados[fecha] || [];

  HORARIOS_TOTALES.forEach(hora => {
    const estaOcupado = ocupados.includes(hora);
    const boton = document.createElement("button");

    if (estaOcupado) {
      boton.disabled = true;
      boton.className = "py-2.5 px-2 rounded-xl text-xs font-semibold bg-[#031515] border border-zinc-800/80 text-zinc-600 flex items-center justify-between px-3 cursor-not-allowed opacity-40";
      boton.innerHTML = `
        <span class="line-through">${hora}</span>
        <i class="fa-solid fa-lock text-[10px] text-zinc-500"></i>
      `;
    } else {
      boton.className = "py-2.5 px-3 rounded-xl text-xs font-semibold slot-btn flex items-center justify-between transition group";
      boton.innerHTML = `
        <span class="font-medium">${hora}</span>
        <span class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] group-hover:scale-125 transition-transform"></span>
      `;

      boton.onclick = () => {
        document.querySelectorAll("#horariosContainer button:not([disabled])").forEach(b => {
          b.className = "py-2.5 px-3 rounded-xl text-xs font-semibold slot-btn flex items-center justify-between transition group";
          const dot = b.querySelector(".rounded-full");
          if (dot) dot.className = "w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]";
        });

        boton.className = "py-2.5 px-3 rounded-xl text-xs font-bold slot-btn slot-btn-selected flex items-center justify-between";
        const selectedDot = boton.querySelector(".rounded-full");
        if (selectedDot) selectedDot.className = "w-2 h-2 rounded-full bg-[#031414]";

        horaSeleccionada = hora;
      };
    }

    horariosContainer.appendChild(boton);
  });
}

// Validación y apertura de confirmación
btnReservar.onclick = () => {
  const nombre = document.getElementById("nombreCliente").value.trim();
  const telefono = document.getElementById("telefonoCliente").value.trim();

  if (!diaSeleccionado || !horaSeleccionada) {
    alert("Por favor seleccioná un día y un horario disponible.");
    return;
  }
  if (!nombre || !telefono) {
    alert("Por favor completá tu nombre y número de WhatsApp.");
    return;
  }

  resumenModal.innerText = `Turno: ${diaSeleccionado} a las ${horaSeleccionada} hs para ${nombre}.`;
  linkMpBtn.href = LINK_SEÑA_MP;

  btnWhatsapp.onclick = () => {
    const texto = encodeURIComponent(
      `¡Hola! Acabo de transferir la seña para mi turno en Barbería MR:\n\n` +
      `👤 *Cliente:* ${nombre}\n` +
      `📅 *Fecha:* ${diaSeleccionado}\n` +
      `⏰ *Hora:* ${horaSeleccionada} hs\n` +
      `📱 *Contacto:* ${telefono}\n\n` +
      `Te adjunto el comprobante de la seña de $3.000.`
    );
    window.open(`https://wa.me/${NUMERO_WHATSAPP}?text=${texto}`, "_blank");
  };

  modal.classList.remove("hidden");
};

btnCerrarModal.onclick = () => modal.classList.add("hidden");

// Toggle menú mobile
const btnMenuMobile = document.getElementById("btnMenuMobile");
const menuMobile = document.getElementById("menuMobile");
if (btnMenuMobile && menuMobile) {
  btnMenuMobile.onclick = () => menuMobile.classList.toggle("hidden");
  document.querySelectorAll("#menuMobile a").forEach(l => l.onclick = () => menuMobile.classList.add("hidden"));
}

cargarDias();