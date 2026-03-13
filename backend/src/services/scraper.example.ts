/**
 * Example usage of the Scraping Service
 * 
 * This file demonstrates how to use the scrapeXPost and scrapeLinkedInPost functions
 * to fetch engagement metrics from social media posts.
 */

import { scrapeXPost, scrapeLinkedInPost } from './scraper.js';

/**
 * Example: Scraping an X (Twitter) post
 */
async function exampleScrapeXPost() {
  console.log('Scraping X post...');
  
  // Example X post ID
  const postId = '1234567890123456789';
  
  const result = await scrapeXPost(postId);
  
  if (result.success) {
    console.log(`✓ Successfully scraped X post`);
    console.log(`  Likes: ${result.likes}`);
    console.log(`  Scraped at: ${result.scrapedAt.toISOString()}`);
  } else {
    console.log(`✗ Failed to scrape X post`);
    console.log(`  Error: ${result.error}`);
  }
  
  return result;
}

/**
 * Example: Scraping a LinkedIn post
 */
async function exampleScrapeLinkedInPost() {
  console.log('Scraping LinkedIn post...');
  
  // Example LinkedIn post ID
  const postId = '7123456789012345678';
  
  const result = await scrapeLinkedInPost(postId);
  
  if (result.success) {
    console.log(`✓ Successfully scraped LinkedIn post`);
    console.log(`  Likes: ${result.likes}`);
    console.log(`  Scraped at: ${result.scrapedAt.toISOString()}`);
  } else {
    console.log(`✗ Failed to scrape LinkedIn post`);
    console.log(`  Error: ${result.error}`);
  }
  
  return result;
}

/**
 * Example: Scraping multiple posts
 */
async function exampleScrapeMultiplePosts() {
  console.log('Scraping multiple posts...\n');
  
  const posts = [
    { platform: 'x', postId: '1234567890123456789' },
    { platform: 'linkedin', postId: '7123456789012345678' },
  ];
  
  const results = await Promise.all(
    posts.map(async (post) => {
      if (post.platform === 'x') {
        return { platform: 'x', result: await scrapeXPost(post.postId) };
      } else {
        return { platform: 'linkedin', result: await scrapeLinkedInPost(post.postId) };
      }
    })
  );
  
  console.log('\nResults:');
  results.forEach(({ platform, result }) => {
    console.log(`\n${platform.toUpperCase()}:`);
    console.log(`  Success: ${result.success}`);
    console.log(`  Likes: ${result.likes}`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  });
  
  return results;
}

/**
 * Run examples
 */
async function runExamples() {
  console.log('=== Scraping Service Examples ===\n');
  
  try {
    await exampleScrapeXPost();
    console.log('\n---\n');
    
    await exampleScrapeLinkedInPost();
    console.log('\n---\n');
    
    await exampleScrapeMultiplePosts();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run examples
// runExamples();

export {
  exampleScrapeXPost,
  exampleScrapeLinkedInPost,
  exampleScrapeMultiplePosts,
};
