'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';

type PublicSeasonData = {
  team: { name: string; slug: string; logo_url: string | null };
  season: { name: string; year: number; season_type: string; fee_amount: number };
  players: { id: string; name: string; jersey_number: number | null; player_role: string; designation: string | null; is_active: boolean }[];
  expenses: { id: string; category: string; description: string; amount: number; expense_date: string }[];
  fees: { player_id: string; amount_paid: number; paid_date: string | null }[];
  sponsorships: { sponsor_name: string; amount: number; sponsored_date: string; notes: string | null }[];
};

export function DuesPageClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const token = searchParams.get('token');

  const [data, setData] = useState<PublicSeasonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('No share token provided.');
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError('Not configured.');
      setLoading(false);
      return;
    }

    supabase.rpc('get_public_season_data', { token })
      .then(({ data: result, error: err }: { data: unknown; error: unknown }) => {
        if (err || !result || (result as Record<string, unknown>).error) {
          setError('Season not found or link has expired.');
        } else {
          setData(result as PublicSeasonData);
        }
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FBBF24] border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-4 text-4xl">🏏</div>
          <h1 className="mb-2 text-[20px] font-bold text-[#E5E7EB]">Team Dues</h1>
          <p className="text-[#9CA3AF]">{error || 'Something went wrong.'}</p>
        </div>
      </div>
    );
  }

  const { team, season, players, expenses, fees, sponsorships } = data;
  const feeAmount = season.fee_amount;
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalFees = fees.reduce((sum, f) => sum + Number(f.amount_paid), 0);
  const totalSponsors = sponsorships.reduce((sum, s) => sum + Number(s.amount), 0);
  const poolBalance = totalFees + totalSponsors - totalExpenses;

  return (
    <div className="min-h-screen bg-[#0F0F1A] px-4 py-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FBBF24] to-[#F87171] text-3xl mb-3">
            {team.logo_url ? <img src={team.logo_url} alt="" className="h-12 w-12 rounded-xl" /> : '🏏'}
          </div>
          <h1 className="text-[22px] font-bold text-[#E5E7EB]">{team.name}</h1>
          <p className="text-[14px] text-[#9CA3AF]">{season.name} {season.year} — Team Dues</p>
        </div>

        <div className="mb-6 rounded-2xl border border-[#3A3F6B] bg-[#1C1F3F] p-5 text-center">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-1">Pool Balance</p>
          <p className={`text-[32px] font-extrabold ${poolBalance >= 0 ? 'text-[#4ADE80]' : 'text-[#F87171]'}`}>
            {poolBalance < 0 ? '-' : ''}${Math.abs(poolBalance).toFixed(2).replace(/\.00$/, '')}
          </p>
          <div className="mt-3 flex justify-center gap-6 text-[12px] text-[#9CA3AF]">
            <span>Fees: <span className="text-[#4ADE80] font-medium">${totalFees}</span></span>
            <span>Sponsors: <span className="text-[#60A5FA] font-medium">${totalSponsors}</span></span>
            <span>Spent: <span className="text-[#F87171] font-medium">${totalExpenses}</span></span>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="mb-3 text-[14px] font-semibold text-[#E5E7EB]">Fee Status (${feeAmount}/player)</h2>
          <div className="space-y-2">
            {players.filter((p) => p.is_active).map((player) => {
              const fee = fees.find((f) => f.player_id === player.id);
              const paid = Number(fee?.amount_paid ?? 0);
              const isPaid = paid >= feeAmount;
              return (
                <div key={player.id} className="flex items-center gap-3 rounded-xl border border-[#3A3F6B] bg-[#141428] p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold"
                    style={{ background: isPaid ? '#4ADE8020' : '#F8717120', color: isPaid ? '#4ADE80' : '#F87171' }}>
                    {player.jersey_number ?? '—'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-[#E5E7EB] truncate">{player.name}</div>
                  </div>
                  <span className={`text-[12px] font-semibold ${isPaid ? 'text-[#4ADE80]' : paid > 0 ? 'text-[#FBBF24]' : 'text-[#F87171]'}`}>
                    {isPaid ? '✓ Paid' : paid > 0 ? `$${paid}` : 'Unpaid'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {expenses.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-[14px] font-semibold text-[#E5E7EB]">Expenses</h2>
            <div className="space-y-2">
              {expenses.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-xl border border-[#3A3F6B] bg-[#141428] px-4 py-3">
                  <div>
                    <div className="text-[13px] font-medium text-[#E5E7EB]">{e.description || e.category}</div>
                    <div className="text-[11px] text-[#6B7280]">{e.expense_date}</div>
                  </div>
                  <span className="text-[14px] font-semibold text-[#F87171]">${Number(e.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {sponsorships.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-[14px] font-semibold text-[#E5E7EB]">Sponsors</h2>
            <div className="space-y-2">
              {sponsorships.map((s, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-[#3A3F6B] bg-[#141428] px-4 py-3">
                  <span className="text-[13px] font-medium text-[#E5E7EB]">{s.sponsor_name}</span>
                  <span className="text-[14px] font-semibold text-[#4ADE80]">${Number(s.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="mt-8 text-center">
          <p className="text-[11px] text-[#6B7280]">Powered by Cricket Hub</p>
        </footer>
      </div>
    </div>
  );
}
