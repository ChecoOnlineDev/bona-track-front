import { io } from "socket.io-client";

// Asegúrate de que esta URL apunte a tu backend.
// Si corres el backend en otra máquina de tu red, usa su IP local.
const URL = "http://localhost:3000";

export const socket = io(URL);
