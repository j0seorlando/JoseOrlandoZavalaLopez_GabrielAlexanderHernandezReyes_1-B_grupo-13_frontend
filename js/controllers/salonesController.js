import { salonesService } from "../services/salonesService.js";
import { showAlert, escapeHtml, formatMoney } from "./uiHelper.js";

const tbody = document.getElementById("salonesBody");
const buscarForm = document.getElementById("buscarForm");
const buscarInput = document.getElementById("buscarId");

function fila(s) {
    return `
        <tr>
            <th scope="row">${escapeHtml(s.idSalon)}</th>
            <td>${escapeHtml(s.nombreSalon)}</td>
            <td>${escapeHtml(s.capacidad)}</td>
            <td>${formatMoney(s.precioRenta)}</td>
            <td>${escapeHtml(s.ubicacion)}</td>
        </tr>`;
}

function renderTabla(lista) {
    tbody.innerHTML = lista.length
        ? lista.map(fila).join("")
        : `<tr><td colspan="5" class="text-center text-muted">No hay salones para mostrar.</td></tr>`;
}

async function cargarSalones() {
    const res = await salonesService.getAll();
    if (!res.ok) return showAlert("danger", res.message);
    renderTabla(Array.isArray(res.data) ? res.data : []);
}

buscarForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = buscarInput.value.trim();
    if (id === "") return cargarSalones();
    if (!/^\d+$/.test(id)) return showAlert("warning", "El ID debe ser un número entero.");

    const res = await salonesService.getById(id);
    if (!res.ok) {
        renderTabla([]);
        return showAlert("danger", res.message);
    }
    renderTabla(res.data ? [res.data] : []);
});

document.getElementById("btnTodos").addEventListener("click", () => {
    buscarInput.value = "";
    cargarSalones();
});

cargarSalones();
