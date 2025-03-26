import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { Memory } from '@/lib/supabase/types';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Get one thought, one reasoning, and one report for this activity
    const { data: activities, error } = await supabase
      .from('memories')
      .select('*')
      .eq('activity_id', id)
      .in('type', ['think', 'reasoning', 'report'])
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    if (!activities || activities.length === 0) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    // Get the action if it exists
    const { data: action } = await supabase
      .from('memories')
      .select('*')
      .eq('activity_id', id)
      .eq('type', 'action')
      .single();

    // Group activities by type and ensure uniqueness
    const thoughtProcess = activities
      .filter(a => a.type === 'think' || a.type === 'reasoning')
      .reduce((acc: Memory[], curr: Memory) => {
        // Only add if we don't have this type yet
        if (!acc.find(a => a.type === curr.type)) {
          acc.push(curr);
        }
        return acc;
      }, []);

    const report = activities.find(a => a.type === 'report');

    return NextResponse.json({
      data: {
        thoughtProcess,
        report,
        action,
      },
    });
  } catch (error) {
    console.error('Error in run API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch run' },
      { status: 500 },
    );
  }
} 