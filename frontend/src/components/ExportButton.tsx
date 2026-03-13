import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

interface ExportButtonProps {
  companyIds?: string[];
}

function ExportButton({ companyIds }: ExportButtonProps) {
  const [showMenu, setShowMenu] = useState(false);

  const mutation = useMutation({
    mutationFn: async (selectedFormat: 'csv' | 'json') => {
      const params = new URLSearchParams({ format: selectedFormat });
      if (companyIds && companyIds.length > 0) {
        params.append('companyIds', companyIds.join(','));
      }

      const response = await fetch(`/api/export?${params}`);
      if (!response.ok) throw new Error('Failed to export');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `launch-tracker-${new Date().toISOString().split('T')[0]}.${selectedFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  });

  const handleExport = (selectedFormat: 'csv' | 'json') => {
    mutation.mutate(selectedFormat);
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={mutation.isPending}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
      >
        {mutation.isPending ? 'Exporting...' : 'Export'}
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          <button
            onClick={() => handleExport('csv')}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 border-b"
          >
            Export as CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
          >
            Export as JSON
          </button>
        </div>
      )}
    </div>
  );
}

export default ExportButton;
