import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import CompanyCard from '../components/CompanyCard';
import ManualEntryForm from '../components/ManualEntryForm';
import FilterBar from '../components/FilterBar';
import ExportButton from '../components/ExportButton';
import ToSDisclaimer from '../components/ToSDisclaimer';
import ErrorBoundary from '../components/ErrorBoundary';

interface Company {
  id: string;
  name: string;
  ycBatch: string | null;
  fundraise: {
    amount: number;
    date: string;
    source: 'yc_api' | 'manual';
  } | null;
  launchPosts: Array<{
    platform: 'x' | 'linkedin';
    url: string;
    likes: number;
    dataSource: 'scraped' | 'manual';
    lastUpdated: string;
  }>;
  contactInfo: {
    email: string | null;
    phone: string | null;
    linkedinUrl: string | null;
    xHandle: string | null;
  } | null;
  dmDraft: string | null;
  isLowEngagement: boolean;
}

interface DashboardFilters {
  sortBy: 'createdAt' | 'engagement' | 'fundraise';
  order: 'asc' | 'desc';
  minEngagement: number;
  hasContact: boolean | null;
}

function Dashboard() {
  const [filters, setFilters] = useState<DashboardFilters>({
    sortBy: 'createdAt',
    order: 'desc',
    minEngagement: 0,
    hasContact: null,
  });
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<{ companies: Company[] }>({
    queryKey: ['companies', filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        sortBy: filters.sortBy,
        order: filters.order,
        minEngagement: filters.minEngagement.toString(),
        ...(filters.hasContact !== null && { hasContact: filters.hasContact.toString() }),
      });
      const response = await fetch(`/api/companies?${params}`);
      if (!response.ok) throw new Error('Failed to fetch companies');
      return response.json();
    },
  });

  const handleFormSuccess = () => {
    setShowForm(false);
    refetch();
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Launch Tracker
                </h1>
                <p className="text-gray-600 text-sm mt-1">Track and manage your launch campaigns</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
                >
                  {showForm ? '✕ Hide Form' : '+ Add Launch Posts'}
                </button>
                <ExportButton companyIds={data?.companies.map(c => c.id)} />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <ToSDisclaimer />

          {/* Filters */}
          <FilterBar filters={filters} onFiltersChange={setFilters} />

          {/* Form */}
          {showForm && <ManualEntryForm onSuccess={handleFormSuccess} />}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-16">
              <div className="inline-block">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
              </div>
              <p className="mt-4 text-gray-600 font-medium">Loading companies...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="text-red-500 text-2xl">⚠️</div>
                <div>
                  <p className="text-red-800 font-semibold">Error loading companies</p>
                  <p className="text-red-700 text-sm mt-1">Please try again or refresh the page</p>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {data && data.companies.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
              <div className="text-5xl mb-4">📊</div>
              <p className="text-gray-600 font-medium text-lg">No companies yet</p>
              <p className="text-gray-500 text-sm mt-2">Add launch posts to get started tracking your campaigns</p>
            </div>
          )}

          {/* Companies Grid */}
          {data && data.companies.length > 0 && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Companies <span className="text-gray-500 font-normal">({data.companies.length})</span>
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.companies.map(company => (
                  <CompanyCard key={company.id} company={company} onRefresh={refetch} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default Dashboard;
