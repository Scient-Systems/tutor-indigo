
// Learner dashboard: send a new user to the plans page until they pick one.
//
// sqa_django_app gives every new user Free with plan_chosen=false. Once they
// have verified their email, the dashboard hands them to the payment MFE, which
// shows its welcome plans page (Basic recommended, or "Continue with Free").
// Paying or choosing Free sets plan_chosen, and this stops. Unverified users
// stay on the dashboard, where the stock banner asks them to confirm the email;
// nobody can pay before that (the checkout API refuses).
// Renders nothing.
// NOTE: rendered by Jinja before webpack. Never write two opening braces in a row.

const SqaPlanRedirect = () => {
  useEffect(() => {
    if (!getAuthenticatedUser()) { return; }
    getAuthenticatedHttpClient()
      .get(`${getConfig().LMS_BASE_URL}/sqa/api/billing/status/`)
      .then(({ data }) => {
        if (data && data.email_verified === true && data.plan_chosen === false) {
          window.location.replace('/sqa-payment/');
        }
      })
      .catch(() => {});
  }, []);
  return null;
};
