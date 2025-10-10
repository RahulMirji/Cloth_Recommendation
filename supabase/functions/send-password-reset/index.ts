/**
 * Send Password Reset Edge Function
 * 
 * Sends password reset links via Gmail SMTP with secure tokens
 * 
 * Features:
 * - Rate limiting (3 requests per hour per email)
 * - Secure token generation (cryptographically random)
 * - Token hashing for database storage
 * - 15-minute expiry
 * - Beautiful branded email template
 * - Gmail SMTP with STARTTLS
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Generates a cryptographically secure random token
 */
function generateSecureToken(): string {
  const array = new Uint8Array(32); // 256 bits
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hashes a token using SHA-256
 */
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Sends an email using Gmail SMTP via STARTTLS (port 587)
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

  let conn: Deno.Conn | null = null;
  let tlsConn: Deno.TlsConn | null = null;

  try {
    console.log(`📧 Connecting to Gmail SMTP (port 587) for: ${to}`);
    
    conn = await Deno.connect({
      hostname: "smtp.gmail.com",
      port: 587,
    });

    console.log('✅ Connected to Gmail SMTP, starting STARTTLS...');

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    async function readResponse(connection: Deno.Conn | Deno.TlsConn): Promise<string> {
      const buffer = new Uint8Array(4096);
      const n = await connection.read(buffer);
      if (n === null) throw new Error('Connection closed');
      const response = decoder.decode(buffer.subarray(0, n));
      console.log('←', response.trim());
      return response;
    }

    async function sendCommand(connection: Deno.Conn | Deno.TlsConn, command: string): Promise<string> {
      console.log('→', command);
      await connection.write(encoder.encode(command + '\r\n'));
      return await readResponse(connection);
    }

    await readResponse(conn);
    await sendCommand(conn, `EHLO gmail.com`);
    await sendCommand(conn, `STARTTLS`);
    
    tlsConn = await Deno.startTls(conn, { hostname: "smtp.gmail.com" });
    console.log('✅ TLS upgrade successful');
    
    await sendCommand(tlsConn, `EHLO gmail.com`);
    await sendCommand(tlsConn, `AUTH LOGIN`);
    await sendCommand(tlsConn, btoa(gmailUser));
    await sendCommand(tlsConn, btoa(gmailAppPassword));
    
    console.log('✅ Authenticated with Gmail');
    
    await sendCommand(tlsConn, `MAIL FROM:<${gmailUser}>`);
    await sendCommand(tlsConn, `RCPT TO:<${to}>`);
    await sendCommand(tlsConn, `DATA`);
    
    const boundary = `----=_Part_${Date.now()}`;
    const emailMessage = [
      `From: ${gmailFromName} <${gmailUser}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      '',
      'Please view this email in an HTML-capable email client.',
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      '',
      htmlContent,
      '',
      `--${boundary}--`,
    ].join('\r\n');

    await tlsConn.write(encoder.encode(emailMessage + '\r\n.\r\n'));
    await readResponse(tlsConn);
    await sendCommand(tlsConn, 'QUIT');

    console.log('✅ Email sent successfully via Gmail SMTP');
    return { success: true };
  } catch (error) {
    console.error('❌ Gmail SMTP Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  } finally {
    if (tlsConn) {
      try { tlsConn.close(); } catch (e) { /* Ignore */ }
    } else if (conn) {
      try { conn.close(); } catch (e) { /* Ignore */ }
    }
  }
}

/**
 * Generates HTML email template for password reset
 */
function generatePasswordResetEmailHtml(name: string, resetUrl: string): string {
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
            <h2 style="margin: 0 0 16px; color: #1F2937; font-size: 24px; font-weight: 600;">Reset Your Password 🔐</h2>
            <p style="margin: 0 0 24px; color: #6B7280; font-size: 16px; line-height: 1.5;">
              Hi ${name},<br><br>
              We received a request to reset your password. Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
                Reset Password
              </a>
            </div>
            
            <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; border-radius: 8px; margin: 24px 0;">
              <p style="margin: 0; color: #92400E; font-size: 14px; line-height: 1.5;">
                ⏰ <strong>This link expires in 15 minutes.</strong> Please use it soon!
              </p>
            </div>
            
            <p style="margin: 24px 0 0; color: #6B7280; font-size: 14px; line-height: 1.5;">
              If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
            </p>
            
            <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 24px 0;">
              <p style="margin: 0 0 8px; color: #6B7280; font-size: 12px;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 0; color: #8B5CF6; font-size: 12px; word-break: break-all;">
                ${resetUrl}
              </p>
            </div>
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email } = await req.json();

    // Validate email
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const user = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      // Security: Don't reveal if email exists or not
      return new Response(
        JSON.stringify({
          success: true,
          message: 'If an account with that email exists, we have sent a password reset link.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limiting
    const { data: rateLimitData } = await supabase
      .from('password_reset_rate_limits')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (rateLimitData) {
      const windowStart = new Date(rateLimitData.window_start);
      const now = new Date();
      const diffMinutes = (now.getTime() - windowStart.getTime()) / (1000 * 60);

      if (diffMinutes < 60) {
        if (rateLimitData.request_count >= 3) {
          const remainingMinutes = Math.ceil(60 - diffMinutes);
          return new Response(
            JSON.stringify({
              error: `Too many password reset requests. Please try again in ${remainingMinutes} minutes.`,
            }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await supabase
          .from('password_reset_rate_limits')
          .update({
            request_count: rateLimitData.request_count + 1,
            updated_at: now.toISOString(),
          })
          .eq('email', email.toLowerCase());
      } else {
        await supabase
          .from('password_reset_rate_limits')
          .update({
            request_count: 1,
            window_start: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('email', email.toLowerCase());
      }
    } else {
      await supabase.from('password_reset_rate_limits').insert({
        email: email.toLowerCase(),
        request_count: 1,
        window_start: new Date().toISOString(),
      });
    }

    // Generate secure token
    const token = generateSecureToken();
    const tokenHash = await hashToken(token);

    // Calculate expiry (15 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Delete any existing unused tokens for this email
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('email', email.toLowerCase())
      .eq('used', false);

    // Store token hash
    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({
        email: email.toLowerCase(),
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        used: false,
      });

    if (insertError) {
      console.error('Error inserting reset token:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate reset link. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build reset URL - Use web URL for better compatibility with Expo Go
    // Priority: 1. Environment variable, 2. Local development URL
    // In production, set WEB_BASE_URL environment variable in Supabase
    const webBaseUrl = Deno.env.get('WEB_BASE_URL') || 'http://10.65.132.140:8081';
    const resetUrl = `${webBaseUrl}/reset-password-redirect?token=${token}&email=${encodeURIComponent(email)}`;
    
    // Alternative deep link (for development builds with custom scheme)
    const deepLink = `aidryer://reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    // Log for development
    console.log(`\n${'='.repeat(60)}`);
    console.log(`PASSWORD RESET FOR: ${email}`);
    console.log(`EXPIRES AT: ${expiresAt.toISOString()}`);
    console.log(`WEB RESET URL: ${resetUrl}`);
    console.log(`DEEP LINK (for dev builds): ${deepLink}`);
    console.log(`${'='.repeat(60)}\n`);

    // Get user name from metadata
    const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'User';

    // Send email
    const emailHtml = generatePasswordResetEmailHtml(userName, resetUrl);
    const emailResult = await sendEmailViaGmail(
      email,
      'Reset Your Password - AI Dresser',
      emailHtml
    );

    if (!emailResult.success) {
      console.error('⚠️  Email failed, but reset link is logged above for testing');
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Reset link generated. Check Edge Function logs (email delivery issue).',
          emailSent: false,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link.',
        emailSent: true,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-password-reset function:', error);
    return new Response(
      JSON.stringify({
        error: 'An unexpected error occurred. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
