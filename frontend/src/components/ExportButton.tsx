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
        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 font-semibold flex items-center gap-2"
      >
        <span>📥</span>
        {mutation.isPending ? 'Exporting...' : 'Export'}
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-40 bg-gradient-to-b from-slate-700 to-slate-800 rounded-lg shadow-2xl border border-slate-600 z-10 overflow-hidden">
          <button
            onClick={() => handleExport('csv')}
            className="w-full text-left px-4 py-3 hover:bg-slate-600 text-sm text-white border-b border-slate-600 transition-colors font-medium flex items-center gap-2"
          >
            <span>📊</span>
            Export as CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            className="w-full text-left px-4 py-3 hover:bg-slate-600 text-sm text-white transition-colors font-medium flex items-center gap-2"
          >
            <span>📋</span>
            Export as JSON
          </button>
        </div>
      )}
    </div>
  );
}

export default ExportButton;
