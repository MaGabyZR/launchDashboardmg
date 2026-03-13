/**
 * Type definitions for Launch Tracker Dashboard API
 */

export type Platform = 'x' | 'linkedin';
export type DataSource = 'manual' | 'scraped' | 'yc_api';

export interface Company {
  id: string;
  name: string;
  ycBatch: string | null;
  createdAt: Date;
  updatedAt: Date;
  fundraise: Fundraise | null;
  launchPosts: LaunchPost[];
  contactInfo: ContactInfo | null;
  dmDraft: string | null;
  isLowEngagement: boolean;
}

export interface Fundraise {
  id: string;
  companyId: string;
  amount: number;
  announcementDate: Date;
  source: DataSource;
  createdAt: Date;
  updatedAt: Date;
}

export interface LaunchPost {
  id: string;
  companyId: string;
  platform: Platform;
  url: string;
  postId: string;
  likes: number;
  dataSource: DataSource;
  lastScraped: Date | null;
  scrapeFailed: boolean;
  scrapeError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactInfo {
  id: string;
  companyId: string;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  xHandle: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParsedURL {
  platform: Platform;
  postId: string;
  isValid: boolean;
  error?: string;
}

export interface ScrapedMetrics {
  likes: number;
  success: boolean;
  error?: string;
  scrapedAt: Date;
}

export interface YCCompany {
  name: string;
  batch: string;
  amountRaised: number;
  announcementDate: string;
}

export interface DMDraft {
  message: string;
  companyName: string;
  reason: string;
}

// API Request/Response types

export interface AddLaunchPostsRequest {
  urls: string[];
  companyName: string;
  manualMetrics?: {
    platform: Platform;
    likes: number;
  }[];
}

export interface AddLaunchPostsResponse {
  success: boolean;
  results: {
    url: string;
    status: 'success' | 'failed';
    error?: string;
    companyId?: string;
  }[];
}

export interface GetCompaniesQuery {
  sortBy?: string;
  order?: 'asc' | 'desc';
  minEngagement?: number;
  hasContact?: boolean;
}

export interface RefreshResponse {
  success: boolean;
  updated: number;
  failed: number;
  errors: string[];
}

export interface ContactInfoRequest {
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  xHandle?: string;
}

export interface ContactInfoResponse {
  success: boolean;
  contactInfo: {
    email: string | null;
    phone: string | null;
    linkedinUrl: string | null;
    xHandle: string | null;
  };
}

export interface ExportQuery {
  format?: 'csv' | 'json';
  companyIds?: string;
}
