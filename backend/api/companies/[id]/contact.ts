import type { Request, Response } from 'express';
import { prisma } from '../../../src/lib/db.js';
import type { ContactInfoRequest, ContactInfoResponse } from '../../../src/types/index.js';

/**
 * Validate email format
 * @param email Email address to validate
 * @returns true if valid email format, false otherwise
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format phone number to a standard format
 * Removes all non-digit characters and formats as (XXX) XXX-XXXX for 10-digit numbers
 * @param phone Phone number to format
 * @returns Formatted phone number or original if not 10 digits
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // If it's a 10-digit number, format as (XXX) XXX-XXXX
  if (digitsOnly.length === 10) {
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
  }
  
  // If it's 11 digits starting with 1, format as +1 (XXX) XXX-XXXX
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `+1 (${digitsOnly.slice(1, 4)}) ${digitsOnly.slice(4, 7)}-${digitsOnly.slice(7)}`;
  }
  
  // Return original if not a standard format
  return phone;
}

/**
 * POST /api/companies/:id/contact
 * Add or update contact information for a company
 * 
 * Request Body:
 * - email?: string
 * - phone?: string
 * - linkedinUrl?: string
 * - xHandle?: string
 * 
 * Response:
 * - success: boolean
 * - contactInfo: ContactInfo object with all fields
 */
export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id: companyId } = req.query;
    const { email, phone, linkedinUrl, xHandle } = req.body as ContactInfoRequest;

    // Validate company ID
    if (!companyId || typeof companyId !== 'string') {
      return res.status(400).json({ error: 'Invalid company ID' });
    }

    // Validate that at least one field is provided
    if (!email && !phone && !linkedinUrl && !xHandle) {
      return res.status(400).json({ error: 'At least one contact field must be provided' });
    }

    // Validate email if provided
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Format phone number if provided
    const formattedPhone = phone ? formatPhoneNumber(phone) : undefined;

    // Create or update contact info
    const contactInfo = await prisma.contactInfo.upsert({
      where: { companyId },
      update: {
        email: email || undefined,
        phone: formattedPhone || undefined,
        linkedinUrl: linkedinUrl || undefined,
        xHandle: xHandle || undefined,
      },
      create: {
        companyId,
        email: email || null,
        phone: formattedPhone || null,
        linkedinUrl: linkedinUrl || null,
        xHandle: xHandle || null,
      },
    });

    const response: ContactInfoResponse = {
      success: true,
      contactInfo: {
        email: contactInfo.email,
        phone: contactInfo.phone,
        linkedinUrl: contactInfo.linkedinUrl,
        xHandle: contactInfo.xHandle,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating contact info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
