
// Designed empty state for the learner dashboard (no_courses_view slot,
// replaces the stock empty-course illustration). Styled by
// brand-openedx paragon/_dashboard.scss (.sqa-* classes).

const SqaDashboardEmptyState = () => {
  const config = getConfig();
  return (
    <section id="sqa-empty">
      <span className="sqa-empty-ghost" aria-hidden="true">SQA</span>
      <p className="sqa-eyebrow sqa-eyebrow--center">NO ENROLLMENTS LOGGED</p>
      <h3 className="sqa-empty-title">Chart your first course</h3>
      <p className="sqa-empty-copy">
        Your flight deck is standing by. Pick a course from the catalog
        and your missions will appear here.
      </p>
      <a className="sqa-btn" href={`${config.LMS_BASE_URL}/courses`}>
        Explore courses
        <svg className="sqa-btn-arrow" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path d="M2 8h10M8 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </section>
  );
};
