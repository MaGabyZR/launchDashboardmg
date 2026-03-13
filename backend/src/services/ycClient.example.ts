/**
 * Example usage of YC API Client Service
 * 
 * This file demonstrates how to use the searchYCCompany function
 * to fetch fundraise data from the YCombinator API.
 */

import { searchYCCompany } from './ycClient.js';

/**
 * Example 1: Search for a known YC company
 */
async function example1() {
  console.log('Example 1: Search for a known YC company');
  console.log('==========================================\n');
  
  const result = await searchYCCompany('Airbnb');
  
  if (result) {
    console.log('Company found:');
    console.log(`  Name: ${result.name}`);
    console.log(`  Batch: ${result.batch}`);
    console.log(`  Amount Raised: $${result.amountRaised.toLocaleString()}`);
    console.log(`  Announcement Date: ${result.announcementDate}`);
  } else {
    console.log('Company not found in YC database');
  }
  
  console.log('\n');
}

/**
 * Example 2: Search with company name variations
 */
async function example2() {
  console.log('Example 2: Search with company name variations');
  console.log('===============================================\n');
  
  // Search with different variations of the same company
  const variations = [
    'Stripe Inc',
    'Stripe',
    'Stripe Corporation'
  ];
  
  for (const name of variations) {
    console.log(`Searching for: "${name}"`);
    const result = await searchYCCompany(name);
    
    if (result) {
      console.log(`  ✓ Found: ${result.name} (${result.batch})`);
    } else {
      console.log(`  ✗ Not found`);
    }
  }
  
  console.log('\n');
}

/**
 * Example 3: Handle company not in YC database
 */
async function example3() {
  console.log('Example 3: Handle company not in YC database');
  console.log('=============================================\n');
  
  const result = await searchYCCompany('Random Non-YC Company XYZ');
  
  if (result) {
    console.log('Company found (unexpected):');
    console.log(`  Name: ${result.name}`);
  } else {
    console.log('Company not found in YC database (expected)');
    console.log('Fallback: Allow manual entry of fundraise data');
  }
  
  console.log('\n');
}

/**
 * Example 4: Demonstrate caching behavior
 */
async function example4() {
  console.log('Example 4: Demonstrate caching behavior');
  console.log('========================================\n');
  
  const companyName = 'Dropbox';
  
  console.log('First request (will hit API):');
  console.time('First request');
  const result1 = await searchYCCompany(companyName);
  console.timeEnd('First request');
  console.log(`  Result: ${result1?.name || 'Not found'}`);
  
  console.log('\nSecond request (will use cache):');
  console.time('Second request');
  const result2 = await searchYCCompany(companyName);
  console.timeEnd('Second request');
  console.log(`  Result: ${result2?.name || 'Not found'}`);
  
  console.log('\n');
}

/**
 * Example 5: Integration with launch post workflow
 */
async function example5() {
  console.log('Example 5: Integration with launch post workflow');
  console.log('=================================================\n');
  
  // Simulated workflow when user adds a launch post
  const companyName = 'Coinbase';
  
  console.log(`User added launch post for: "${companyName}"`);
  console.log('Checking YC database for fundraise data...\n');
  
  const ycData = await searchYCCompany(companyName);
  
  if (ycData) {
    console.log('✓ YC data found - will be stored with source: "yc_api"');
    console.log(`  Company: ${ycData.name}`);
    console.log(`  Batch: ${ycData.batch}`);
    console.log(`  Amount: $${ycData.amountRaised.toLocaleString()}`);
    console.log(`  Date: ${ycData.announcementDate}`);
  } else {
    console.log('✗ YC data not found - user can manually enter fundraise data');
    console.log('  Manual entry will be stored with source: "manual"');
  }
  
  console.log('\n');
}

/**
 * Run all examples
 */
async function runExamples() {
  console.log('YC API Client Service - Usage Examples');
  console.log('======================================\n\n');
  
  try {
    await example1();
    await example2();
    await example3();
    await example4();
    await example5();
    
    console.log('All examples completed successfully!');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run examples
// runExamples();

export { example1, example2, example3, example4, example5, runExamples };
