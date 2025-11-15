import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for admin access
    );

    // Calculate dates
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const next7Date = new Date();
    next7Date.setDate(today.getDate() + 7);
    const next7Str = next7Date.toISOString().split('T')[0];

    // Fetch policies due soon
    const { data: policies, error } = await supabase
      .from('policies')
      .select(`
        id,
        plan_name,
        policy_no,
        due_date,
        clients ( name, phone, email )
      `)
      .eq('status', 'Active')
      .gte('due_date', todayStr)
      .lte('due_date', next7Str)
      .order('due_date', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      count: policies?.length || 0,
      policies,
    });

  } catch (error) {
    console.error('Renewal check error:', error);
    return NextResponse.json(
      { error: 'Failed to check renewals' },
      { status: 500 }
    );
  }
}