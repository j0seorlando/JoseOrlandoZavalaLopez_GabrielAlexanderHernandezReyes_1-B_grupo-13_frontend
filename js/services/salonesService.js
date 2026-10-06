import { request } from "./apiClient.js";

const RUTA = "/salones";

// Los salones se registran directo en la BD: solo se consulta.
export const salonesService = {
    getAll: async () => await request(RUTA),
    getById: async (id) => await request(`${RUTA}/${id}`),
};
