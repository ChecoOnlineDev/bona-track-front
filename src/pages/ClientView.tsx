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
            const response = await fetch('http://localhost:3000/api/requests', {
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
        <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center p-4">
            <header className="text-center my-8">
                <h1 className="text-4xl font-bold">BonaTrack</h1>
                <p className="text-xl text-gray-400">Mesa {tableId}</p>
            </header>

            <main className="w-full max-w-md">
                <div className="grid grid-cols-2 gap-4">
                    {REQUEST_TYPES.filter((type) => type !== 'OTRO').map(
                        (type) => (
                            <button
                                key={type}
                                onClick={() => handleRequest(type)}
                                disabled={isLoading}
                                className="p-4 bg-gray-800 rounded-lg text-center font-semibold hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                            >
                                {type.replace('_', ' ')}
                            </button>
                        ),
                    )}
                </div>

                <div className="mt-8">
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="¿Necesitas algo más? Escríbelo aquí..."
                        className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        disabled={isLoading}
                    />
                    <button
                        onClick={() => handleRequest('OTRO', notes)}
                        disabled={isLoading || !notes}
                        className="w-full mt-2 p-4 bg-blue-600 rounded-lg font-bold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? 'Enviando...' : 'Enviar Petición'}
                    </button>
                </div>

                {feedbackMessage && (
                    <div className="mt-6 p-4 text-center bg-gray-700 rounded-lg">
                        <p>{feedbackMessage}</p>
                    </div>
                )}
            </main>
        </div>
    );
}

export default ClientView;
