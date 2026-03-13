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
        className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
      >
        {existingData?.email ? 'Edit Contact' : 'Add Contact'}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              {...register('phone')}
              placeholder="+1 (555) 123-4567"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LinkedIn URL
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.linkedinUrl && (
              <p className="text-sm text-red-600 mt-1">{errors.linkedinUrl.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              X (Twitter) Handle
            </label>
            <input
              type="text"
              {...register('xHandle')}
              placeholder="@company"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
            >
              {mutation.isPending ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ContactInfoForm;
