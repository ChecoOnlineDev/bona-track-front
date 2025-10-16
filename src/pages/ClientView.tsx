import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

// Estos son los tipos de peticiones que tu backend acepta
const REQUEST_TYPES = [
    'MENU',
    'CUENTA',
    'SERVILLETAS',
    'CUBIERTOS',
    'SALSAS',
    'RETIRAR_PLATOS',
    'LIMPIAR_MESA',
    'OTRO',
];

function ClientView() {
    const [searchParams] = useSearchParams();
    const tableId = searchParams.get('table') || '1'; // Asumimos mesa 1 si no viene en la URL
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');

    const handleRequest = async (type: string, customNotes?: string) => {
        setIsLoading(true);
        setFeedbackMessage('');
        try {
            const response = await fetch('http://localhost:3000/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tableId: parseInt(tableId),
                    type,
                    notes: customNotes || undefined,
                }),
            });

            if (!response.ok) {
                throw new Error('La petición falló');
            }

            setFeedbackMessage('¡Petición enviada! Un mesero vendrá pronto.');
            setNotes(''); // Limpiar el campo de texto
        } catch (error) {
            setFeedbackMessage(
                'Hubo un error al enviar tu petición. Por favor, intenta de nuevo.',
            );
            console.error('Error al crear la petición:', error);
        } finally {
            setIsLoading(false);
            // Ocultar el mensaje después de 5 segundos
            setTimeout(() => setFeedbackMessage(''), 5000);
        }
    };

    return (
        <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-orange-50 to-amber-50 flex flex-col">
            <header className="w-full bg-white shadow-sm sticky top-0 z-10">
                <div className="w-full px-2 sm:px-6 py-3 sm:py-6">
                    <div className="flex items-center justify-center">
                        <div className="bg-orange-500 text-white p-2 rounded-lg mr-3">
                            <i className="fas fa-utensils text-xl sm:text-2xl"></i>
                        </div>
                        <div className="text-center">
                            <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                                BonaTrack
                            </h1>
                            <p className="text-base sm:text-xl text-orange-600 font-medium">
                                Mesa {tableId}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 w-full px-4 sm:px-6 py-6 sm:py-8 max-w-2xl mx-auto">
                <div className="mb-4 sm:mb-6 px-1">
                    <h2 className="text-base sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">
                        ¿Qué necesitas?
                    </h2>
                    <p className="text-xs sm:text-base text-orange-700">
                        Selecciona una opción y un mesero te atenderá pronto
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-4 px-1">
                    {REQUEST_TYPES.filter((type) => type !== 'OTRO').map(
                        (type) => (
                            <button
                                key={type}
                                onClick={() => handleRequest(type)}
                                disabled={isLoading}
                                className="p-1.5 sm:p-3 md:p-4 bg-white rounded-xl text-center font-medium text-xs sm:text-sm text-gray-800 border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 sm:hover:scale-105 shadow-sm min-h-[80px] flex flex-col items-center justify-center"
                            >
                                <div className="text-xl sm:text-2xl mb-1">
                                    {type === 'MENU' && '📋'}
                                    {type === 'CUENTA' && '💳'}
                                    {type === 'SERVILLETAS' && '🧻'}
                                    {type === 'CUBIERTOS' && '🍴'}
                                    {type === 'SALSAS' && '🧂'}
                                    {type === 'RETIRAR_PLATOS' && '🍽️'}
                                    {type === 'LIMPIAR_MESA' && '🧹'}
                                </div>
                                <span className="text-sm sm:text-base">
                                    {type.replace('_', ' ')}
                                </span>
                            </button>
                        ),
                    )}
                </div>

                <div className="mt-2 sm:mt-4 bg-white rounded-xl p-3 sm:p-4 shadow-sm border-2 border-orange-200 mx-1">
                    <label className="block text-sm sm:text-base font-semibold text-gray-800 mb-2 sm:mb-3">
                        ¿Algo más?
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Escribe aquí cualquier petición especial..."
                        className="w-full p-2 sm:p-4 bg-orange-50 rounded-lg border-2 border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800 placeholder-orange-400 text-xs sm:text-base"
                        rows={3}
                        disabled={isLoading}
                    />
                    <button
                        onClick={() => handleRequest('OTRO', notes)}
                        disabled={isLoading || !notes}
                        className="w-full mt-2 p-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 rounded-lg font-bold text-white focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 shadow-md text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center">
                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                Enviando...
                            </span>
                        ) : (
                            <span className="flex items-center justify-center">
                                <i className="fas fa-paper-plane mr-2"></i>
                                Enviar Petición
                            </span>
                        )}
                    </button>
                </div>

                {feedbackMessage && (
                    <div className={`mt-4 sm:mt-6 p-3 text-center rounded-xl shadow-md animate-fade-in mx-1 ${
                        feedbackMessage.includes('error') 
                            ? 'bg-red-100 border-2 border-red-300 text-red-800' 
                            : 'bg-green-100 border-2 border-green-300 text-green-800'
                    }`}>
                        <p className="font-medium text-xs sm:text-sm">
                            {feedbackMessage.includes('error') ? '❌' : '✅'} {feedbackMessage}
                        </p>
                    </div>
                )}
                <div className="h-4 sm:h-6"></div>
            </main>

            <footer className="w-full bg-white border-t border-orange-200 py-4">
                <p className="text-center text-xs sm:text-sm text-orange-600">
                    Powered by BonaTrack
                </p>
            </footer>
        </div>
    );
}

export default ClientView;
