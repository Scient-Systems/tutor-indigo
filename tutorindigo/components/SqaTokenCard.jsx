
// AI token card for the Profile MFE (additional_profile_fields slot).
// Fetches the user's active SQA proxy tokens from the plugin API and shows
// status + a link to the full tokens management page (/sqa/tokens/).
// No inline double-brace style objects — Jinja renders this file before it
// lands in env.config.jsx, so a doubled curly brace is read as a template tag.

const SqaTokenCard = () => {
  const config = getConfig();
  const [tokens, setTokens] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    getAuthenticatedHttpClient()
      .get(`${config.LMS_BASE_URL}/sqa/api/proxy/tokens/`)
      .then((res) => {
        if (alive && Array.isArray(res.data)) {
          setTokens(res.data.filter((t) => t.status === 'active'));
        }
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, []);

  const tokenPageUrl = `${config.LMS_BASE_URL}/sqa/tokens/`;
  const activeToken = tokens[0] || null;

  if (!loaded) return null;

  return (
    <div className="pgn__form-group mb-4">
      <p className="pgn__form-label font-weight-bold mb-2">AI Access Token</p>
      {activeToken ? (
        <div className="d-flex align-items-center flex-wrap">
          <span className="badge badge-success mr-2">Active</span>
          <code className="mr-3 text-monospace small">{activeToken.token_prefix}…</code>
          <a className="btn btn-outline-primary btn-sm" href={tokenPageUrl}>
            Manage token
          </a>
        </div>
      ) : (
        <div>
          <p className="small text-muted mb-2">
            Get an AI access token to use with the SQA course bot.
          </p>
          <a className="btn btn-primary btn-sm" href={tokenPageUrl}>
            Get your AI token
          </a>
        </div>
      )}
    </div>
  );
};
