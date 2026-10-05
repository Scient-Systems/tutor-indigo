
// Learning MFE course-end page (course_exit_view_courses.v1 slot). Replaces the
// stock exit page: the stock body after this element is hidden by brand-openedx
// paragon/_course-exit.scss (.sqa-course-complete ~ *). If the data call fails
// this renders nothing and the stock page shows, so the learner is never stuck.
// Data: the same /api/courseware/course/<id> the stock page uses.
// NOTE: rendered by Jinja before webpack. Never write two opening braces in a row.

const SQA_CC_CERT_COPY = {
  downloadable: {
    title: 'Your certificate is ready',
    body: 'It stays on your dashboard and profile. Share it or download it any time.',
  },
  requesting: {
    title: 'Claim your certificate',
    body: 'You earned it. Generate it now and it will appear on your dashboard and profile.',
  },
  earned_but_not_available: {
    title: 'Your certificate is on its way',
    body: 'You earned it. It becomes available on',
  },
  generating: {
    title: 'Your certificate is being prepared',
    body: 'This usually takes a minute. Refresh the page to see it.',
  },
};

const SqaCourseComplete = () => {
  const config = getConfig();
  const match = window.location.pathname.match(/^(.*)\/course\/([^/]+)\/course-end/);
  const mfeBase = match ? match[1] : '';
  const courseId = match ? decodeURIComponent(match[2]) : null;
  const [meta, setMeta] = useState(null);
  const [failed, setFailed] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const load = () => getAuthenticatedHttpClient()
    .get(`${config.LMS_BASE_URL}/api/courseware/course/${encodeURIComponent(courseId)}`)
    .then(({ data }) => setMeta(data))
    .catch(() => setFailed(true));

  useEffect(() => {
    if (courseId) { load(); } else { setFailed(true); }
  }, [courseId]);

  if (failed) { return null; }
  if (!meta) { return <section className="sqa-course-complete sqa-cc-loading" aria-busy="true" />; }

  const cert = meta.certificate_data || {};
  const status = cert.cert_status;
  const passed = !!meta.user_has_passing_grade;
  const finished = passed || ['downloadable', 'requesting', 'earned_but_not_available', 'generating'].indexOf(status) !== -1;
  const certCopy = SQA_CC_CERT_COPY[status];
  const certUrl = cert.cert_web_view_url
    ? `${config.LMS_BASE_URL}${cert.cert_web_view_url}`
    : (cert.download_url || null);
  const availableOn = cert.certificate_available_date
    ? new Date(cert.certificate_available_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const claim = () => {
    setClaiming(true);
    getAuthenticatedHttpClient()
      .post(`${config.LMS_BASE_URL}/courses/${courseId}/generate_user_cert`)
      .then(load)
      .catch(() => {})
      .then(() => setClaiming(false));
  };

  let eyebrow = 'Course complete';
  let lede = 'You made it to the end. Every unit, every activity, done.';
  if (!finished) {
    eyebrow = 'End of course';
    lede = meta.has_scheduled_content
      ? 'You reached the end of what is open so far. More units are on the way.'
      : 'You reached the last unit. Your grade is not passing yet, so revisit the graded activities on your progress page.';
  }

  const courseHome = `${mfeBase}/course/${courseId}/home`;
  const progress = `${mfeBase}/course/${courseId}/progress`;
  const next = [
    finished
      ? { key: 'course', label: 'Back to the course', sub: 'Revisit any unit', href: courseHome }
      : { key: 'progress', label: 'See my progress', sub: 'Find what is left to pass', href: progress },
    { key: 'dashboard', label: 'My courses', sub: 'Everything you are enrolled in', href: `${config.LMS_BASE_URL}/dashboard` },
    { key: 'discover', label: 'Discover new courses', sub: 'Find your next quest', href: `${config.LMS_BASE_URL}/courses` },
  ];

  const arrow = (
    <svg className="sqa-cc-arrow" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path d="M2 8h10M8 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <section className={`sqa-course-complete ${finished ? 'is-finished' : 'is-open'}`} aria-labelledby="sqa-cc-title">
      <div className="sqa-cc-plate">
        <div className="sqa-cc-copy">
          <p className="sqa-cc-eyebrow">{eyebrow}</p>
          <h1 id="sqa-cc-title" className="sqa-cc-title">{meta.name}</h1>
          <p className="sqa-cc-lede">{lede}</p>

          {certCopy && (
            <div className="sqa-cc-cert">
              <p className="sqa-cc-cert-title">{certCopy.title}</p>
              <p className="sqa-cc-cert-body">
                {certCopy.body}
                {status === 'earned_but_not_available' ? ` ${availableOn || 'the certificate date'}.` : ''}
              </p>
              <div className="sqa-cc-actions">
                {status === 'downloadable' && certUrl && (
                  <a className="sqa-cc-btn" href={certUrl}>View my certificate {arrow}</a>
                )}
                {status === 'downloadable' && meta.linkedin_add_to_profile_url && (
                  <a className="sqa-cc-btn sqa-cc-btn--ghost" href={meta.linkedin_add_to_profile_url} target="_blank" rel="noopener noreferrer">
                    Add to LinkedIn
                  </a>
                )}
                {status === 'requesting' && (
                  <button type="button" className="sqa-cc-btn" onClick={claim} disabled={claiming}>
                    {claiming ? 'Generating…' : 'Get my certificate'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className={`sqa-cc-seal ${finished ? '' : 'is-open'}`} aria-hidden="true">
          <span className="sqa-cc-seal-rosette" />
          <svg className="sqa-cc-seal-mark" viewBox="0 0 48 48" width="48" height="48">
            {finished
              ? <path d="M13 25l7 7 15-16" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
              : <path d="M10 24h22M26 16l8 8-8 8" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />}
          </svg>
        </div>
      </div>

      <nav className="sqa-cc-next" aria-label="What next">
        <p className="sqa-cc-next-label">What next</p>
        <div className="sqa-cc-next-grid">
          {next.map((n) => (
            <a key={n.key} className={`sqa-cc-next-card sqa-cc-next-card--${n.key}`} href={n.href}>
              <span className="sqa-cc-next-text">
                <span className="sqa-cc-next-title">{n.label}</span>
                <span className="sqa-cc-next-sub">{n.sub}</span>
              </span>
              {arrow}
            </a>
          ))}
        </div>
      </nav>
    </section>
  );
};
