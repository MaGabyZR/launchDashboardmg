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
      <div className="space-y-6">
        <ToSDisclaimer />

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'Hide Form' : 'Add Launch Posts'}
          </button>
          <div className="flex gap-2">
            <FilterBar filters={filters} onFiltersChange={setFilters} />
            <ExportButton companyIds={data?.companies.map(c => c.id)} />
          </div>
        </div>

        {showForm && <ManualEntryForm onSuccess={handleFormSuccess} />}

        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading companies...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error loading companies. Please try again.</p>
          </div>
        )}

        {data && data.companies.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No companies yet. Add launch posts to get started.</p>
          </div>
        )}

        {data && data.companies.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.companies.map(company => (
              <CompanyCard key={company.id} company={company} onRefresh={refetch} />
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default Dashboard;
