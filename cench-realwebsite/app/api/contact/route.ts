import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { addLeadToSheet, draftEmail } from '@/lib/google';
import { getEmailContent } from '@/lib/email-templates';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { firstName, lastName, email, businessName, businessType, message, currentPos, painPoints, website } = body;

        // Simple honeypot check
        if (website) {
            return NextResponse.json({ message: 'Bot detected' }, { status: 400 });
        }

        const lead = {
            firstName,
            lastName,
            email,
            businessName,
            businessType,
            currentPos,
            painPoints,
            source: 'FORM', // Distinguish form signup from manual signup
        };

        // 1. Add to Google Sheet
        try {
            await addLeadToSheet(lead);
        } catch (err) {
            console.error('Failed to add lead to sheet:', err);
            // Non-blocking error: we still want to send the confirmation email
        }

        // 2. Draft Initial Genuinen Email in Gmail (if connected)
        try {
            const initialEmail = await getEmailContent('INITIAL', lead);
            if (initialEmail) {
                await draftEmail(email, initialEmail.subject, initialEmail.html);
            }
        } catch (err) {
             console.error('Failed to draft Gmail email:', err);
             // Non-blocking error
        }

        // 3. Send Confirmation Email to Lead (via Resend)
        try {
            const confirmation = await getEmailContent('CONFIRMATION', lead);
            if (confirmation) {
                await resend.emails.send({
                    from: 'Swftly <onboarding@resend.dev>',
                    to: [email],
                    subject: confirmation.subject,
                    html: confirmation.html,
                });
            }
        } catch (err) {
            console.error('Failed to send confirmation email:', err);
        }

        // Send notification to admin (original logic)
        const fullName = lastName ? `${firstName} ${lastName}` : firstName;
        const subject = businessName ? `New Waitlist: ${businessName} (${fullName})` : `New Waitlist: ${fullName}`;
        await resend.emails.send({
            from: 'Swftly Admin <onboarding@resend.dev>',
            to: ['drlny11d@gmail.com'],
            subject: subject,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #2c19fc; border-bottom: 2px solid #2c19fc; padding-bottom: 10px;">New Waitlist Signup</h2>
                    <p><strong>Name:</strong> ${fullName}</p>
                    <p><strong>Business Name:</strong> ${businessName || 'Not specified'}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Business Type:</strong> ${businessType || 'Not specified'}</p>
                    <p><strong>Current POS:</strong> ${currentPos || 'Not specified'}</p>
                    <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
                        <p><strong>Pain Points & Improvements:</strong></p>
                        <p>${painPoints || 'None provided.'}</p>
                    </div>
                </div>
            `,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
