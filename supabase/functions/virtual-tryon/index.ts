/**
 * Virtual Try-On Edge Function (FIXED - No google-auth-library)
 * 
 * Uses Google Cloud Vertex AI Virtual Try-On API with native JWT authentication
 * to avoid Deno compatibility issues with Node.js libraries.
 * 
 * Flow:
 * 1. Receive base64 images from React Native app
 * 2. Create JWT manually using native crypto
 * 3. Exchange JWT for access token
 * 4. Call Vertex AI Virtual Try-On API with PRESERVE_PERSON parameter
 * 5. Upload generated image to Supabase Storage
 * 6. Return public URL to client
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Base64URL encode (RFC 4648) - handles both strings and Uint8Arrays
 */
function base64UrlEncode(input: string | Uint8Array): string {
  let base64: string;
  
  if (typeof input === 'string') {
    // For strings (header and payload)
    base64 = btoa(input);
  } else {
    // For binary data (signature)
    const binary = String.fromCharCode(...input);
    base64 = btoa(binary);
  }
  
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Create JWT token for Google Cloud authentication
 */
async function createGoogleJWT(serviceAccount: any): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
  };

  // Encode header and payload
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // Import private key
  const privateKeyPem = serviceAccount.private_key.replace(/\\n/g, '\n');
  const pemKey = privateKeyPem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemKey), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // Sign with private key
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = base64UrlEncode(new Uint8Array(signature));

  return `${signatureInput}.${encodedSignature}`;
}

/**
 * Exchange JWT for Google OAuth access token
 */
async function getGoogleAccessToken(serviceAccount: any): Promise<string> {
  console.log('🔐 Creating JWT...');
  const jwt = await createGoogleJWT(serviceAccount);
  console.log('✅ JWT created');

  console.log('🔄 Exchanging JWT for access token...');
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Token exchange failed:', errorText);
    throw new Error(`Failed to get access token: ${errorText}`);
  }

  const data = await response.json();
  console.log('✅ Access token obtained');
  return data.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 VERTEX AI VIRTUAL TRY-ON - STARTED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const { userImageBase64, outfitImageBase64 } = await req.json();

    if (!userImageBase64 || !outfitImageBase64) {
      throw new Error('Missing required images');
    }

    console.log('✅ Request validated');
    console.log('📊 Payload sizes:', {
      userImage: `${(userImageBase64.length / 1024).toFixed(2)} KB`,
      outfitImage: `${(outfitImageBase64.length / 1024).toFixed(2)} KB`,
    });

    // Load environment variables
    const serviceAccountJson = Deno.env.get('VERTEX_API');
    const projectId = Deno.env.get('GOOGLE_PROJECT_ID') || 'vertex-ai-api-478015';
    const location = Deno.env.get('GOOGLE_LOCATION') || 'us-central1';

    if (!serviceAccountJson) {
      throw new Error('VERTEX_API secret not configured');
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    console.log('📍 Project:', projectId);
    console.log('🌍 Location:', location);
    console.log('📧 Service account:', serviceAccount.client_email);

    // Get access token
    const accessToken = await getGoogleAccessToken(serviceAccount);

    // Call Vertex AI Virtual Try-On API
    const vertexEndpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/virtual-try-on-preview-08-04:predict`;
    
    console.log('📡 Calling Vertex AI API...');
    console.log('🔗 Endpoint:', vertexEndpoint);

    const vertexResponse = await fetch(vertexEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [
          {
            personImage: {
              image: {
                bytesBase64Encoded: userImageBase64,
              },
            },
            productImages: [
              {
                image: {
                  bytesBase64Encoded: outfitImageBase64,
                },
              },
            ],
          },
        ],
        parameters: {
          sampleCount: 1,
          addWatermark: false,
          personGeneration: 'PRESERVE_PERSON',
          safetySetting: 'BLOCK_ONLY_HIGH',
        },
      }),
    });

    console.log('📊 Vertex AI status:', vertexResponse.status);

    if (!vertexResponse.ok) {
      const errorText = await vertexResponse.text();
      console.error('❌ Vertex AI error:', errorText);
      throw new Error(`Vertex AI API error: ${vertexResponse.status} - ${errorText}`);
    }

    const vertexData = await vertexResponse.json();
    console.log('✅ Vertex AI response received');

    if (!vertexData.predictions || vertexData.predictions.length === 0) {
      throw new Error('No predictions in Vertex AI response');
    }

    const generatedImageBase64 = vertexData.predictions[0].bytesBase64Encoded;
    console.log('✅ Generated image extracted:', `${(generatedImageBase64.length / 1024).toFixed(2)} KB`);

    // Upload to Supabase Storage
    console.log('💾 Uploading to Supabase Storage...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Convert base64 to bytes
    const binaryString = atob(generatedImageBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const fileName = `tryon_${Date.now()}_${crypto.randomUUID()}.png`;
    const filePath = `virtual-tryon/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('generated-images')
      .upload(filePath, bytes, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ Storage error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    console.log('✅ Image uploaded');

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('generated-images')
      .getPublicUrl(filePath);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ VIRTUAL TRY-ON COMPLETED SUCCESSFULLY');
    console.log('🖼️ URL:', urlData.publicUrl);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: urlData.publicUrl,
        fileName,
        filePath,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ ERROR:', error.message);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
