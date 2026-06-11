
// Flight-deck hero for the learner dashboard (course_list slot, priority 1).
// Derives every number from the dashboard's own data source
// (/api/learner_home/init) — no invented stats. Styled by
// brand-openedx paragon/_dashboard.scss (.sqa-* classes).

const SqaStatRing = ({ pct }) => {
  const C = 2 * Math.PI * 24;
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const raf = window.requestAnimationFrame(() => setDrawn(true));
    return () => window.cancelAnimationFrame(raf);
  }, []);
  const clamped = Math.max(0, Math.min(1, pct));
  return (
    <svg className="sqa-ring" viewBox="0 0 56 56" aria-hidden="true">
      <circle className="sqa-ring-track" cx="28" cy="28" r="24" />
      <circle
        className="sqa-ring-fill"
        cx="28"
        cy="28"
        r="24"
        strokeDasharray={C}
        strokeDashoffset={drawn ? C * (1 - clamped) : C}
        transform="rotate(-90 28 28)"
      />
    </svg>
  );
};

const SqaDashboardHero = () => {
  const config = getConfig();
  const authUser = getAuthenticatedUser();
  const [courses, setCourses] = useState(null);

  useEffect(() => {
    let alive = true;
    getAuthenticatedHttpClient()
      .get(`${config.LMS_BASE_URL}/api/learner_home/init`)
      .then((res) => {
        if (alive && res.data && Array.isArray(res.data.courses)) {
          setCourses(res.data.courses);
        }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const abs = (url) => (url && url.indexOf('http') !== 0 ? `${config.LMS_BASE_URL}${url}` : url);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : (hour < 18 ? 'Good afternoon' : 'Good evening');
  const dateLabel = new Date()
    .toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
    .toUpperCase();

  let stats = null;
  let resume = null;
  if (courses && courses.length) {
    const active = (c) => c.enrollment && c.enrollment.isEnrolled && !(c.courseRun && c.courseRun.isArchived);
    const total = courses.length;
    const inProgress = courses.filter((c) => active(c) && c.enrollment.hasStarted).length;
    const notStarted = courses.filter((c) => active(c) && !c.enrollment.hasStarted).length;
    const certificates = courses.filter((c) => c.certificate && c.certificate.isEarned).length;
    stats = { total, inProgress, notStarted, certificates };

    const byLastEnrolled = (a, b) => new Date(b.enrollment.lastEnrolled || 0) - new Date(a.enrollment.lastEnrolled || 0);
    const started = courses
      .filter((c) => active(c) && c.enrollment.hasStarted && c.courseRun && c.courseRun.resumeUrl)
      .sort(byLastEnrolled);
    if (started.length) {
      resume = { mode: 'resume', target: started[0] };
    } else {
      const fresh = courses
        .filter((c) => active(c) && !c.enrollment.hasStarted && c.courseRun && c.courseRun.homeUrl)
        .sort(byLastEnrolled);
      if (fresh.length) {
        resume = { mode: 'begin', target: fresh[0] };
      }
    }
  }

  const statCards = stats ? [
    { key: 'inProgress', hue: 'olive', label: 'In progress', value: stats.inProgress },
    { key: 'notStarted', hue: 'viola', label: 'Not started', value: stats.notStarted },
    { key: 'certificates', hue: 'jade', label: 'Certificates', value: stats.certificates },
  ] : [];

  return (
    <section id="sqa-dash-hero" aria-label="Dashboard overview">
      <p className="sqa-eyebrow">FLIGHT DECK · {dateLabel}</p>
      <h2 className="sqa-hero-title">
        {greeting}{authUser && authUser.username ? `, ${authUser.username}` : ''}
      </h2>

      {resume && (
        <a
          className="sqa-resume"
          href={abs(resume.mode === 'resume' ? resume.target.courseRun.resumeUrl : resume.target.courseRun.homeUrl)}
        >
          {resume.target.course && resume.target.course.bannerImgSrc ? (
            <span
              className="sqa-resume-art"
              style={{ backgroundImage: `url(${abs(resume.target.course.bannerImgSrc)})` }}
              aria-hidden="true"
            />
          ) : null}
          <span className="sqa-resume-meta">
            <span className="sqa-micro">
              {resume.mode === 'resume' ? 'CONTINUE' : 'START'}
              {resume.target.course && resume.target.course.courseNumber ? ` · ${resume.target.course.courseNumber}` : ''}
            </span>
            <span className="sqa-resume-name">
              {resume.target.course ? resume.target.course.courseName : ''}
            </span>
            <span className="sqa-resume-track" aria-hidden="true" />
          </span>
          <span className="sqa-btn">
            {resume.mode === 'resume' ? 'Resume' : 'Begin'}
            <svg className="sqa-btn-arrow" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path d="M2 8h10M8 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </a>
      )}

      {stats && (
        <div className="sqa-stats">
          {statCards.map((s, i) => (
            <div
              key={s.key}
              className={`sqa-stat sqa-stat--${s.hue}`}
              style={{ animationDelay: `${0.12 + i * 0.09}s` }}
            >
              <span className="sqa-stat-dial">
                <SqaStatRing pct={stats.total ? s.value / stats.total : 0} />
                <span className="sqa-stat-num">{s.value}</span>
              </span>
              <span className="sqa-stat-meta">
                <span className="sqa-stat-label">{s.label}</span>
                <span className="sqa-stat-sub">of {stats.total} enrolled</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
