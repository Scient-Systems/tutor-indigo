
// Catalog course about page: the enroll button, plus the course's membership
// requirement.
//
// The stock button shows "An error occurred. Please try again later." for any
// failed enrollment, even when the LMS says why (sqa_django_app answers 400
// "User has no active membership"). This one shows the requirement before the
// click, and says plainly why a learner can't enroll, with a link to the plans.
//
// Eligibility comes from sqa_django_app (/sqa/api/course/<id>/check/<user>/), the
// same check the enrollment gate runs. The requirement and the learner's plan
// are only used to word the message. The APIs need a login, so anonymous
// visitors see the stock button, which sends them to sign in.
// NOTE: rendered by Jinja before webpack. Never write two opening braces in a row.

const SQA_ACCOUNT_TYPE_LABELS = {
  student: 'student',
  'teacher-pd': 'teacher PD',
  professional: 'professional',
  'scient-staff': 'Scient staff',
};

const sqaAboutCourseId = () => {
  const m = window.location.pathname.match(/\/courses\/([^/]+)\/about/);
  return m ? decodeURIComponent(m[1]) : null;
};

const sqaTagLabel = (tag) => SQA_ACCOUNT_TYPE_LABELS[tag] || tag.replace(/-/g, ' ');

// Why this learner can't enroll, in words. null when nothing in the requirement
// explains it (then the server's own reason is shown).
const sqaBlockedReason = (req, membership) => {
  if (!req) { return null; }
  const level = req.required_level ? req.required_level_display : null;
  if (!membership) {
    return level
      ? `This course needs the ${level} plan. You don't have a membership yet.`
      : 'This course needs a membership.';
  }
  if (level && req.required_rank != null && membership.rank < req.required_rank) {
    return `This course needs the ${level} plan. You're on ${membership.level_display}.`;
  }
  const have = (membership.tags || []).concat([membership.account_type]);
  const missing = (req.required_tags || []).filter((t) => have.indexOf(t) === -1);
  if (missing.length) {
    return `This course is only for ${missing.map(sqaTagLabel).join(', ')} accounts.`;
  }
  return null;
};

// A level can be bought; a missing tag or account type can't.
const sqaCanUpgrade = (req, membership) => {
  if (!req || !req.required_level) { return false; }
  return !membership || req.required_rank == null || membership.rank < req.required_rank;
};

const SqaCourseRequirement = ({ req }) => {
  if (!req) { return null; }
  const parts = [];
  if (req.required_level) { parts.push(`${req.required_level_display} plan`); }
  if ((req.required_tags || []).length) {
    parts.push(`${req.required_tags.map(sqaTagLabel).join(', ')} accounts`);
  }
  if (!parts.length) { return null; }
  return <p className="sqa-enroll-req mb-2">Requires: {parts.join(' · ')}</p>;
};

const SqaCourseAboutEnroll = ({ ecommerceCheckout, onEcommerceCheckout, onEnroll, isEnrollmentPending }) => {
  const user = getAuthenticatedUser();
  const courseId = sqaAboutCourseId();
  const [req, setReq] = useState(null);
  const [membership, setMembership] = useState(null);
  const [eligible, setEligible] = useState(null);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!user || !courseId) { return undefined; }
    let alive = true;
    const http = getAuthenticatedHttpClient();
    const base = `${getConfig().LMS_BASE_URL}/sqa/api`;
    const course = encodeURIComponent(courseId);
    const name = encodeURIComponent(user.username);
    http.get(`${base}/course/${course}/requirement/`)
      .then(({ data }) => { if (alive) { setReq(data); } })
      .catch(() => {});
    http.get(`${base}/user/${name}/`)
      .then(({ data }) => { if (alive) { setMembership(data); } })
      .catch(() => {});
    http.get(`${base}/course/${course}/check/${name}/`)
      .then(({ data }) => { if (alive) { setEligible(!!data.eligible); } })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const lms = getConfig().LMS_BASE_URL;
  const plans = <a className="btn btn-primary" href="/sqa-payment">See membership plans</a>;

  // Paid seats, and anonymous visitors: the stock flow already does the right thing.
  if (ecommerceCheckout || !user || !courseId) {
    return (
      <button type="button" className="btn btn-primary" disabled={isEnrollmentPending}
        onClick={ecommerceCheckout ? onEcommerceCheckout : onEnroll}>
        {isEnrollmentPending ? 'Enrolling...' : 'Enroll now'}
      </button>
    );
  }

  const enroll = () => {
    setPending(true);
    setError(null);
    const form = new URLSearchParams();
    form.append('course_id', courseId);
    form.append('enrollment_action', 'enroll');
    getAuthenticatedHttpClient().post(`${lms}/change_enrollment`, form.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    })
      .then(({ data }) => { window.location.href = data || `${lms}/dashboard`; })
      .catch((err) => {
        const attrs = (err && err.customAttributes) || {};
        const status = attrs.httpErrorStatus || (err && err.response && err.response.status);
        if (status === 403) {
          const next = `/courses/${courseId}/about`;
          window.location.href = `${getConfig().LOGIN_URL}?next=${encodeURIComponent(next)}`;
          return;
        }
        const body = attrs.httpErrorResponseData || (err && err.response && err.response.data);
        setError(sqaBlockedReason(req, membership)
          || (status === 400 && typeof body === 'string' && body)
          || 'Something went wrong. Please try again.');
        setPending(false);
      });
  };

  const blocked = eligible === false;
  const message = error || (blocked ? (sqaBlockedReason(req, membership) || 'You can\'t enroll in this course yet.') : null);

  return (
    <div className="sqa-enroll d-flex flex-column align-items-start">
      <SqaCourseRequirement req={req} />
      {message && <p role="status" className="sqa-enroll-msg text-danger mb-2">{message}</p>}
      {blocked
        ? (sqaCanUpgrade(req, membership) && plans)
        : (
          <button type="button" className="btn btn-primary" disabled={pending} onClick={enroll}>
            {pending ? 'Enrolling...' : 'Enroll now'}
          </button>
        )}
      {error && !blocked && sqaCanUpgrade(req, membership) && <div className="mt-2">{plans}</div>}
    </div>
  );
};
