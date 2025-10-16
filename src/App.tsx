import { useEffect, useState } from "react";
import { socket } from "./services/socket";

// Definimos un "tipo" para los datos de las peticiones.
// Esto nos ayuda a evitar errores y nos da autocompletado.
interface Request {
  id: number;
  tableId: number;
  type: string;
  status: string;
  notes?: string;
  waiterId?: number;
}

function App() {
  const [requests, setRequests] = useState<Request[]>([]);
  const WAITER_ID = 1; // Simulamos que somos el mesero con ID 1

  useEffect(() => {
    // Función para obtener la lista inicial de peticiones al cargar.
    async function fetchInitialRequests() {
      try {
        const response = await fetch("http://localhost:3000/requests");
        const data = await response.json();
        setRequests(data);
      } catch (error) {
        console.error("Falló al obtener las peticiones iniciales:", error);
      }
    }

    fetchInitialRequests();

    // Escuchar por nuevas peticiones.
    socket.on("new_request", (newRequest: Request) => {
      // Añade la nueva petición al principio de la lista.
      setRequests((currentRequests) => [newRequest, ...currentRequests]);
    });

    // Escuchar por actualizaciones de peticiones.
    socket.on("request_update", (updatedRequest: Request) => {
      // Busca la petición actualizada en la lista y la reemplaza.
      setRequests((currentRequests) =>
        currentRequests.map((req) =>
          req.id === updatedRequest.id ? updatedRequest : req
        )
      );
    });

    // Es una buena práctica limpiar los "listeners" cuando el componente se destruye.
    return () => {
      socket.off("new_request");
      socket.off("request_update");
    };
  }, []);

  // Función para manejar la actualización de una petición (Aceptar/Completar).
  const handleUpdateRequest = async (
    id: number,
    status: "EN_CAMINO" | "COMPLETADO"
  ) => {
    try {
      await fetch(`http://localhost:3000/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          waiterId: status === "EN_CAMINO" ? WAITER_ID : undefined,
        }),
      });
    } catch (error) {
      console.error("Falló al actualizar la petición:", error);
    }
  };

  return (
    <div style={{ fontFamily: "sans-serif", padding: "1rem" }}>
      <h1>Cola de Peticiones </h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {requests.map((req) => (
          <div
            key={req.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "1rem",
              backgroundColor: req.status === "COMPLETADO" ? "#000" : "#fff",
              opacity: req.status === "COMPLETADO" ? 0.6 : 1,
            }}
          >
            <p>
              <strong>ID:</strong> {req.id} | <strong>Mesa:</strong>{" "}
              {req.tableId}
            </p>
            <p>
              <strong>Tipo:</strong> {req.type} | <strong>Estado:</strong>{" "}
              {req.status}
            </p>
            {req.waiterId && <p>Atendido por: Mesero {req.waiterId}</p>}

            {req.status === "PENDIENTE" && (
              <button onClick={() => handleUpdateRequest(req.id, "EN_CAMINO")}>
                Aceptar
              </button>
            )}
            {req.status === "EN_CAMINO" && (
              <button onClick={() => handleUpdateRequest(req.id, "COMPLETADO")}>
                Completar
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
