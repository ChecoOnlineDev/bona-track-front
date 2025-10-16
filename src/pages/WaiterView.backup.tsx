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

// --- Componente para una tarjeta de petición individual (MODIFICADO) ---
const RequestCard = ({
    req,
    onUpdate,
    isUpdating,
}: {
    req: Request;
    onUpdate: (id: number, status: 'EN_CAMINO' | 'COMPLETADO') => void;
    isUpdating: boolean;
}) => {
    const cardBgColor = {
        PENDIENTE: 'bg-orange-50 border-orange-300 hover:shadow-orange-200',
        EN_CAMINO: 'bg-amber-50 border-amber-300 hover:shadow-amber-200',
        COMPLETADO: 'bg-orange-50/50 border-orange-200 opacity-90',
    };

    const statusTextColor = {
        PENDIENTE: 'text-orange-700',
        EN_CAMINO: 'text-amber-700',
        COMPLETADO: 'text-orange-600',
    };

    const statusBgColor = {
        PENDIENTE: 'bg-orange-100 text-orange-800',
        EN_CAMINO: 'bg-amber-100 text-amber-800',
        COMPLETADO: 'bg-orange-50 text-orange-600',
    };

    const buttonStyle = {
        PENDIENTE: 'bg-orange-500 hover:bg-orange-600',
        EN_CAMINO: 'bg-amber-500 hover:bg-amber-600',
        COMPLETADO: 'bg-green-500 hover:bg-green-600',
    };

    const timeAgo = (date: string) => {
        const seconds = Math.floor(
            (new Date().getTime() - new Date(date).getTime()) / 1000,
        );
        if (seconds < 60) return `${seconds} segundos`;
        const minutes = Math.floor(seconds / 60);
        return `${minutes} minutos`;
    };

    return (
        <div
            className={`p-3 sm:p-4 rounded-xl border-l-4 shadow-sm transition-all transform hover:scale-[1.01] hover:shadow-md ${
                cardBgColor[req.status]
            }`}
        >
            <div className="flex justify-between items-start mb-3 gap-2">
                <div className="flex-1 min-w-0">
                    <span className="font-bold text-base sm:text-lg text-orange-900">
                        Mesa {req.tableId}
                    </span>
                    <p className="text-sm sm:text-base text-orange-800 font-semibold mt-1 truncate">
                        {req.type}
                    </p>
                </div>
                <span
                    className={`px-2 sm:px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap flex-shrink-0 ${
                        statusBgColor[req.status]
                    }`}
                >
                    {req.status.replace('_', ' ')}
                </span>
            </div>

            {req.notes && (
                <div className="bg-white/50 p-2 rounded-lg mb-3 border border-orange-100">
                    <p className="text-xs sm:text-sm text-orange-700 italic break-words">
                        "{req.notes}"
                    </p>
                </div>
            )}

            <div className="flex justify-between items-center text-xs gap-2">
                <div className="text-orange-600 bg-orange-50 px-2 py-1 rounded-full flex-shrink-0">
                    <i className="far fa-clock mr-1"></i>
                    <span className="hidden sm:inline">Hace </span>{timeAgo(req.createdAt)}
                </div>
                {req.waiterId && (
                    <span className="text-orange-700 font-medium bg-orange-50 px-2 py-1 rounded-full flex-shrink-0">
                        <i className="fas fa-user-tie mr-1"></i>M{req.waiterId}
                    </span>
                )}
            </div>

            <div className="mt-3 sm:mt-4">
                {req.status === 'PENDIENTE' && (
                    <button
                        onClick={() => onUpdate(req.id, 'EN_CAMINO')}
                        disabled={isUpdating}
                        className={`w-full py-2 px-3 sm:px-4 rounded-lg text-white text-sm sm:text-base font-medium transition-all duration-200 transform active:scale-95 sm:hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${
                            buttonStyle.PENDIENTE
                        }`}
                    >
                        {isUpdating ? 'Procesando...' : 'Aceptar'}
                    </button>
                )}
                {req.status === 'EN_CAMINO' && (
                    <button
                        onClick={() => onUpdate(req.id, 'COMPLETADO')}
                        disabled={isUpdating}
                        className={`w-full py-2 px-3 sm:px-4 rounded-lg text-white text-sm sm:text-base font-medium transition-all duration-200 transform active:scale-95 sm:hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${
                            buttonStyle.EN_CAMINO
                        }`}
                    >
                        {isUpdating
                            ? 'Procesando...'
                            : 'Completar'}
                    </button>
                )}
            </div>
        </div>
    );
};

// --- Componente para una columna del tablero Kanban (MODIFICADO) ---
const RequestColumn = ({
    title,
    requests,
    onUpdate,
    updatingId,
}: {
    title: string;
    requests: Request[];
    onUpdate: (id: number, status: 'EN_CAMINO' | 'COMPLETADO') => void;
    updatingId: number | null;
}) => {
    const getColumnStyle = () => {
        switch (title) {
            case 'Pendientes':
                return 'border-t-4 border-orange-400';
            case 'En Camino':
                return 'border-t-4 border-amber-400';
            case 'Completadas':
                return 'border-t-4 border-green-400';
            default:
                return 'border-t-4 border-gray-400';
        }
    };

    return (
        <div
            className={`bg-white rounded-xl shadow-sm p-3 sm:p-4 w-full h-full ${getColumnStyle()}`}
        >
            <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-bold text-gray-800">{title}</h2>
                <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2 sm:px-3 py-1 rounded-full">
                    {requests.length}
                </span>
            </div>
            <div className="space-y-3 sm:space-y-4 overflow-y-auto h-[calc(100vh-180px)] sm:h-[calc(100vh-220px)] pr-1 sm:pr-2">
                {requests.length > 0 ? (
                    requests.map((req) => (
                        <RequestCard
                            key={req.id}
                            req={req}
                            onUpdate={onUpdate}
                            isUpdating={updatingId === req.id}
                        />
                    ))
                ) : (
                    <div className="bg-orange-50/50 border-2 border-dashed border-orange-200 rounded-xl p-4 sm:p-6 text-center">
                        <i className="fas fa-inbox text-2xl sm:text-3xl text-orange-300 mb-2"></i>
                        <p className="text-sm sm:text-base text-orange-600">No hay peticiones</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Componente principal de la vista del mesero (MODIFICADO) ---
function WaiterView() {
    const [requests, setRequests] = useState<Request[]>([]);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    useEffect(() => {
        const fetchInitialRequests = async () => {
            try {
                const response = await fetch('http://localhost:3000/requests');
                if (!response.ok)
                    throw new Error('Network response was not ok');
                const data = await response.json();
                setRequests(data);
            } catch (error) {
                console.error(
                    'Falló al obtener las peticiones iniciales:',
                    error,
                );
            }
        };

        fetchInitialRequests();
        socket.connect();

        const onNewRequest = (newRequest: Request) => {
            setRequests((current) => [newRequest, ...current]);
        };

        const onRequestUpdate = (updatedRequest: Request) => {
            setRequests((current) =>
                current.map((req) =>
                    req.id === updatedRequest.id ? updatedRequest : req,
                ),
            );
        };

        socket.on('new_request', onNewRequest);
        socket.on('request_update', onRequestUpdate);

        return () => {
            socket.off('new_request', onNewRequest);
            socket.off('request_update', onRequestUpdate);
            socket.disconnect();
        };
    }, []);

    const handleUpdateRequest = async (
        id: number,
        status: 'EN_CAMINO' | 'COMPLETADO',
    ) => {
        setUpdatingId(id);
        try {
            const response = await fetch(
                `http://localhost:3000/requests/${id}`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        status,
                        waiterId:
                            status === 'EN_CAMINO' ? WAITER_ID : undefined,
                        updatedAt: new Date().toISOString(),
                    }),
                },
            );

            if (!response.ok) {
                throw new Error('Falló la actualización en el servidor');
            }

            const updatedRequest = await response.json();
            setRequests((prev) =>
                prev.map((req) =>
                    req.id === id ? { ...req, ...updatedRequest } : req,
                ),
            );
        } catch (error) {
            console.error('Error al actualizar la petición:', error);
        } finally {
            setUpdatingId(null);
        }
    };

    // Filtrar y ordenar las peticiones por estado y tiempo
    const filteredRequests = useMemo(() => {
        const sorted = [...requests].sort(
            (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
        );

        return {
            PENDIENTE: sorted.filter((r) => r.status === 'PENDIENTE'),
            EN_CAMINO: sorted.filter((r) => r.status === 'EN_CAMINO'),
            COMPLETADO: sorted.filter((r) => r.status === 'COMPLETADO'),
        };
    }, [requests]);

    return (
        <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-orange-50 to-amber-50">
            <header className="w-full bg-white shadow-sm sticky top-0 z-20">
                <div className="w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
                    <div className="flex justify-between items-center w-full">
                        <div className="flex items-center flex-shrink-0">
                            <div className="bg-orange-500 text-white p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3">
                                <i className="fas fa-utensils text-base sm:text-xl"></i>
                            </div>
                            <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                                BonaTrack
                            </h1>
                        </div>
                        <div className="flex items-center space-x-2 sm:space-x-4">
                            <span className="hidden sm:inline-block bg-orange-100 text-orange-800 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full">
                                <i className="fas fa-user-shield mr-1 sm:mr-2"></i>
                                Mesero #{WAITER_ID}
                            </span>
                            <button className="p-1.5 sm:p-2 text-orange-600 hover:bg-orange-50 rounded-full transition-colors">
                                <i className="fas fa-bell text-sm sm:text-lg"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
                <div className="mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-800">
                        Panel de Control
                    </h2>
                    <p className="text-xs sm:text-base text-orange-700">
                        Gestiona las solicitudes de las mesas
                    </p>
                </div>

                {/* Mobile: Scroll horizontal, Desktop: Grid */}
                <div className="flex lg:hidden overflow-x-auto gap-3 pb-4 snap-x snap-mandatory">
                    <div className="min-w-[85vw] snap-center">
                        <RequestColumn
                            title="Pendientes"
                            requests={filteredRequests.PENDIENTE}
                            onUpdate={handleUpdateRequest}
                            updatingId={updatingId}
                        />
                    </div>
                    <div className="min-w-[85vw] snap-center">
                        <RequestColumn
                            title="En Camino"
                            requests={filteredRequests.EN_CAMINO}
                            onUpdate={handleUpdateRequest}
                            updatingId={updatingId}
                        />
                    </div>
                    <div className="min-w-[85vw] snap-center">
                        <RequestColumn
                            title="Completadas"
                            requests={filteredRequests.COMPLETADO}
                            onUpdate={handleUpdateRequest}
                            updatingId={updatingId}
                        />
                    </div>
                </div>

                {/* Desktop: Grid layout */}
                <div className="hidden lg:grid lg:grid-cols-3 gap-6">
                    <RequestColumn
                        title="Pendientes"
                        requests={filteredRequests.PENDIENTE}
                        onUpdate={handleUpdateRequest}
                        updatingId={updatingId}
                    />
                    <RequestColumn
                        title="En Camino"
                        requests={filteredRequests.EN_CAMINO}
                        onUpdate={handleUpdateRequest}
                        updatingId={updatingId}
                    />
                    <RequestColumn
                        title="Completadas"
                        requests={filteredRequests.COMPLETADO}
                        onUpdate={handleUpdateRequest}
                        updatingId={updatingId}
                    />
                </div>
            </main>

            {/* Botón flotante */}
            <div className="fixed bottom-4 right-4 z-10">
                <button className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white p-3 sm:p-4 rounded-full shadow-lg transform active:scale-95 sm:hover:scale-105 transition-all">
                    <i className="fas fa-plus text-base sm:text-xl"></i>
                </button>
            </div>
        </div>
    );
}

export default WaiterView;
