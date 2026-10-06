import { request } from "./apiClient.js";

const RUTA = "/clientes";

export const clientesService = {
    getAll: async () => await request(RUTA),
    getById: async (id) => await request(`${RUTA}/${id}`),
    create: async (dto) => await request(RUTA, { method: "POST", body: JSON.stringify(dto) }),
    update: async (id, dto) => await request(`${RUTA}/${id}`, { method: "PUT", body: JSON.stringify(dto) }),
    remove: async (id) => await request(`${RUTA}/${id}`, { method: "DELETE" }),
};
