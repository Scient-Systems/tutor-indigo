// Learning MFE header (learning_help_slot): a plain way out of a course, back to
// the dashboard. The logo goes there too, but learners don't read a logo as an
// exit. Styled in brand-openedx (.sqa-exit-course).
// NOTE: rendered by Jinja before webpack. Never write two opening braces in a row.

const SqaExitCourse = () => (
  <a className="sqa-exit-course" href={`${getConfig().LMS_BASE_URL}/dashboard`}>
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span>Exit course</span>
  </a>
);
