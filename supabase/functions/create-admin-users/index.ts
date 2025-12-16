import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const results = [];

    // Create superadmin user
    const { data: superadminUser, error: superadminError } = await supabaseAdmin.auth.admin.createUser({
      email: 'felipe.coelho1@hotmail.com',
      password: 'Allura@2025',
      email_confirm: true,
      user_metadata: { full_name: 'Felipe Coelho' }
    });

    if (superadminError && !superadminError.message.includes('already been registered')) {
      console.error('Error creating superadmin:', superadminError);
      results.push({ email: 'felipe.coelho1@hotmail.com', status: 'error', message: superadminError.message });
    } else {
      // Get user ID (either from creation or fetch existing)
      let userId = superadminUser?.user?.id;
      
      if (!userId) {
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === 'felipe.coelho1@hotmail.com');
        userId = existingUser?.id;
      }

      if (userId) {
        // Assign superadmin role
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .upsert({ user_id: userId, role: 'superadmin' }, { onConflict: 'user_id,role' });
        
        if (roleError) {
          console.error('Error assigning superadmin role:', roleError);
        }
        
        results.push({ email: 'felipe.coelho1@hotmail.com', status: 'success', role: 'superadmin', userId });
      }
    }

    // Create admin user
    const { data: adminUser, error: adminError } = await supabaseAdmin.auth.admin.createUser({
      email: 'comallura@gmail.com',
      password: 'Allura@2025',
      email_confirm: true,
      user_metadata: { full_name: 'Andrey - Allura' }
    });

    if (adminError && !adminError.message.includes('already been registered')) {
      console.error('Error creating admin:', adminError);
      results.push({ email: 'comallura@gmail.com', status: 'error', message: adminError.message });
    } else {
      let userId = adminUser?.user?.id;
      
      if (!userId) {
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === 'comallura@gmail.com');
        userId = existingUser?.id;
      }

      if (userId) {
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' });
        
        if (roleError) {
          console.error('Error assigning admin role:', roleError);
        }
        
        results.push({ email: 'comallura@gmail.com', status: 'success', role: 'admin', userId });
      }
    }

    console.log('Admin users created:', results);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in create-admin-users:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
