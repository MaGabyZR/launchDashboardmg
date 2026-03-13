import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import DataSourceBadge from './DataSourceBadge';
import ContactInfoForm from './ContactInfoForm';

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

interface CompanyCardProps {
  company: Company;
  onRefresh: () => void;
}

function CompanyCard({ company, onRefresh }: CompanyCardProps) {
  const [copied, setCopied] = useState(false);

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/refresh/${company.id}`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to refresh');
      return response.json();
    },
    onSuccess: () => {
      onRefresh();
    },
  });

  const handleCopyDM = () => {
    if (company.dmDraft) {
      navigator.clipboard.writeText(company.dmDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const xPost = company.launchPosts.find(p => p.platform === 'x');
  const linkedinPost = company.launchPosts.find(p => p.platform === 'linkedin');

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
          {company.ycBatch && (
            <p className="text-sm text-gray-600">YC {company.ycBatch}</p>
          )}
        </div>
        <button
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
        >
          {refreshMutation.isPending ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Fundraise */}
      {company.fundraise ? (
        <div className="mb-4 pb-4 border-b">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Fundraise:</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">
                ${(company.fundraise.amount / 1000000).toFixed(1)}M
              </span>
              <DataSourceBadge source={company.fundraise.source} />
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-4 pb-4 border-b text-sm text-gray-500">
          No fundraise data
        </div>
      )}

      {/* Engagement Metrics */}
      <div className="space-y-3 mb-4 pb-4 border-b">
        {xPost ? (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">X Likes:</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{xPost.likes}</span>
              <DataSourceBadge source={xPost.dataSource} />
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">No X post data</div>
        )}

        {linkedinPost ? (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">LinkedIn Likes:</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{linkedinPost.likes}</span>
              <DataSourceBadge source={linkedinPost.dataSource} />
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">No LinkedIn post data</div>
        )}
      </div>

      {/* Contact Info */}
      {company.contactInfo && (
        <div className="mb-4 pb-4 border-b">
          <p className="text-sm font-semibold text-gray-700 mb-2">Contact:</p>
          <div className="space-y-1 text-sm text-gray-600">
            {company.contactInfo.email && (
              <p>Email: {company.contactInfo.email}</p>
            )}
            {company.contactInfo.phone && (
              <p>Phone: {company.contactInfo.phone}</p>
            )}
            {company.contactInfo.linkedinUrl && (
              <p>
                LinkedIn:{' '}
                <a
                  href={company.contactInfo.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Profile
                </a>
              </p>
            )}
            {company.contactInfo.xHandle && (
              <p>
                X:{' '}
                <a
                  href={`https://x.com/${company.contactInfo.xHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  @{company.contactInfo.xHandle}
                </a>
              </p>
            )}
          </div>
          <div className="mt-2">
            <ContactInfoForm
              companyId={company.id}
              existingData={company.contactInfo}
              onSave={onRefresh}
            />
          </div>
        </div>
      )}

      {!company.contactInfo && (
        <div className="mb-4 pb-4 border-b">
          <ContactInfoForm
            companyId={company.id}
            existingData={undefined}
            onSave={onRefresh}
          />
        </div>
      )}

      {/* DM Draft */}
      {company.isLowEngagement && company.dmDraft && (
        <div className="mb-4 pb-4 border-b bg-yellow-50 p-3 rounded">
          <p className="text-sm font-semibold text-gray-700 mb-2">Outreach Draft:</p>
          <p className="text-sm text-gray-700 mb-2">{company.dmDraft}</p>
          <button
            onClick={handleCopyDM}
            className="text-sm px-3 py-1 bg-yellow-200 hover:bg-yellow-300 rounded transition-colors"
          >
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
      )}

      {/* Last Updated */}
      {(xPost || linkedinPost) && (
        <p className="text-xs text-gray-500">
          Last updated: {new Date(xPost?.lastUpdated || linkedinPost?.lastUpdated || '').toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

export default CompanyCard;
