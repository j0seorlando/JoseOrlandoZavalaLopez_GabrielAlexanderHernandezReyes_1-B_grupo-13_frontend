// Cliente HTTP común. NO toca el DOM: solo fetch y normaliza la respuesta.
import { API_BASE_URL } from "../config.js";

export async function request(path, options = {}) {
    let response;
    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            ...options,
        });
    } catch (error) {
        return { ok: false, status: 0, message: "No se pudo conectar con el servidor.", data: null };
    }

    let body = null;
    try {
        body = await response.json();
    } catch (error) {
        body = null;
    }

    const data = body && typeof body === "object" && "data" in body ? body.data : body;
    let message =
        body?.message ?? body?.mensaje ?? body?.error ??
        (response.ok ? "Operación exitosa." : `Error ${response.status}`);

    // Si el backend manda errores por campo (validaciones), se agregan al mensaje
    if (!response.ok && data && typeof data === "object") {
        const detalles = Object.values(data).filter((v) => typeof v === "string");
        if (detalles.length) message += ": " + detalles.join(", ");
    }

    return { ok: response.ok, status: response.status, message, data };
}
