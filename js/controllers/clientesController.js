import { clientesService } from "../services/clientesService.js";
import { showAlert, escapeHtml, EMAIL_REGEX } from "./uiHelper.js";

const tbody = document.getElementById("clientesBody");
const form = document.getElementById("clienteForm");
const modalEl = document.getElementById("clienteModal");
const modal = new bootstrap.Modal(modalEl);
const modalTitle = document.getElementById("clienteModalLabel");

let clientes = [];

async function cargarClientes() {
    const res = await clientesService.getAll();
    if (!res.ok) {
        showAlert("danger", res.message);
        return;
    }
    clientes = Array.isArray(res.data) ? res.data : [];
    renderTabla();
}

function renderTabla() {
    if (clientes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No hay clientes registrados.</td></tr>`;
        return;
    }
    tbody.innerHTML = clientes.map((c) => `
        <tr>
            <th scope="row">${escapeHtml(c.idCliente)}</th>
            <td>${escapeHtml(c.nombre)}</td>
            <td>${escapeHtml(c.apellido)}</td>
            <td>${escapeHtml(c.telefono)}</td>
            <td>${escapeHtml(c.email)}</td>
            <td>${escapeHtml(c.direccion)}</td>
            <td class="text-nowrap">
                <button class="btn btn-sm btn-outline-primary" data-action="editar" data-id="${escapeHtml(c.idCliente)}">Editar</button>
                <button class="btn btn-sm btn-outline-danger" data-action="eliminar" data-id="${escapeHtml(c.idCliente)}">Eliminar</button>
            </td>
        </tr>`).join("");
}

function limpiarFormulario() {
    form.reset();
    form.classList.remove("was-validated");
    document.getElementById("clienteId").value = "";
    ["nombre", "apellido", "telefono", "email"].forEach((id) =>
        document.getElementById(id).classList.remove("is-invalid"));
}

function validar(dto) {
    let valido = true;
    const marcar = (id, ok) => {
        document.getElementById(id).classList.toggle("is-invalid", !ok);
        if (!ok) valido = false;
    };
    marcar("nombre", dto.nombre !== "");
    marcar("apellido", dto.apellido !== "");
    marcar("telefono", dto.telefono !== "");
    marcar("email", EMAIL_REGEX.test(dto.email));
    return valido;
}

document.getElementById("btnNuevoCliente").addEventListener("click", () => {
    limpiarFormulario();
    modalTitle.textContent = "Nuevo cliente";
    modal.show();
});

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = document.getElementById("clienteId").value;
    const dto = {
        nombre: document.getElementById("nombre").value.trim(),
        apellido: document.getElementById("apellido").value.trim(),
        telefono: document.getElementById("telefono").value.trim(),
        email: document.getElementById("email").value.trim(),
        direccion: document.getElementById("direccion").value.trim(),
    };

    if (!validar(dto)) {
        showAlert("warning", "Revisa los campos obligatorios y el formato del email.");
        return;
    }

    const res = id ? await clientesService.update(id, dto) : await clientesService.create(dto);
    if (res.ok) {
        showAlert("success", res.message || (id ? "Cliente actualizado." : "Cliente registrado."));
        modal.hide();
        await cargarClientes();
    } else {
        showAlert("danger", res.message); // incluye email duplicado u otras reglas del servidor
    }
});

tbody.addEventListener("click", async (event) => {
    const btn = event.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;

    if (btn.dataset.action === "editar") {
        const c = clientes.find((x) => String(x.idCliente) === id);
        if (!c) return;
        limpiarFormulario();
        document.getElementById("clienteId").value = c.idCliente;
        document.getElementById("nombre").value = c.nombre ?? "";
        document.getElementById("apellido").value = c.apellido ?? "";
        document.getElementById("telefono").value = c.telefono ?? "";
        document.getElementById("email").value = c.email ?? "";
        document.getElementById("direccion").value = c.direccion ?? "";
        modalTitle.textContent = "Editar cliente";
        modal.show();
    }

    if (btn.dataset.action === "eliminar") {
        if (!confirm("¿Seguro que deseas eliminar este cliente?")) return;
        const res = await clientesService.remove(id);
        if (res.ok) {
            showAlert("success", res.message || "Cliente eliminado.");
            await cargarClientes();
        } else {
            showAlert("danger", res.message); // p. ej. tiene eventos asociados (llave foránea)
        }
    }
});

cargarClientes();
