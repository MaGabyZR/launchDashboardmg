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
    <div className="bg-white rounded-xl shadow-lg p-8 mb-6 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">🚀</span>
        <h3 className="text-2xl font-bold text-gray-900">Add Launch Posts</h3>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Mode Selection */}
        <div className="flex gap-4 bg-gray-50 p-4 rounded-lg">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              value="single"
              checked={mode === 'single'}
              onChange={() => setMode('single')}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">📌 Single URL</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              value="bulk"
              checked={mode === 'bulk'}
              onChange={() => setMode('bulk')}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">📋 Bulk URLs</span>
          </label>
        </div>

        {/* Company Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('companyName', { required: 'Company name is required' })}
            placeholder="e.g., Acme Corp"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          {errors.companyName && (
            <p className="text-sm text-red-600 mt-2">⚠️ {errors.companyName.message}</p>
          )}
        </div>

        {/* URLs */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {mode === 'bulk' ? 'URLs (one per line or comma-separated) *' : 'URL *'}
          </label>
          <textarea
            {...register('urls', { required: 'URL is required' })}
            placeholder={mode === 'bulk' ? 'https://x.com/...\nhttps://linkedin.com/...' : 'https://x.com/username/status/123'}
            rows={mode === 'bulk' ? 5 : 2}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm transition-all"
          />
          {errors.urls && (
            <p className="text-sm text-red-600 mt-2">⚠️ {errors.urls.message}</p>
          )}
        </div>

        {/* Manual Metrics */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <p className="text-sm font-semibold text-gray-700 mb-3">📊 Manual Metrics (Optional)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                X Likes
              </label>
              <input
                type="number"
                {...register('xLikes', { min: 0 })}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                LinkedIn Likes
              </label>
              <input
                type="number"
                {...register('linkedinLikes', { min: 0 })}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
            <p className="text-sm font-semibold text-red-800 mb-3">❌ Failed URLs:</p>
            <ul className="space-y-2">
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
          className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 font-semibold"
        >
          {mutation.isPending ? '⏳ Submitting...' : '✓ Add Launch Posts'}
        </button>
      </form>
    </div>
  );
}

export default ManualEntryForm;
