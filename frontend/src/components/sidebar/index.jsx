import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
    return (
        <aside className="w-64 h-full bg-gray-800 text-white flex flex-col">
            <div className="p-6 border-b border-gray-700">
                <h2 className="text-2xl font-bold">Menu</h2>
            </div>
            <nav className="flex-1 p-6">
                <ul className="space-y-4">
                    <li>
                        <Link
                            to="/historias"
                            className="block px-4 py-2 rounded hover:bg-gray-700 transition"
                        >
                            Histórias
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/personagens"
                            className="block px-4 py-2 rounded hover:bg-gray-700 transition"
                        >
                            Personagens
                        </Link>
                    </li>
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;
