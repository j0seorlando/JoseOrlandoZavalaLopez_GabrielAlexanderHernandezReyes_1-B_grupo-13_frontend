// Utilidades de interfaz compartidas por los controllers (aquí sí se toca el DOM).
export function showAlert(type, message, containerId = "alertContainer") {
    const container = document.getElementById(containerId);
    if (!container) return;
    const wrapper = document.createElement("div");
    wrapper.className = `alert alert-${type} alert-dismissible fade show`;
    wrapper.setAttribute("role", "alert");
    wrapper.innerHTML = `<span></span><button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>`;
    wrapper.querySelector("span").textContent = message;
    container.appendChild(wrapper);
    setTimeout(() => wrapper.remove(), 6000);
}

export function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function formatMoney(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n.toLocaleString("es-SV", { style: "currency", currency: "USD" }) : "—";
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
