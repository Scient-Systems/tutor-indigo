
// Whether this site shows memberships and payments, asked of sqa_django_app once
// per page (GET /sqa/api/features/). It follows the sqa_django_app.payments_off
// waffle switch, so Django admin turns the Membership link, dashboard panel,
// plan redirect and plans button on or off with no rebuild or config change.
// INDIGO_SHOW_MEMBERSHIP false (a site that never sells plans) still hides them.
// If the endpoint can't answer, payments count as on: the behaviour before it.
// NOTE: rendered by Jinja before webpack. Never write two opening braces in a row.

let sqaFeaturesRequest = null;

const sqaFeatures = () => {
  if (!sqaFeaturesRequest) {
    sqaFeaturesRequest = fetch(`${getConfig().LMS_BASE_URL}/sqa/api/features/`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : { payments: true }))
      .catch(() => ({ payments: true }));
  }
  return sqaFeaturesRequest;
};

// true or false once known, null while asking. Callers show nothing for null,
// so a site with payments off never flashes a Membership link.
const useSqaPaymentsOn = () => {
  const neverSells = getConfig().INDIGO_SHOW_MEMBERSHIP === false;
  const [on, setOn] = useState(neverSells ? false : null);
  useEffect(() => {
    if (neverSells) { return undefined; }
    let alive = true;
    sqaFeatures().then((f) => { if (alive) { setOn(f.payments !== false); } });
    return () => { alive = false; };
  }, []);
  return on;
};
