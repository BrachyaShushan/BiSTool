import React from "react";
import { useNavigate } from "react-router-dom";

const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 mb-4 select-none">
                404
            </div>
            <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Page Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                Sorry, the page you are looking for does not exist or has been moved.<br />
                Please check the URL or return to the home page.
            </p>
            <button
                onClick={() => navigate('/')}
                className="px-6 py-3 font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200"
            >
                Go to Home
            </button>
        </div>
    );
};

export default NotFoundPage; 