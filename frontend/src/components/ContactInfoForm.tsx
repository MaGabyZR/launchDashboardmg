import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';

interface ContactInfoFormProps {
  companyId: string;
  existingData?: {
    email: string | null;
    phone: string | null;
    linkedinUrl: string | null;
    xHandle: string | null;
  };
  onSave: () => void;
}

interface FormData {
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  xHandle?: string;
}

function ContactInfoForm({ companyId, existingData, onSave }: ContactInfoFormProps) {
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: existingData ? {
      email: existingData.email || undefined,
      phone: existingData.phone || undefined,
      linkedinUrl: existingData.linkedinUrl || undefined,
      xHandle: existingData.xHandle || undefined,
    } : {},
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch(`/api/companies/${companyId}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to save contact info');
      return response.json();
    },
    onSuccess: () => {
      setShowForm(false);
      onSave();
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="text-sm px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition-all font-semibold shadow-md hover:shadow-lg"
      >
        {existingData?.email ? '✏️ Edit Contact' : '➕ Add Contact'}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl shadow-2xl p-6 max-w-md w-full border border-slate-600">
        <h3 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
          <span>📋</span>
          Contact Information
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              📧 Email
            </label>
            <input
              type="email"
              {...register('email', {
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Invalid email address',
                },
              })}
              placeholder="contact@company.com"
              className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
            />
            {errors.email && (
              <p className="text-sm text-red-400 mt-1">❌ {errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              📞 Phone
            </label>
            <input
              type="tel"
              {...register('phone')}
              placeholder="+1 (555) 123-4567"
              className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              🔗 LinkedIn URL
            </label>
            <input
              type="url"
              {...register('linkedinUrl', {
                pattern: {
                  value: /^https?:\/\/(www\.)?linkedin\.com\/.*/,
                  message: 'Invalid LinkedIn URL',
                },
              })}
              placeholder="https://linkedin.com/company/..."
              className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
            />
            {errors.linkedinUrl && (
              <p className="text-sm text-red-400 mt-1">❌ {errors.linkedinUrl.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              𝕏 X (Twitter) Handle
            </label>
            <input
              type="text"
              {...register('xHandle')}
              placeholder="@company"
              className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl"
            >
              {mutation.isPending ? '⏳ Saving...' : '✓ Save'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 px-4 py-2 bg-slate-600 text-slate-200 rounded-lg hover:bg-slate-500 transition-all font-semibold border border-slate-500"
            >
              ✕ Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ContactInfoForm;
