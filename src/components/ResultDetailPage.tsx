import React from 'react';
import { useParams } from 'react-router-dom';

const ResultDetailPage: React.FC = () => {
    const { type, id } = useParams();
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Detail Page</h1>
            <p>Type: {type}</p>
            <p>ID: {id}</p>
            {/* Add more details as needed */}
        </div>
    );
};

export default ResultDetailPage; 