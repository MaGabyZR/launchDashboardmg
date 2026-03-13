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
      
      const url = `/api/companies?${params}`;
      console.log('📤 Fetching companies from:', url);
      
      const response = await fetch(url);
      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`Failed to fetch companies (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Fetched companies:', data);
      return data;
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
              <div className="flex items-start gap-3">
                <div className="text-red-500 text-2xl flex-shrink-0">⚠️</div>
                <div className="flex-1">
                  <p className="text-red-800 font-semibold">Error loading companies</p>
                  <p className="text-red-700 text-sm mt-1">{error instanceof Error ? error.message : 'Unknown error'}</p>
                  <details className="mt-3 text-xs text-red-600">
                    <summary className="cursor-pointer font-medium">Debug Info</summary>
                    <pre className="mt-2 bg-red-100 p-2 rounded overflow-auto max-h-40">
                      {error instanceof Error ? error.stack : JSON.stringify(error, null, 2)}
                    </pre>
                  </details>
                  <button
                    onClick={() => refetch()}
                    className="mt-3 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                  >
                    Retry
                  </button>
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
