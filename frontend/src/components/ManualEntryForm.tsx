import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';

interface ManualEntryFormProps {
  onSuccess: () => void;
}

interface FormData {
  mode: 'single' | 'bulk';
  urls: string;
  companyName: string;
  xLikes?: number;
  linkedinLikes?: number;
}

function ManualEntryForm({ onSuccess }: ManualEntryFormProps) {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { mode: 'single' },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const urls = mode === 'bulk'
        ? data.urls.split(/[\n,]/).map(u => u.trim()).filter(Boolean)
        : [data.urls];

      const manualMetrics = [];
      if (data.xLikes !== undefined) {
        manualMetrics.push({ platform: 'x', likes: data.xLikes });
      }
      if (data.linkedinLikes !== undefined) {
        manualMetrics.push({ platform: 'linkedin', likes: data.linkedinLikes });
      }

      const response = await fetch('/api/launch-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls,
          companyName: data.companyName,
          manualMetrics: manualMetrics.length > 0 ? manualMetrics : undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit URLs');
      return response.json();
    },
    onSuccess: (data) => {
      const failedCount = data.results.filter((r: any) => r.status === 'failed').length;
      const successCount = data.results.filter((r: any) => r.status === 'success').length;

      if (failedCount > 0) {
        const errors = data.results
          .filter((r: any) => r.status === 'failed')
          .map((r: any) => `${r.url}: ${r.error}`);
        setValidationErrors(errors);
      } else {
        setValidationErrors([]);
      }

      if (successCount > 0) {
        reset();
        onSuccess();
      }
    },
  });

  const onSubmit = (data: FormData) => {
    setValidationErrors([]);
    mutation.mutate(data);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Launch Posts</h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Mode Selection */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="single"
              checked={mode === 'single'}
              onChange={() => setMode('single')}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700">Single URL</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="bulk"
              checked={mode === 'bulk'}
              onChange={() => setMode('bulk')}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700">Bulk URLs</span>
          </label>
        </div>

        {/* Company Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Name *
          </label>
          <input
            type="text"
            {...register('companyName', { required: 'Company name is required' })}
            placeholder="e.g., Acme Corp"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.companyName && (
            <p className="text-sm text-red-600 mt-1">{errors.companyName.message}</p>
          )}
        </div>

        {/* URLs */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {mode === 'bulk' ? 'URLs (one per line or comma-separated) *' : 'URL *'}
          </label>
          <textarea
            {...register('urls', { required: 'URL is required' })}
            placeholder={mode === 'bulk' ? 'https://x.com/...\nhttps://linkedin.com/...' : 'https://x.com/username/status/123'}
            rows={mode === 'bulk' ? 5 : 2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
          {errors.urls && (
            <p className="text-sm text-red-600 mt-1">{errors.urls.message}</p>
          )}
        </div>

        {/* Manual Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              X Likes (optional)
            </label>
            <input
              type="number"
              {...register('xLikes', { min: 0 })}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LinkedIn Likes (optional)
            </label>
            <input
              type="number"
              {...register('linkedinLikes', { min: 0 })}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-red-800 mb-2">Failed URLs:</p>
            <ul className="space-y-1">
              {validationErrors.map((error, idx) => (
                <li key={idx} className="text-sm text-red-700">• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
        >
          {mutation.isPending ? 'Submitting...' : 'Add Launch Posts'}
        </button>
      </form>
    </div>
  );
}

export default ManualEntryForm;
