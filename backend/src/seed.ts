/**
 * Database Seed Script
 * Populates the database with sample YC companies and launch posts
 * Run with: npm run seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleCompanies = [
  {
    name: 'Stripe',
    ycBatch: 'S10',
    fundraise: {
      amount: 20000000,
      announcementDate: new Date('2011-09-01'),
      source: 'YC_API',
    },
    launchPosts: [
      {
        platform: 'X',
        url: 'https://twitter.com/stripe/status/1234567890',
        postId: '1234567890',
        likes: 5420,
        dataSource: 'MANUAL',
      },
    ],
    contactInfo: {
      email: 'contact@stripe.com',
      linkedinUrl: 'https://linkedin.com/company/stripe',
      xHandle: '@stripe',
    },
  },
  {
    name: 'Airbnb',
    ycBatch: 'S09',
    fundraise: {
      amount: 25000000,
      announcementDate: new Date('2010-07-01'),
      source: 'YC_API',
    },
    launchPosts: [
      {
        platform: 'X',
        url: 'https://twitter.com/airbnb/status/9876543210',
        postId: '9876543210',
        likes: 8932,
        dataSource: 'MANUAL',
      },
      {
        platform: 'LINKEDIN',
        url: 'https://linkedin.com/feed/update/urn:li:activity:1234567890',
        postId: 'urn:li:activity:1234567890',
        likes: 3421,
        dataSource: 'MANUAL',
      },
    ],
    contactInfo: {
      email: 'press@airbnb.com',
      linkedinUrl: 'https://linkedin.com/company/airbnb',
      xHandle: '@airbnb',
    },
  },
  {
    name: 'Dropbox',
    ycBatch: 'S07',
    fundraise: {
      amount: 15000000,
      announcementDate: new Date('2008-03-01'),
      source: 'YC_API',
    },
    launchPosts: [
      {
        platform: 'X',
        url: 'https://twitter.com/dropbox/status/5555555555',
        postId: '5555555555',
        likes: 4123,
        dataSource: 'MANUAL',
      },
    ],
    contactInfo: {
      email: 'contact@dropbox.com',
      linkedinUrl: 'https://linkedin.com/company/dropbox',
      xHandle: '@dropbox',
    },
  },
  {
    name: 'Twitch',
    ycBatch: 'S11',
    fundraise: {
      amount: 20000000,
      announcementDate: new Date('2011-08-01'),
      source: 'YC_API',
    },
    launchPosts: [
      {
        platform: 'X',
        url: 'https://twitter.com/twitch/status/3333333333',
        postId: '3333333333',
        likes: 6789,
        dataSource: 'MANUAL',
      },
      {
        platform: 'LINKEDIN',
        url: 'https://linkedin.com/feed/update/urn:li:activity:9999999999',
        postId: 'urn:li:activity:9999999999',
        likes: 2456,
        dataSource: 'MANUAL',
      },
    ],
    contactInfo: {
      email: 'contact@twitch.tv',
      linkedinUrl: 'https://linkedin.com/company/twitch',
      xHandle: '@twitch',
    },
  },
  {
    name: 'Figma',
    ycBatch: 'S12',
    fundraise: {
      amount: 14000000,
      announcementDate: new Date('2012-06-01'),
      source: 'YC_API',
    },
    launchPosts: [
      {
        platform: 'X',
        url: 'https://twitter.com/figmadesign/status/7777777777',
        postId: '7777777777',
        likes: 5234,
        dataSource: 'MANUAL',
      },
    ],
    contactInfo: {
      email: 'hello@figma.com',
      linkedinUrl: 'https://linkedin.com/company/figma',
      xHandle: '@figmadesign',
    },
  },
  {
    name: 'Notion',
    ycBatch: 'S16',
    fundraise: {
      amount: 10000000,
      announcementDate: new Date('2016-04-01'),
      source: 'YC_API',
    },
    launchPosts: [
      {
        platform: 'X',
        url: 'https://twitter.com/NotionHQ/status/2222222222',
        postId: '2222222222',
        likes: 7654,
        dataSource: 'MANUAL',
      },
      {
        platform: 'LINKEDIN',
        url: 'https://linkedin.com/feed/update/urn:li:activity:4444444444',
        postId: 'urn:li:activity:4444444444',
        likes: 3890,
        dataSource: 'MANUAL',
      },
    ],
    contactInfo: {
      email: 'hello@notion.so',
      linkedinUrl: 'https://linkedin.com/company/notion-labs-inc',
      xHandle: '@NotionHQ',
    },
  },
];

async function main() {
  console.log('🌱 Starting database seed...');

  try {
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await prisma.contactInfo.deleteMany({});
    await prisma.launchPost.deleteMany({});
    await prisma.fundraise.deleteMany({});
    await prisma.company.deleteMany({});

    // Seed companies
    console.log('📝 Creating companies...');
    for (const companyData of sampleCompanies) {
      const { fundraise, launchPosts, contactInfo, ...company } = companyData;

      const createdCompany = await prisma.company.create({
        data: {
          ...company,
          fundraise: fundraise
            ? {
                create: fundraise,
              }
            : undefined,
          launchPosts: launchPosts
            ? {
                create: launchPosts,
              }
            : undefined,
          contactInfo: contactInfo
            ? {
                create: contactInfo,
              }
            : undefined,
        },
        include: {
          fundraise: true,
          launchPosts: true,
          contactInfo: true,
        },
      });

      console.log(`✅ Created: ${createdCompany.name}`);
    }

    console.log('✨ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
