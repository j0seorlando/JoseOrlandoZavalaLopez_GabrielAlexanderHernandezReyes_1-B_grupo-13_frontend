import { request } from "./apiClient.js";

const RUTA = "/eventos";

export const eventosService = {
    getAll: async () => await request(RUTA),
    getById: async (id) => await request(`${RUTA}/${id}`),
    create: async (dto) => await request(RUTA, { method: "POST", body: JSON.stringify(dto) }),
    update: async (id, dto) => await request(`${RUTA}/${id}`, { method: "PUT", body: JSON.stringify(dto) }),
    remove: async (id) => await request(`${RUTA}/${id}`, { method: "DELETE" }),
};

// Cambio de estado (PENDIENTE, CONFIRMADO, CANCELADO, FINALIZADO).
// Si tu compañero usa otra ruta, solo se cambia aquí.
eventosService.cambiarEstado = async (id, estado) =>
    await request(`/eventos/${id}/estado`, { method: "PUT", body: JSON.stringify({ estado }) });
