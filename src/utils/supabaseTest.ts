import { supabase } from '@/integrations/supabase/client';

export async function testSupabaseConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    console.log('📍 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('🔑 Supabase Key:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? '✅ Present' : '❌ Missing');
    
    // Test 1: Check authentication status
    const { data: authData, error: authError } = await supabase.auth.getSession();
    console.log('🔐 Auth status:', authData.session ? 'Logged in' : 'Not logged in');
    
    // Test 2: Try to access a common table (users)
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log('⚠️ Supabase query error:', error.message);
      console.log('📊 Error details:', error);
      
      // Check if it's just an empty table or a real connection issue
      if (error.message.includes('Could not find the table') || error.message.includes('schema cache')) {
        console.log('📋 Tables not created yet - connection is working!');
        return { 
          success: true, 
          error: 'Tables not created yet', 
          type: 'tables_not_created',
          message: '✅ Connected to Supabase - Ready to create tables'
        };
      } else if (error.message.includes('permission denied') || error.message.includes('RLS')) {
        console.log('🔒 RLS blocking access - this is normal for empty tables');
        return { 
          success: true, 
          error: 'RLS active (normal)', 
          type: 'rls_active',
          message: '✅ Connected to Supabase - RLS is active'
        };
      }
      
      return { 
        success: false, 
        error: error.message, 
        type: 'connection_error',
        message: '❌ Connection error'
      };
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('📊 Data returned:', data);
    return { 
      success: true, 
      data, 
      type: 'success',
      message: '✅ Connected to Supabase - Data available'
    };
    
  } catch (err) {
    console.error('💥 Supabase connection failed:', err);
    return { 
      success: false, 
      error: err, 
      type: 'exception',
      message: '❌ Connection failed'
    };
  }
}
