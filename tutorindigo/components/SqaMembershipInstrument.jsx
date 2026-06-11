
// Membership instrument rail for the learner dashboard (widget_sidebar slot,
// replaces the stock "Looking for a challenge?" card). Pulls live data from
// the sqa plugin API (api_membership waffle switch must be ON):
//   GET /sqa/api/levels/            -> tier ladder
//   GET /sqa/api/user/<username>/   -> current membership (404 = Free)
// Styled by brand-openedx paragon/_dashboard.scss (.sqa-* classes).

const SqaMembershipInstrument = () => {
  const config = getConfig();
  const authUser = getAuthenticatedUser();
  const [levels, setLevels] = useState(null);
  const [membership, setMembership] = useState(null);
  const [memberLoaded, setMemberLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    const http = getAuthenticatedHttpClient();
    http.get(`${config.LMS_BASE_URL}/sqa/api/levels/`)
      .then((res) => {
        if (alive && Array.isArray(res.data) && res.data.length) {
          setLevels(res.data);
        }
      })
      .catch(() => {});
    if (authUser && authUser.username) {
      http.get(`${config.LMS_BASE_URL}/sqa/api/user/${authUser.username}/`)
        .then((res) => {
          if (alive) {
            setMembership(res.data);
            setMemberLoaded(true);
          }
        })
        .catch(() => {
          // 404 = no active membership row, i.e. Free tier
          if (alive) { setMemberLoaded(true); }
        });
    } else {
      setMemberLoaded(true);
    }
    return () => { alive = false; };
  }, []);

  const fallbackLevels = [
    { slug: 'free', display_name: 'Free', rank: 0 },
    { slug: 'basic', display_name: 'Basic', rank: 1 },
    { slug: 'premium', display_name: 'Premium', rank: 2 },
    { slug: 'enterprise', display_name: 'Enterprise', rank: 3 },
  ];
  const tierColors = {
    free: '#8E9CC0',
    basic: '#9F8BFF',
    premium: '#A9BC3F',
    enterprise: '#45C48A',
  };

  // Altimeter tape: highest tier on top.
  const tiers = (levels || fallbackLevels).slice().sort((a, b) => b.rank - a.rank);
  const currentSlug = membership && membership.level_slug ? membership.level_slug : 'free';
  const currentTier = tiers.find((t) => t.slug === currentSlug) || tiers[tiers.length - 1];
  const isTop = memberLoaded && currentTier && tiers.length && currentTier.slug === tiers[0].slug;
  const payBase = `${window.location.origin}/sqa-payment`;
  const validThru = membership && membership.end_date
    ? new Date(membership.end_date)
      .toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      .toUpperCase()
    : null;

  return (
    <aside id="sqa-rail">
      <section id="sqa-membership" aria-label="Membership level">
        <p className="sqa-eyebrow sqa-eyebrow--night">CLEARANCE LEVEL</p>
        <h3 className="sqa-mem-level">
          {memberLoaded && currentTier ? currentTier.display_name : '—'}
        </h3>
        {validThru ? <p className="sqa-mem-valid">VALID THRU {validThru}</p> : null}
        <ol className="sqa-gauge">
          {tiers.map((t) => {
            const isCurrent = memberLoaded && currentTier && t.slug === currentTier.slug;
            const unlocked = memberLoaded && currentTier && t.rank <= currentTier.rank;
            // hoisted style object — inline double-brace JSX styles break
            // Tutor's Jinja rendering of this file (see SqaDashboardHero.jsx)
            const tierStyle = { '--sqa-tier-c': tierColors[t.slug] || '#8E9CC0' };
            return (
              <li
                key={t.slug}
                className={`sqa-tier${isCurrent ? ' sqa-tier--current' : ''}${unlocked ? ' sqa-tier--unlocked' : ''}`}
                style={tierStyle}
              >
                <span className="sqa-tier-dot" aria-hidden="true" />
                <span className="sqa-tier-name">{t.display_name}</span>
                {isCurrent
                  ? <span className="sqa-tier-flag">CURRENT</span>
                  : <span className="sqa-tier-rank">T{String(t.rank).padStart(2, '0')}</span>}
              </li>
            );
          })}
        </ol>
        <a className="sqa-btn sqa-btn--night" href={isTop ? `${payBase}/manage` : `${payBase}/`}>
          {isTop ? 'Manage membership' : 'Upgrade clearance'}
          <svg className="sqa-btn-arrow" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path d="M2 8h10M8 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
        {!isTop && membership ? (
          <a className="sqa-mem-manage" href={`${payBase}/manage`}>Manage current plan</a>
        ) : null}
      </section>

      <a className="sqa-explore" href={`${config.LMS_BASE_URL}/courses`}>
        <span className="sqa-explore-meta">
          <span className="sqa-eyebrow">EXPANSION</span>
          <span className="sqa-explore-title">Chart a new course</span>
        </span>
        <span className="sqa-explore-arrow" aria-hidden="true">
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <path d="M2 8h10M8 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </a>
    </aside>
  );
};
