/**
 * Reset User to Free Tier Script
 * 
 * Usage: node backend/scripts/resetUserToFree.js <user_id>
 * Example: node backend/scripts/resetUserToFree.js 1aa1adb1-b15e-4554-ba85-13c85a3202b1
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

// Get user ID from command line
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Error: User ID is required');
  console.log('Usage: node backend/scripts/resetUserToFree.js <user_id>');
  console.log('Example: node backend/scripts/resetUserToFree.js 1aa1adb1-b15e-4554-ba85-13c85a3202b1');
  process.exit(1);
}

// Initialize Supabase with service role key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetUserToFree() {
  try {
    console.log('🔄 Resetting user to free tier...');
    console.log('User ID:', userId);

    // Update feature_credits to free tier
    const { data, error} = await supabase
      .from('feature_credits')
      .update({
        credits_remaining: 5,
        plan_status: 'free',
        credits_cap: 5,
        expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select();

    if (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }

    console.log('✅ User reset to free tier successfully!');
    console.log('Updated records:', data.length);
    console.log('');
    console.log('📊 Updated credits:');
    data.forEach((record) => {
      console.log(`  - ${record.feature}: ${record.credits_remaining} credits (${record.plan_status})`);
    });

    // Verify the changes
    const { data: verifyData } = await supabase
      .from('feature_credits')
      .select('*')
      .eq('user_id', userId);

    console.log('');
    console.log('✅ Current status:');
    verifyData.forEach((record) => {
      console.log(`  - ${record.feature}: ${record.credits_remaining} credits, status: ${record.plan_status}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetUserToFree();
