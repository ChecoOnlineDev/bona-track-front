import { useEffect, useState, useMemo } from 'react';
import { socket } from '../services/socket';

// Tipos de datos actualizados según el schema
type RequestStatus = 'PENDIENTE' | 'EN_CAMINO' | 'COMPLETADO';
interface Request {
    id: number;
    tableId: number;
    type: string;
    status: RequestStatus;
    notes?: string;
    waiterId?: number;
    createdAt: string; // Recibimos la fecha como string
}

const WAITER_ID = 1; // ID del mesero actual

// Componente para una tarjeta de petición individual
const RequestCard = ({
    req,
    onUpdate,
}: {
    req: Request;
    onUpdate: (id: number, status: 'EN_CAMINO' | 'COMPLETADO') => void;
}) => {
    const cardBgColor = {
        PENDIENTE: 'bg-yellow-100 border-yellow-400',
        EN_CAMINO: 'bg-blue-100 border-blue-400',
        COMPLETADO: 'bg-green-100 border-green-400 opacity-60',
    };

    const statusTextColor = {
        PENDIENTE: 'text-yellow-800',
        EN_CAMINO: 'text-blue-800',
        COMPLETADO: 'text-green-800',
    };

    const timeAgo = (date: string) => {
        // Lógica simple para mostrar hace cuánto tiempo fue creado
        const seconds = Math.floor(
            (new Date().getTime() - new Date(date).getTime()) / 1000,
        );
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + ' años';
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + ' meses';
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + ' días';
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + ' horas';
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + ' minutos';
        return Math.floor(seconds) + ' segundos';
    };

    return (
        <div
            className={`p-4 rounded-lg border-l-4 shadow-md transition-all ${
                cardBgColor[req.status]
            }`}
        >
            <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-lg text-gray-800">
                    Mesa {req.tableId}
                </span>
                <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        cardBgColor[req.status]
                    } ${statusTextColor[req.status]}`}
                >
                    {req.status.replace('_', ' ')}
                </span>
            </div>
            <p className="text-gray-700 font-semibold">{req.type}</p>
            {req.notes && (
                <p className="text-sm text-gray-600 mt-1 italic">
                    "{req.notes}"
                </p>
            )}
            <div className="text-xs text-gray-500 mt-3 flex justify-between items-center">
                <span>Hace {timeAgo(req.createdAt)}</span>
                {req.waiterId && (
                    <span className="font-semibold">
                        Atendido por: M{req.waiterId}
                    </span>
                )}
            </div>

            <div className="mt-4 flex gap-2">
                {req.status === 'PENDIENTE' && (
                    <button
                        onClick={() => onUpdate(req.id, 'EN_CAMINO')}
                        className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
                    >
                        Aceptar
                    </button>
                )}
                {req.status === 'EN_CAMINO' && (
                    <button
                        onClick={() => onUpdate(req.id, 'COMPLETADO')}
                        className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition"
                    >
                        Completar
                    </button>
                )}
            </div>
        </div>
    );
};

// Componente para una columna del tablero Kanban
const RequestColumn = ({
    title,
    requests,
    onUpdate,
}: {
    title: string;
    requests: Request[];
    onUpdate: (id: number, status: 'EN_CAMINO' | 'COMPLETADO') => void;
}) => (
    <div className="bg-gray-100 rounded-lg p-4 w-full md:w-1/3">
        <h2 className="text-xl font-bold mb-4 text-gray-800 border-b-2 pb-2">
            {title} ({requests.length})
        </h2>
        <div className="flex flex-col gap-4 overflow-y-auto h-[75vh]">
            {requests.length > 0 ? (
                requests.map((req) => (
                    <RequestCard key={req.id} req={req} onUpdate={onUpdate} />
                ))
            ) : (
                <p className="text-gray-500 text-center mt-4">
                    No hay peticiones.
                </p>
            )}
        </div>
    </div>
);

function WaiterView() {
    const [requests, setRequests] = useState<Request[]>([]);

    useEffect(() => {
        const fetchInitialRequests = async () => {
            try {
                const response = await fetch(
                    'http://localhost:3000/api/requests',
                );
                const data = await response.json();
                setRequests(data);
            } catch (error) {
                console.error('Falló al obtener las peticiones:', error);
            }
        };

        fetchInitialRequests();

        socket.on('new_request', (newRequest: Request) => {
            setRequests((current) => [newRequest, ...current]);
        });

        socket.on('request_update', (updatedRequest: Request) => {
            setRequests((current) =>
                current.map((req) =>
                    req.id === updatedRequest.id ? updatedRequest : req,
                ),
            );
        });

        return () => {
            socket.off('new_request');
            socket.off('request_update');
        };
    }, []);

    const handleUpdateRequest = async (
        id: number,
        status: 'EN_CAMINO' | 'COMPLETADO',
    ) => {
        try {
            await fetch(`http://localhost:3000/requests/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status,
                    waiterId: status === 'EN_CAMINO' ? WAITER_ID : undefined,
                }),
            });
        } catch (error) {
            console.error('Falló al actualizar la petición:', error);
        }
    };

    const filteredRequests = useMemo(
        () => ({
            PENDIENTE: requests.filter((r) => r.status === 'PENDIENTE'),
            EN_CAMINO: requests.filter((r) => r.status === 'EN_CAMINO'),
            COMPLETADO: requests.filter((r) => r.status === 'COMPLETADO'),
        }),
        [requests],
    );

    return (
        <div className="bg-gray-50 min-h-screen">
            <header className="bg-white shadow-md p-4">
                <h1 className="text-3xl font-bold text-center text-gray-900">
                    BonaTrack - Panel de Mesero
                </h1>
            </header>
            <main className="p-4 md:p-8">
                <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                    <RequestColumn
                        title="Pendientes"
                        requests={filteredRequests.PENDIENTE}
                        onUpdate={handleUpdateRequest}
                    />
                    <RequestColumn
                        title="En Camino"
                        requests={filteredRequests.EN_CAMINO}
                        onUpdate={handleUpdateRequest}
                    />
                    <RequestColumn
                        title="Completadas"
                        requests={filteredRequests.COMPLETADO}
                        onUpdate={handleUpdateRequest}
                    />
                </div>
            </main>
        </div>
    );
}

export default WaiterView;
