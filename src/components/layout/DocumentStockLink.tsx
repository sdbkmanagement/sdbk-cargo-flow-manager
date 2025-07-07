
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText } from 'lucide-react';

export const DocumentStockLink = () => {
  const location = useLocation();
  const isActive = location.pathname === '/document-stock';

  return (
    <Link
      to="/document-stock"
      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? 'bg-orange-100 text-orange-700'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      <FileText className="mr-3 h-5 w-5" />
      Stock documentaire
    </Link>
  );
};
