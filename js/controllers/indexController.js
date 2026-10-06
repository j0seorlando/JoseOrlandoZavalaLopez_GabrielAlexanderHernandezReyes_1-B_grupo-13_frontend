// Controller del CRUD de Eventos (index.html)
import { eventosService } from "../services/eventosService.js";
import { clientesService } from "../services/clientesService.js";
import { salonesService } from "../services/salonesService.js";
import { ESTADOS_EVENTO } from "../config.js";
import { showAlert, escapeHtml, formatMoney } from "./uiHelper.js";

const tbody = document.getElementById("eventosBody");
const form = document.getElementById("eventoForm");
const modal = new bootstrap.Modal(document.getElementById("eventoModal"));
const modalTitle = document.getElementById("eventoModalLabel");
const selCliente = document.getElementById("idCliente");
const selSalon = document.getElementById("idSalon");
const capacidadHint = document.getElementById("capacidadHint");

let eventos = [];
let clientes = [];
let salones = [];

// ---------- Carga de datos ----------
async function cargarCatalogos() {
    const [rc, rs] = await Promise.all([clientesService.getAll(), salonesService.getAll()]);
    if (!rc.ok) showAlert("danger", rc.message);
    if (!rs.ok) showAlert("danger", rs.message);
    clientes = rc.ok && Array.isArray(rc.data) ? rc.data : [];
    salones = rs.ok && Array.isArray(rs.data) ? rs.data : [];

    selCliente.innerHTML = `<option value="">Seleccione un cliente</option>` + clientes
        .map((c) => `<option value="${escapeHtml(c.idCliente)}">${escapeHtml(c.nombre)} ${escapeHtml(c.apellido)}</option>`).join("");
    selSalon.innerHTML = `<option value="">Seleccione un salón</option>` + salones
        .map((s) => `<option value="${escapeHtml(s.idSalon)}">${escapeHtml(s.nombreSalon)}</option>`).join("");
}

async function cargarEventos() {
    const res = await eventosService.getAll();
    if (!res.ok) return showAlert("danger", res.message);
    eventos = Array.isArray(res.data) ? res.data : [];
    renderTabla();
}

// ---------- Render ----------
const nombreCliente = (e) => {
    if (e.nombreCliente) return e.nombreCliente;
    if (e.cliente?.nombre) return `${e.cliente.nombre} ${e.cliente.apellido ?? ""}`.trim();
    const c = clientes.find((x) => String(x.idCliente) === String(e.idCliente));
    return c ? `${c.nombre} ${c.apellido}` : "—";
};

const nombreSalon = (e) => {
    if (e.nombreSalon) return e.nombreSalon;
    if (e.salon?.nombreSalon) return e.salon.nombreSalon;
    const s = salones.find((x) => String(x.idSalon) === String(e.idSalon));
    return s ? s.nombreSalon : "—";
};

function renderTabla() {
    if (eventos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted">No hay eventos registrados.</td></tr>`;
        return;
    }
    tbody.innerHTML = eventos.map((e) => {
        const opciones = ESTADOS_EVENTO
            .map((st) => `<option value="${st}" ${st === e.estado ? "selected" : ""}>${st}</option>`).join("");
        // Si el estado actual no está en la lista (p. ej. CONFIRMADA), se muestra deshabilitado
        const extra = e.estado && !ESTADOS_EVENTO.includes(e.estado)
            ? `<option value="" selected disabled>${escapeHtml(e.estado)}</option>` : "";
        return `
        <tr>
            <th scope="row">${escapeHtml(e.idEvento)}</th>
            <td>${escapeHtml(nombreCliente(e))}</td>
            <td>${escapeHtml(nombreSalon(e))}</td>
            <td>${escapeHtml(e.nombreEvento)}</td>
            <td>${escapeHtml(String(e.fechaEvento ?? "").slice(0, 10))}</td>
            <td>${escapeHtml(e.cantidadPersonas)}</td>
            <td>${escapeHtml(e.cantidadHoras ?? "")}</td>
            <td>${formatMoney(e.totalPago)}</td>
            <td>
                <select class="form-select form-select-sm" data-action="estado" data-id="${escapeHtml(e.idEvento)}">${extra}${opciones}</select>
            </td>
            <td class="text-nowrap">
                <button class="btn btn-sm btn-outline-primary" data-action="editar" data-id="${escapeHtml(e.idEvento)}">Editar</button>
                <button class="btn btn-sm btn-outline-danger" data-action="eliminar" data-id="${escapeHtml(e.idEvento)}">Eliminar</button>
            </td>
        </tr>`;
    }).join("");
}

// ---------- Formulario ----------
function limpiarFormulario() {
    form.reset();
    document.getElementById("eventoId").value = "";
    capacidadHint.textContent = "";
    form.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));
}

function leerDto() {
    return {
        idCliente: Number(selCliente.value),
        idSalon: Number(selSalon.value),
        nombreEvento: document.getElementById("nombreEvento").value.trim(),
        fechaEvento: document.getElementById("fechaEvento").value, // yyyy-MM-dd
        cantidadPersonas: Number(document.getElementById("cantidadPersonas").value),
        cantidadHoras: Number(document.getElementById("cantidadHoras").value),
        // OJO: no se envía TOTAL_PAGO ni ESTADO inicial; los calcula el backend
    };
}

function validar(dto) {
    let valido = true;
    const marcar = (id, ok) => {
        document.getElementById(id).classList.toggle("is-invalid", !ok);
        if (!ok) valido = false;
    };
    marcar("idCliente", dto.idCliente > 0);
    marcar("idSalon", dto.idSalon > 0);
    marcar("nombreEvento", dto.nombreEvento !== "");
    marcar("fechaEvento", dto.fechaEvento !== "");
    marcar("cantidadPersonas", Number.isInteger(dto.cantidadPersonas) && dto.cantidadPersonas > 0);
    marcar("cantidadHoras", Number.isInteger(dto.cantidadHoras) && dto.cantidadHoras > 0);
    return valido;
}

selSalon.addEventListener("change", () => {
    const s = salones.find((x) => String(x.idSalon) === selSalon.value);
    capacidadHint.textContent = s ? `Capacidad máxima: ${s.capacidad} personas · Renta por hora: ${formatMoney(s.precioRenta)}` : "";
});

document.getElementById("btnNuevoEvento").addEventListener("click", () => {
    limpiarFormulario();
    modalTitle.textContent = "Nuevo evento";
    modal.show();
});

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = document.getElementById("eventoId").value;
    const dto = leerDto();

    if (!validar(dto)) {
        showAlert("warning", "Completa todos los campos con valores válidos.");
        return;
    }

    if (id) {
        const actual = eventos.find((e) => String(e.idEvento) === id);
        if (actual?.estado) dto.estado = actual.estado; // se conserva el estado al editar
    }

    const res = id ? await eventosService.update(id, dto) : await eventosService.create(dto);
    if (res.ok) {
        showAlert("success", res.message || (id ? "Evento actualizado." : "Evento registrado."));
        modal.hide();
        await cargarEventos();
    } else {
        // Ej.: "La cantidad de personas supera la capacidad del salón" o fecha ocupada
        showAlert("danger", res.message);
    }
});

// ---------- Acciones de la tabla ----------
tbody.addEventListener("click", async (event) => {
    const btn = event.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;

    if (btn.dataset.action === "editar") {
        const e = eventos.find((x) => String(x.idEvento) === id);
        if (!e) return;
        limpiarFormulario();
        document.getElementById("eventoId").value = e.idEvento;
        selCliente.value = e.idCliente ?? e.cliente?.idCliente ?? "";
        selSalon.value = e.idSalon ?? e.salon?.idSalon ?? "";
        selSalon.dispatchEvent(new Event("change"));
        document.getElementById("nombreEvento").value = e.nombreEvento ?? "";
        document.getElementById("fechaEvento").value = String(e.fechaEvento ?? "").slice(0, 10);
        document.getElementById("cantidadPersonas").value = e.cantidadPersonas ?? "";
        document.getElementById("cantidadHoras").value = e.cantidadHoras ?? "";
        modalTitle.textContent = "Editar evento";
        modal.show();
    }

    if (btn.dataset.action === "eliminar") {
        if (!confirm("¿Seguro que deseas eliminar este evento?")) return;
        const res = await eventosService.remove(id);
        showAlert(res.ok ? "success" : "danger", res.ok ? (res.message || "Evento eliminado.") : res.message);
        if (res.ok) await cargarEventos();
    }
});

tbody.addEventListener("change", async (event) => {
    const sel = event.target.closest("select[data-action='estado']");
    if (!sel) return;
    const res = await eventosService.cambiarEstado(sel.dataset.id, sel.value);
    showAlert(res.ok ? "success" : "danger", res.ok ? (res.message || "Estado actualizado.") : res.message);
    await cargarEventos(); // refresca (también revierte el select si hubo error)
});

// ---------- Inicio ----------
(async () => {
    await cargarCatalogos();
    await cargarEventos();
})();
