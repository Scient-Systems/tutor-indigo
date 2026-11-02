// Discussions MFE course header: the same Exit course link and theme toggle the
// learning MFE shows in learning_help_slot. The discussions header (header v8
// LearningHeader) has no slot inside it, only header_discussions.v1 around it, so
// plugin.py wraps that slot with this and we portal the controls into the
// header row, just before the account menu.
// NOTE: rendered by Jinja before webpack. Never write two opening braces in a row.

const SqaHeaderExtras = () => {
  const [host, setHost] = useState(null);

  useEffect(() => {
    let node = null;
    let tries = 0;
    let timer = null;
    const place = () => {
      const row = document.querySelector('header.learning-header .container-xl');
      if (!row) {
        tries += 1;
        if (tries < 40) { timer = setTimeout(place, 250); }
        return;
      }
      node = document.createElement('div');
      node.className = 'sqa-header-extras d-flex align-items-center';
      const account = Array.from(row.children).find(
        (child) => child.classList.contains('user-dropdown') || child.querySelector('.user-dropdown'),
      );
      if (account) { row.insertBefore(node, account); } else { row.appendChild(node); }
      setHost(node);
    };
    place();
    return () => {
      if (timer) { clearTimeout(timer); }
      if (node && node.parentNode) { node.parentNode.removeChild(node); }
    };
  }, []);

  if (!host) { return null; }
  return createPortal(
    <>
      <SqaExitCourse />
      <ToggleThemeButton />
    </>,
    host,
  );
};
