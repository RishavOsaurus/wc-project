import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { worldCupGroups } from '../data/groups';
import type { Team } from '../types/worldcup';
import './RoundOf32.css';
import { useThirdPlace } from '../contexts/ThirdPlaceContext';
import type { Matchup } from '../contexts/ThirdPlaceContext';

type StoredTeam = Team & { groupName?: string };

// reuse Matchup type exported from context
const slotOrder = ['1A', '1B', '1D', '1E', '1G', '1I', '1K', '1L'];

function getGroupWinner(letter: string) {
  const group = worldCupGroups.find(g => g.name.endsWith(letter));
  return group?.teams?.[0] || { name: `Winner ${letter}`, flag: '' };
}

export default function RoundOf32() {
  const { draft, order, mapping: ctxMapping, matchups: ctxMatchups } = useThirdPlace();
  const [thirdPlaces, setThirdPlaces] = useState<StoredTeam[]>(() => {
    try {
      const raw = localStorage.getItem('thirdPlaceOrder');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const navigate = useNavigate();
  const location = useLocation();

  // keep local thirdPlaces in sync with context draft/order
  useEffect(() => {
    const source = order || draft || [];
    setThirdPlaces(source as StoredTeam[]);
  }, [draft, order]);

  // Redirect back to home if user hasn't selected third-place teams yet
  useEffect(() => {
    const raw = localStorage.getItem('thirdPlaceOrder');
    if (!raw) {
      // small delay so users see a message briefly if they navigated manually
      const t = setTimeout(() => navigate('/'), 50);
      return () => clearTimeout(t);
    }
  }, [navigate]);

  // prefer mapping from context but keep local fallback
  const [mapping, setMapping] = useState<Record<string,string> | null>(ctxMapping);
  useEffect(() => { setMapping(ctxMapping); }, [ctxMapping]);

  // Build matches using mapping if available, otherwise fallback to naive index pairing
  const [matches, setMatches] = useState<Matchup[]>([]);

  useEffect(() => {
    const navState = location.state as unknown as { matchups?: Matchup[]; mapping?: Record<string,string>; option?: string } | null;
    console.log('RoundOf32 location.state:', navState);

    // If matchups present in context (preferred) use them
    if (ctxMatchups && Array.isArray(ctxMatchups) && ctxMatchups.length > 0) {
      setMatches(ctxMatchups);
      try { localStorage.setItem('round32_matchups', JSON.stringify({ option: localStorage.getItem('round32_option') || null, mapping: mapping || null, matchups: ctxMatchups })); } catch {
        /* ignore */
      }
      console.log('Using matchups from ThirdPlaceContext:', ctxMatchups);
      // Diagnostic: log resolved mapping -> team so we can verify source
      try {
        console.group('RoundOf32 - resolved slots from context.matchups');
        (ctxMatchups as Matchup[]).forEach((m) => console.log(m.slot, '->', m.opponent?.name || m.opponent));
        console.groupEnd();
      } catch {
        /* ignore */
      }
      return;
    }

    // navigation state still allowed (e.g., immediate transition)
    if (navState && navState.matchups) {
      setMatches(navState.matchups || []);
      try { localStorage.setItem('round32_matchups', JSON.stringify({ option: navState.option || null, mapping: navState.mapping || null, matchups: navState.matchups })); } catch {
        /* ignore */
      }
      console.log('Using matchups from navigation state:', navState);
      try {
        console.group('RoundOf32 - resolved slots from navigation.state');
        (navState.matchups || []).forEach((m) => console.log(m.slot, '->', m.opponent?.name || m.opponent));
        console.groupEnd();
      } catch {
        /* ignore */
      }
      return;
    }

    // Build matches using mapping if available, otherwise fallback to naive index pairing
    const resolveToken = (token: string) => {
      const t = String(token || '').trim().toUpperCase();
      const m = t.match(/^([1-3])([A-L])$/);
      if (!m) return null;
      const pos = Number(m[1]);
      const letter = m[2];
      const groupName = `Group ${letter}`;
      try {
        const raw = localStorage.getItem('groupTeamOrders');
        if (raw) {
          const orders = JSON.parse(raw) as Record<string, (Team & { uniqueId: string })[]>;
          const ordered = orders[groupName];
          if (ordered && ordered.length >= pos) return ordered[pos - 1];
        }
      } catch {
        /* ignore */
      }
      // for third-place tokens prefer current thirdPlaces (live selection)
      if (pos === 3) {
        const foundThird = thirdPlaces.find(t => (t.groupName || '').toUpperCase().includes(letter));
        if (foundThird) return foundThird;
      }
      const group = worldCupGroups.find(g => g.name.endsWith(letter));
      if (group && group.teams && group.teams.length >= pos) return group.teams[pos - 1];
      return null;
    };

    const built = slotOrder.map((slot, idx) => {
      const winner = getGroupWinner(slot.slice(1));
      let opponent: StoredTeam | { name: string; flag?: string } = { name: 'TBD', flag: '' };
      if (mapping && mapping[slot]) {
        const token = String(mapping[slot] || '').trim().toUpperCase(); // e.g. '3E' or '1D'
        const found = resolveToken(token);
        opponent = found ? (found as StoredTeam) : { name: token, flag: '' };
      } else {
        opponent = thirdPlaces[idx] || { name: 'TBD', flag: '' };
      }
      return { slot, winner, opponent };
    });

    setMatches(built);
    try {
      // Diagnostic logging: mapping token -> resolved team
      console.group('RoundOf32 - mapping resolution');
      console.log('mapping:', mapping);
      console.log('thirdPlaces (current):', thirdPlaces);
      built.forEach(b => {
        console.log(b.slot, 'token->', mapping?.[b.slot], 'resolved->', (b.opponent as StoredTeam).name || b.opponent);
      });
      console.groupEnd();
    } catch {
      /* ignore */
    }
    try {
      const option = localStorage.getItem('round32_option') || null;
      localStorage.setItem('round32_matchups', JSON.stringify({ option, mapping, matchups: built }));
    } catch {
      /* ignore */
    }
    console.log('Built Round-of-32 matchups from mapping:', mapping, built);
  }, [location.key, location.state, mapping, thirdPlaces, ctxMatchups]);

  return (
    <div className="replica-page">
      <header className="replica-header">
        <div className="replica-left">
          <button className="back-link" onClick={() => navigate('/third-place', { state: { refresh: Date.now() } })}>
            <span className="back-icon">←</span>
            <span className="back-text">Third Place</span>
          </button>
          <div>
            <h2 className="replica-title">Round of 32</h2>
          </div>
        </div>
      </header>

      <main style={{ marginTop: 20 }}>
        <section className="card-list">
          {matches.map((m, i) => (
            <div key={i} className="card">
              <h3>Match {i + 1} — {m.slot}</h3>
              <p><strong>{m.winner.flag || ''} {m.winner.name}</strong> vs <strong>{m.opponent.flag || ''} {m.opponent.name}</strong></p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
