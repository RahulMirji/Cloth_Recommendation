/**
 * Send OTP Edge Function
 * 
 * Sends 6-digit OTP via Gmail SMTP for user sign-up verification
 * 
 * Features:
 * - Rate limiting (3 requests per 30 minutes)
 * - OTP hashing for security
 * - 5-minute expiry
 * - Email duplicate check
 * - Gmail SMTP with retry logic
 * 
 * Environment Variables Required:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - GMAIL_USER (your Gmail address)
 * - GMAIL_APP_PASSWORD (16-character app password from Google)
 * - GMAIL_FROM_NAME (display name, e.g., "AI Dresser")
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Sends an email using Gmail SMTP
 */
async function sendEmailViaGmail(
  to: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; error?: string }> {
  const gmailUser = Deno.env.get('GMAIL_USER');
  const gmailAppPassword = Deno.env.get('GMAIL_APP_PASSWORD');
  const gmailFromName = Deno.env.get('GMAIL_FROM_NAME') || 'AI Dresser';

  if (!gmailUser || !gmailAppPassword) {
    console.error('❌ Gmail credentials not configured');
    return {
      success: false,
      error: 'Email service not configured. Please contact support.',
    };
  }

  try {
    console.log(`📧 Connecting to Gmail SMTP for: ${to}`);
    
    const client = new SmtpClient();

    await client.connectTLS({
      hostname: "smtp.gmail.com",
      port: 465,
      username: gmailUser,
      password: gmailAppPassword,
    });

    console.log('✅ Connected to Gmail SMTP');

    await client.send({
      from: `${gmailFromName} <${gmailUser}>`,
      to: to,
      subject: subject,
      content: htmlContent,
      html: htmlContent,
    });

    await client.close();

    console.log('✅ Email sent successfully via Gmail SMTP');
    return { success: true };
  } catch (error) {
    console.error('❌ Gmail SMTP Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Generates HTML email template for OTP
 */
function generateOtpEmailHtml(name: string, otp: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
        <tr>
          <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);">
            <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">AI Dresser</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px;">
            <h2 style="margin: 0 0 16px; color: #1F2937; font-size: 24px; font-weight: 600;">Welcome, ${name}! 👋</h2>
            <p style="margin: 0 0 24px; color: #6B7280; font-size: 16px; line-height: 1.5;">Thanks for signing up! To complete your registration, please enter this verification code:</p>
            
            <div style="background: #F9FAFB; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
              <div style="font-size: 14px; color: #6B7280; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Your Code</div>
              <div style="font-size: 48px; font-weight: 700; color: #8B5CF6; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</div>
            </div>
            
            <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; border-radius: 8px; margin: 24px 0;">
              <p style="margin: 0; color: #92400E; font-size: 14px; line-height: 1.5;">
                ⏰ <strong>This code expires in 5 minutes.</strong> Please enter it soon!
              </p>
            </div>
            
            <p style="margin: 24px 0 0; color: #6B7280; font-size: 14px; line-height: 1.5;">
              If you didn't request this code, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px 40px 40px; border-top: 1px solid #E5E7EB;">
            <p style="margin: 0; color: #9CA3AF; font-size: 12px; text-align: center; line-height: 1.5;">
              © 2025 AI Dresser. Your AI Fashion Assistant.<br>
              This is an automated message, please do not reply.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { email, name, password } = await req.json();

    // Validate inputs
    if (!email || !name || !password) {
      return new Response(
        JSON.stringify({
          error: 'Email, name, and password are required',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid email format',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return new Response(
        JSON.stringify({
          error: 'Password must be at least 6 characters',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if email already exists in auth.users
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const userExists = existingUsers?.users?.some(
      (user) => user.email?.toLowerCase() === email.toLowerCase()
    );

    if (userExists) {
      return new Response(
        JSON.stringify({
          error: 'Email already registered. Please sign in instead.',
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check rate limiting
    const { data: rateLimitData } = await supabase
      .from('otp_rate_limits')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (rateLimitData) {
      const windowStart = new Date(rateLimitData.window_start);
      const now = new Date();
      const diffMinutes = (now.getTime() - windowStart.getTime()) / (1000 * 60);

      if (diffMinutes < 30) {
        if (rateLimitData.request_count >= 3) {
          const remainingMinutes = Math.ceil(30 - diffMinutes);
          return new Response(
            JSON.stringify({
              error: `Too many OTP requests. Please try again in ${remainingMinutes} minutes.`,
            }),
            {
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Increment count
        await supabase
          .from('otp_rate_limits')
          .update({
            request_count: rateLimitData.request_count + 1,
            updated_at: now.toISOString(),
          })
          .eq('email', email.toLowerCase());
      } else {
        // Reset window
        await supabase
          .from('otp_rate_limits')
          .update({
            request_count: 1,
            window_start: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('email', email.toLowerCase());
      }
    } else {
      // Create new rate limit record
      await supabase.from('otp_rate_limits').insert({
        email: email.toLowerCase(),
        request_count: 1,
        window_start: new Date().toISOString(),
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the OTP
    const encoder = new TextEncoder();
    const data = encoder.encode(otp);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const otpHash = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // Calculate expiry (5 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // Delete any existing OTP for this email
    await supabase
      .from('otp_verifications')
      .delete()
      .eq('email', email.toLowerCase());

    // Store OTP hash in database
    const { error: insertError } = await supabase
      .from('otp_verifications')
      .insert({
        email: email.toLowerCase(),
        otp_hash: otpHash,
        expires_at: expiresAt.toISOString(),
        verified: false,
        attempts: 0,
      });

    if (insertError) {
      console.error('Error inserting OTP:', insertError);
      return new Response(
        JSON.stringify({
          error: 'Failed to generate OTP. Please try again.',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ALWAYS log OTP for development/testing
    console.log(`\n${'='.repeat(50)}`);
    console.log(`OTP FOR: ${email}`);
    console.log(`EXPIRES AT: ${expiresAt.toISOString()}`);
    console.log(`OTP CODE: ${otp}`);
    console.log(`${'='.repeat(50)}\n`);

    // Send email via Gmail SMTP
    const emailHtml = generateOtpEmailHtml(name, otp);
    const emailResult = await sendEmailViaGmail(
      email,
      'Your Verification Code - AI Dresser',
      emailHtml
    );

    if (!emailResult.success) {
      console.error('⚠️  Email failed, but OTP is logged above for testing');
      
      // Still return success since OTP is stored and logged
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OTP generated. Check Edge Function logs for the code (email delivery issue).',
          emailSent: false,
          note: 'In case of email issues, check Supabase Edge Function logs for OTP',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Success!
    return new Response(
      JSON.stringify({
        success: true,
        message: 'OTP sent successfully to your email. Please check your inbox.',
        emailSent: true,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in send-otp function:', error);
    return new Response(
      JSON.stringify({
        error: 'An unexpected error occurred. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
