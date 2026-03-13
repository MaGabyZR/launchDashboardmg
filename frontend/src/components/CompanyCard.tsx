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
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">{company.name}</h3>
            {company.ycBatch && (
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                  YC {company.ycBatch}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            className="px-3 py-2 text-sm bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-all duration-200 disabled:opacity-50 font-medium"
            title="Refresh engagement metrics"
          >
            {refreshMutation.isPending ? '⟳ Refreshing' : '⟳ Refresh'}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Fundraise Section */}
        {company.fundraise ? (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Fundraise Amount</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-green-700">
                ${(company.fundraise.amount / 1000000).toFixed(1)}M
              </span>
              <DataSourceBadge source={company.fundraise.source} />
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
            <p className="text-sm text-gray-500">No fundraise data</p>
          </div>
        )}

        {/* Engagement Metrics */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Engagement Metrics</p>
          <div className="grid grid-cols-2 gap-3">
            {xPost ? (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="text-xs text-gray-600 mb-1">X Likes</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-blue-700">{xPost.likes}</span>
                  <DataSourceBadge source={xPost.dataSource} />
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
                <p className="text-xs text-gray-500">No X data</p>
              </div>
            )}

            {linkedinPost ? (
              <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                <p className="text-xs text-gray-600 mb-1">LinkedIn Likes</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-indigo-700">{linkedinPost.likes}</span>
                  <DataSourceBadge source={linkedinPost.dataSource} />
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
                <p className="text-xs text-gray-500">No LinkedIn data</p>
              </div>
            )}
          </div>
        </div>

        {/* Contact Info */}
        {company.contactInfo && (
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Contact Information</p>
            <div className="space-y-2 text-sm">
              {company.contactInfo.email && (
                <p className="text-gray-700"><span className="font-semibold">📧</span> {company.contactInfo.email}</p>
              )}
              {company.contactInfo.phone && (
                <p className="text-gray-700"><span className="font-semibold">📱</span> {company.contactInfo.phone}</p>
              )}
              {company.contactInfo.linkedinUrl && (
                <p className="text-gray-700">
                  <span className="font-semibold">💼</span>{' '}
                  <a
                    href={company.contactInfo.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    LinkedIn Profile
                  </a>
                </p>
              )}
              {company.contactInfo.xHandle && (
                <p className="text-gray-700">
                  <span className="font-semibold">𝕏</span>{' '}
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
            <div className="mt-3">
              <ContactInfoForm
                companyId={company.id}
                existingData={company.contactInfo}
                onSave={onRefresh}
              />
            </div>
          </div>
        )}

        {!company.contactInfo && (
          <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 text-center">
            <p className="text-sm text-gray-600 mb-3">No contact information yet</p>
            <ContactInfoForm
              companyId={company.id}
              existingData={undefined}
              onSave={onRefresh}
            />
          </div>
        )}

        {/* DM Draft */}
        {company.isLowEngagement && company.dmDraft && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border-2 border-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">💡</span>
              <p className="text-sm font-bold text-amber-900">Outreach Opportunity</p>
            </div>
            <p className="text-sm text-amber-900 mb-3 leading-relaxed">{company.dmDraft}</p>
            <button
              onClick={handleCopyDM}
              className="w-full px-3 py-2 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg transition-colors font-semibold text-sm"
            >
              {copied ? '✓ Copied to Clipboard' : '📋 Copy to Clipboard'}
            </button>
          </div>
        )}

        {/* Last Updated */}
        {(xPost || linkedinPost) && (
          <p className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
            Last updated: {new Date(xPost?.lastUpdated || linkedinPost?.lastUpdated || '').toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}

export default CompanyCard;
