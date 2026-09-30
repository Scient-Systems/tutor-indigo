
// Header main menu, the same in every MFE.
//
// Each MFE builds its own header menu: the learner dashboard has Courses and
// Discover New, the catalog and the payment MFE only get the stock header's
// default. So the links changed as you moved between pages. This replaces the
// default contents of the desktop and mobile main-menu slots everywhere with
// one list (wired in plugin.py, SQA_HEADER_NAV_MFES).
//
// Links go through the LMS (/dashboard, /courses), which redirects to the right
// MFE on each environment. The payment MFE shares this host, so its links are
// relative.
// NOTE: rendered by Jinja before webpack. Never write two opening braces in a row.

const sqaNavActive = (match) => {
  const path = window.location.pathname;
  if (match === '/sqa-payment') {
    return path.indexOf('/sqa-payment') === 0 && path.indexOf('/sqa-payment/pathways') !== 0;
  }
  return path.indexOf(match) === 0;
};

const SqaNavLink = ({ href, label, match }) => (
  <a className={`nav-link${sqaNavActive(match) ? ' active' : ''}`} href={href}>{label}</a>
);

const SqaMainMenu = () => {
  // Pathways only when its API answers: with the api_pathway switch off the
  // endpoint 404s, and a link to a dead page is worse than no link.
  const [pathways, setPathways] = useState(false);
  useEffect(() => {
    if (!getAuthenticatedUser()) { return undefined; }
    let alive = true;
    getAuthenticatedHttpClient().get(`${getConfig().LMS_BASE_URL}/sqa/api/pathways/`)
      .then(() => { if (alive) { setPathways(true); } })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const lms = getConfig().LMS_BASE_URL;
  return (
    <>
      <SqaNavLink href={`${lms}/dashboard`} label="Courses" match="/learner-dashboard" />
      <SqaNavLink href={`${lms}/courses`} label="Discover New" match="/catalog" />
      <SqaNavLink href="/sqa-payment" label="Membership" match="/sqa-payment" />
      {pathways && <SqaNavLink href="/sqa-payment/pathways" label="Pathways" match="/sqa-payment/pathways" />}
    </>
  );
};
