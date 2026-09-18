
// Catalog MFE (Verawood) homepage: banner + course list + course card.
//
// Every value comes from the platform. Courses, counts and facets come from
// the LMS course search (/search/unstable/v0/course_list_search/), the same
// endpoint the stock catalog uses. Level and tags are indexed from each
// course's other_course_settings by sqa_django_app (catalog_index.py).
//
// No level is named here. Which levels exist, and their order, come from
// getConfig().SQA_CATALOG_LEVELS (LMS setting SQA_CATALOG_LEVELS via
// MFE_CONFIG). A level the config doesn't know still shows, after the known ones.
//
// What the search API cannot do, this does not pretend to: sorting is by start
// date or default only, and "open now" is shown per card, never as a filter
// (it is a date range, and the API filters exact values only).
//
// Styled by brand-openedx paragon/_catalog.scss (.sqa-cat-* classes).
// NOTE: this file is rendered by Jinja before webpack sees it. Never write two
// opening braces in a row anywhere in it (so no inline style objects).

const SQA_CAT_PAGE_SIZE = 12;
const SQA_CAT_TAG_LIMIT = 6;

const sqaCatLevels = () => {
  const levels = getConfig().SQA_CATALOG_LEVELS;
  return Array.isArray(levels) ? levels : [];
};

// Known levels in config order, then anything else the index returned.
const sqaCatOrderLevels = (present) => {
  const known = sqaCatLevels().filter((lv) => present.indexOf(lv) !== -1);
  const extra = present.filter((lv) => known.indexOf(lv) === -1).sort();
  return known.concat(extra);
};

const sqaCatAbs = (url) => {
  if (!url) { return ''; }
  return url.indexOf('http') === 0 ? url : `${getConfig().LMS_BASE_URL}${url}`;
};

// Uploaded course images are always contentstore assets. Anything else is the
// platform's gray placeholder, which gets a drawn plate instead.
const sqaCatHasImage = (url) => Boolean(url) && url.indexOf('asset-v1') !== -1;

const sqaCatIsOpen = (start) => {
  if (!start) { return false; }
  const when = new Date(start);
  return !Number.isNaN(when.getTime()) && when <= new Date();
};

const sqaCatStateText = (start, advertisedStart) => {
  if (sqaCatIsOpen(start)) { return 'Open now'; }
  if (advertisedStart) { return `Starts ${advertisedStart}`; }
  const when = new Date(start);
  if (!start || Number.isNaN(when.getTime())) { return ''; }
  return `Starts ${when.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
};

const sqaCatAboutUrl = (courseId) => {
  const base = (getConfig().PUBLIC_PATH || '/').replace(/\/?$/, '/');
  return `${base}courses/${courseId}/about`;
};

// ---- the drawn plate, used when a course has no uploaded image ----------
const SQA_CAT_OLIVE = '#C6D465';
const sqaCatMark = (tag) => {
  const c = SQA_CAT_OLIVE;
  const s = `stroke="${c}" fill="none" stroke-width="2.2"`;
  const t = (tag || '').toLowerCase();
  if (t === 'ai') {
    return `<circle cx="120" cy="70" r="7" fill="${c}"/><circle cx="196" cy="48" r="5.5" fill="${c}" fill-opacity=".7"/>`
      + `<circle cx="205" cy="116" r="6.5" fill="${c}" fill-opacity=".5"/><circle cx="138" cy="126" r="5" fill="${c}" fill-opacity=".8"/>`
      + `<path d="M120 70 L196 48 M120 70 L205 116 M120 70 L138 126 M196 48 L205 116" ${s} stroke-opacity=".55"/>`;
  }
  if (t === 'coding') {
    return `<path d="M118 52 L92 88 L118 124" ${s}/><path d="M206 52 L232 88 L206 124" ${s}/>`
      + `<path d="M150 128 L174 48" ${s} stroke-opacity=".6"/>`;
  }
  if (t === 'science') {
    return `<ellipse cx="162" cy="88" rx="62" ry="24" ${s} stroke-opacity=".7"/>`
      + `<ellipse cx="162" cy="88" rx="62" ry="24" ${s} stroke-opacity=".45" transform="rotate(58 162 88)"/>`
      + `<circle cx="162" cy="88" r="9" fill="${c}"/>`;
  }
  if (t === 'math') {
    let g = '';
    for (let x = 112; x <= 212; x += 25) { g += `<path d="M${x} 46 V130" stroke="${c}" stroke-opacity=".22"/>`; }
    for (let y = 46; y <= 130; y += 21) { g += `<path d="M112 ${y} H212" stroke="${c}" stroke-opacity=".22"/>`; }
    return `${g}<path d="M112 130 Q162 30 212 130" ${s}/>`;
  }
  if (t === 'robotics') {
    return `<rect x="128" y="54" width="68" height="68" rx="10" ${s}/>`
      + `<path d="M162 30 V54 M162 122 V146 M104 88 H128 M196 88 H220" ${s} stroke-opacity=".6"/>`
      + `<circle cx="162" cy="88" r="10" fill="${c}" fill-opacity=".85"/>`;
  }
  if (t === 'design') {
    return `<path d="M104 128 C 138 40, 186 136, 220 48" ${s}/>`
      + `<circle cx="104" cy="128" r="5" fill="${c}"/><circle cx="220" cy="48" r="5" fill="${c}"/>`
      + `<path d="M104 128 L138 40 M220 48 L186 136" stroke="${c}" stroke-opacity=".3"/>`;
  }
  return `<path d="M112 120 L162 56 L212 120" ${s}/><circle cx="162" cy="56" r="6" fill="${c}"/>`;
};

const sqaCatEscape = (text) => String(text || '').replace(/[&<>"]/g, (ch) => (
  ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : '&quot;'
));

const sqaCatPlate = (code, tag) => {
  let ticks = '';
  for (let x = 16; x < 320; x += 26) { ticks += `<path d="M${x} 168 v5" stroke="#97AAD7" stroke-opacity=".26"/>`; }
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" width="320" height="180">'
    + '<rect width="320" height="180" fill="#0A1226"/>'
    + sqaCatMark(tag) + ticks
    + `<text x="16" y="32" fill="#FFFFFF" font-family="JetBrains Mono, monospace" font-size="16" font-weight="600" letter-spacing="2">${sqaCatEscape(code)}</text>`
    + (tag ? `<text x="304" y="32" text-anchor="end" fill="#D4E27A" font-family="Hanken Grotesk, sans-serif" font-size="15" font-weight="700">${sqaCatEscape(tag)}</text>` : '')
    + '</svg>';
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// ---- level gauge: one segment per configured level --------------------------
const SqaCatGauge = ({ level }) => {
  const levels = sqaCatLevels();
  const rank = levels.indexOf(level) + 1;
  if (!rank) { return null; }
  return (
    <span className="sqa-cat-gauge" aria-hidden="true">
      {levels.map((lv, i) => (
        <i key={lv} className={i < rank ? 'on' : ''} />
      ))}
    </span>
  );
};

// ---- the card: used by the homepage list and the full catalog page ----------
const SqaCatalogCard = ({
  courseId, title, code, level, tags, start, advertisedStart, imageUrl,
}) => {
  const tagList = Array.isArray(tags) ? tags : [];
  const open = sqaCatIsOpen(start);
  const state = sqaCatStateText(start, advertisedStart);
  const src = sqaCatHasImage(imageUrl) ? sqaCatAbs(imageUrl) : sqaCatPlate(code, tagList[0]);
  const label = [title, level, state].filter(Boolean).join('. ');
  return (
    <a className="sqa-cat-card" href={sqaCatAboutUrl(courseId)} aria-label={label}>
      <span className="sqa-cat-thumb"><img src={src} alt="" loading="lazy" /></span>
      <span className="sqa-cat-body">
        {level ? (
          <span className="sqa-cat-level"><SqaCatGauge level={level} />{level}</span>
        ) : null}
        <span className="sqa-cat-title">{title}</span>
        {tagList.length ? (
          <span className="sqa-cat-tags">
            {tagList.map((t) => <span key={t} className="sqa-cat-tag">{t}</span>)}
          </span>
        ) : null}
        <span className="sqa-cat-meta">
          <span className="sqa-cat-code">{code}</span>
          {state ? <span className={open ? 'sqa-cat-state open' : 'sqa-cat-state'}>{state}</span> : null}
        </span>
      </span>
    </a>
  );
};

// ---- search -----------------------------------------------------------------
const sqaCatSearch = ({
  pageIndex = 0, pageSize = SQA_CAT_PAGE_SIZE, filters = {}, byStart = false, searchString = '',
}) => {
  const form = new FormData();
  form.append('page_size', String(pageSize));
  form.append('page_index', String(pageIndex));
  form.append('enable_course_sorting_by_start_date', String(byStart));
  if (searchString) { form.append('search_string', searchString); }
  Object.keys(filters).forEach((key) => {
    (filters[key] || []).forEach((value) => form.append(key, value));
  });
  return getAuthenticatedHttpClient()
    .post(`${getConfig().LMS_BASE_URL}/search/unstable/v0/course_list_search/`, form)
    .then((res) => res.data || {});
};

const sqaCatFromHit = (hit) => {
  const d = (hit && hit.data) || {};
  const content = d.content || {};
  return {
    courseId: d.id || hit.id,
    title: content.display_name || d.display_name || d.number || '',
    code: d.number || content.number || '',
    level: typeof d.level === 'string' ? d.level : '',
    tags: Array.isArray(d.tags) ? d.tags : [],
    start: d.start,
    advertisedStart: d.advertised_start,
    imageUrl: d.image_url,
  };
};

const sqaCatCoursesUrl = (query) => {
  const base = (getConfig().PUBLIC_PATH || '/').replace(/\/?$/, '/');
  const q = (query || '').trim();
  return q ? `${base}courses?search_query=${encodeURIComponent(q)}` : `${base}courses`;
};

// Shared search box. `tone` is "night" on the dark banner, "day" on a page.
const SqaCatSearchForm = ({ initial = '', tone = 'night' }) => {
  const [query, setQuery] = useState(initial);
  const onSubmit = (e) => {
    e.preventDefault();
    window.location.assign(sqaCatCoursesUrl(query));
  };
  return (
    <form className={tone === 'day' ? 'sqa-cat-find sqa-cat-find-day' : 'sqa-cat-find'} role="search" onSubmit={onSubmit}>
      <label className="sqa-cat-sr" htmlFor="sqa-cat-q">Search courses</label>
      <input
        id="sqa-cat-q"
        type="search"
        value={query}
        placeholder="Search by title, tag, or course code"
        onChange={(e) => setQuery(e.target.value)}
      />
      <button type="submit">Search</button>
    </form>
  );
};

// ---- homepage banner ----------------------------------------------------------
// The course count lives in the list panel below, not here, so it is shown once.
const SqaCatalogBanner = () => (
  <section className="sqa-cat sqa-cat-banner">
    <div className="sqa-cat-wrap">
      <h1 className="sqa-cat-headline">
        {getConfig().SQA_CATALOG_HEADLINE || 'Every course we teach, from first steps to final projects.'}
      </h1>
      <SqaCatSearchForm />
    </div>
  </section>
);

// ---- the /courses page --------------------------------------------------------
// The stock page wraps every slot in a fixed-width container, so a full-bleed
// banner cannot work here. This is the same list on a light page instead; the
// stock search field and data table are hidden (see plugin.py).
const SqaCatalogCoursesPage = () => {
  const initial = new URLSearchParams(window.location.search).get('search_query') || '';
  return (
    <div className="sqa-cat sqa-cat-page">
      <h1 className="sqa-cat-page-title">Explore courses</h1>
      {initial ? (
        <p className="sqa-cat-page-sub">
          {`Results for "${initial}". `}
          <a href={sqaCatCoursesUrl('')}>Clear search</a>
        </p>
      ) : null}
      <SqaCatSearchForm initial={initial} tone="day" />
      <SqaCatalogList searchString={initial} flat />
    </div>
  );
};

// ---- course list with facets --------------------------------------------------
const SqaCatalogList = ({ searchString = '', flat = false }) => {
  const [level, setLevel] = useState(null);
  const [tag, setTag] = useState(null);
  const [byStart, setByStart] = useState(false);
  const [allTags, setAllTags] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [grand, setGrand] = useState(null);
  const [aggs, setAggs] = useState({});
  const [status, setStatus] = useState('loading');
  const [attempt, setAttempt] = useState(0);

  // A filter change and the return to page one happen in the same handler, so
  // React batches them into ONE fetch. (A separate "reset page" effect would
  // race: the fetch could run with the new filter but the old page number.)
  const refine = (apply) => { apply(); setPageIndex(0); };
  const onSort = (e) => {
    const v = e.target.value === 'start';
    refine(() => setByStart(v));
  };

  useEffect(() => {
    let alive = true;
    const filters = {};
    if (level) { filters.level = [level]; }
    if (tag) { filters.tags = [tag]; }
    if (pageIndex === 0) { setStatus('loading'); }
    sqaCatSearch({ pageIndex, filters, byStart, searchString })
      .then((data) => {
        if (!alive) { return; }
        const hits = (data.results || []).map(sqaCatFromHit);
        setRows((prev) => (pageIndex === 0 ? hits : prev.concat(hits)));
        setTotal(data.total || 0);
        setAggs(data.aggs || {});
        if (!level && !tag && !searchString) { setGrand(data.total || 0); }
        setStatus('ready');
      })
      .catch(() => { if (alive) { setStatus('error'); } });
    return () => { alive = false; };
  }, [level, tag, byStart, pageIndex, attempt, searchString]);

  const levelTerms = (aggs.level && aggs.level.terms) || {};
  const tagTerms = (aggs.tags && aggs.tags.terms) || {};
  const levelNames = sqaCatOrderLevels(Object.keys(levelTerms));
  const tagNames = Object.keys(tagTerms).sort((a, b) => (tagTerms[b] - tagTerms[a]) || a.localeCompare(b));
  const shownTags = allTags ? tagNames : tagNames.slice(0, SQA_CAT_TAG_LIMIT);

  if (status === 'error') {
    return (
      <div className="sqa-cat sqa-cat-list">
        <div className="sqa-cat-wrap sqa-cat-empty">
          <h2>Courses couldn't load</h2>
          <p>The course search didn't respond. Check your connection, then try again.</p>
          <button type="button" className="sqa-cat-quiet" onClick={() => setAttempt(attempt + 1)}>Try again</button>
        </div>
      </div>
    );
  }

  if (status === 'ready' && grand === 0) {
    return (
      <div className="sqa-cat sqa-cat-list">
        <div className="sqa-cat-wrap sqa-cat-empty">
          <h2>No courses published yet</h2>
          <p>When a course team publishes in Studio, it shows up here within a few minutes.</p>
        </div>
      </div>
    );
  }

  const chip = (label, count, pressed, onClick, extra) => (
    <button type="button" className="sqa-cat-chip" aria-pressed={pressed ? 'true' : 'false'} onClick={onClick}>
      {extra}{label}{typeof count === 'number' ? <span className="sqa-cat-count">{count}</span> : null}
    </button>
  );

  const wrapClass = flat ? '' : 'sqa-cat-wrap';
  return (
    <div className={flat ? 'sqa-cat sqa-cat-list sqa-cat-list-flat' : 'sqa-cat sqa-cat-list'}>
      <div className={wrapClass}>
        <div className={flat ? 'sqa-cat-panel sqa-cat-panel-flat' : 'sqa-cat-panel'}>
          <div className="sqa-cat-controls">
            <p className="sqa-cat-total">
              {total === 1 ? '1 course' : `${total} courses`}
              {grand !== null && total !== grand ? <span className="sqa-cat-of">{` of ${grand}`}</span> : null}
            </p>
            <label className="sqa-cat-sort" htmlFor="sqa-cat-sort">
              Sort by
              <select id="sqa-cat-sort" value={byStart ? 'start' : 'default'} onChange={onSort}>
                <option value="default">Recommended</option>
                <option value="start">Start date</option>
              </select>
            </label>
          </div>
          <div className="sqa-cat-facets">
            {levelNames.length ? (
              <div className="sqa-cat-facet" role="group" aria-label="Level">
                <span className="sqa-cat-flabel">Level</span>
                {levelNames.map((lv) => (
                  <React.Fragment key={lv}>
                    {chip(lv, levelTerms[lv], level === lv, () => refine(() => setLevel(level === lv ? null : lv)), <SqaCatGauge level={lv} />)}
                  </React.Fragment>
                ))}
              </div>
            ) : null}
            {tagNames.length ? (
              <div className="sqa-cat-facet" role="group" aria-label="Tags">
                <span className="sqa-cat-flabel">Tags</span>
                {shownTags.map((t) => (
                  <React.Fragment key={t}>
                    {chip(t, tagTerms[t], tag === t, () => refine(() => setTag(tag === t ? null : t)))}
                  </React.Fragment>
                ))}
                {tagNames.length > SQA_CAT_TAG_LIMIT ? (
                  <button type="button" className="sqa-cat-chip sqa-cat-more" onClick={() => setAllTags(!allTags)}>
                    {allTags ? 'Fewer tags' : `${tagNames.length - SQA_CAT_TAG_LIMIT} more tags`}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {status === 'loading' ? (
          <div className="sqa-cat-grid" aria-busy="true">
            {[0, 1, 2, 3].map((i) => <div key={i} className="sqa-cat-card sqa-cat-skeleton" />)}
          </div>
        ) : null}

        {status === 'ready' && rows.length === 0 ? (
          <div className="sqa-cat-empty">
            {searchString && !level && !tag ? (
              <React.Fragment>
                <h2>{`No courses match "${searchString}"`}</h2>
                <p>Try a shorter word, a tag such as AI, or a course code.</p>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <h2>Nothing matches those filters</h2>
                <p>Remove one to see more. The number on each filter shows what it would return.</p>
              </React.Fragment>
            )}
          </div>
        ) : null}

        {status === 'ready' && rows.length ? (
          <div className="sqa-cat-grid">
            {rows.map((r) => <SqaCatalogCard key={r.courseId} {...r} />)}
          </div>
        ) : null}

        {status === 'ready' && rows.length < total ? (
          <div className="sqa-cat-morebar">
            <button type="button" className="sqa-cat-quiet" onClick={() => setPageIndex(pageIndex + 1)}>
              {`Show ${Math.min(SQA_CAT_PAGE_SIZE, total - rows.length)} more of ${total - rows.length}`}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
