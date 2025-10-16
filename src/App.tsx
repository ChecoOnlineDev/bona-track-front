import { Routes, Route, Link } from 'react-router-dom';
import ClientView from './pages/ClientView';
import WaiterView from './pages/WaiterView';

function App() {
    return (
        <div>
            {/* Menú de navegación simple para movernos entre vistas durante el desarrollo */}
            <nav className="bg-gray-800 p-4 mb-8">
                <ul className="flex gap-4 justify-center">
                    <li>
                        <Link
                            to="/?table=5"
                            className="text-white hover:text-blue-300"
                        >
                            Cliente (Mesa 5)
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/waiter"
                            className="text-white hover:text-blue-300"
                        >
                            Vista Mesero
                        </Link>
                    </li>
                </ul>
            </nav>

            <main>
                <Routes>
                    <Route path="/" element={<ClientView />} />
                    <Route path="/waiter" element={<WaiterView />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;
