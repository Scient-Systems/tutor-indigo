
const IndigoFooter = () => {
  const intl = useIntl();
  const config = getConfig();

  const indigoFooterNavLinks = config.INDIGO_FOOTER_NAV_LINKS || [];
  // Per-site brand (tutor-indigo INDIGO_BRAND_* settings). The fallbacks are
  // Stem Quest Academy's, for an LMS whose settings predate these keys.
  const brandName = config.INDIGO_BRAND_NAME || "Stem Quest Academy";
  const brandUrl = config.INDIGO_BRAND_URL === undefined
    ? "https://stemquestacademy.com/"
    : (config.INDIGO_BRAND_URL || config.LMS_BASE_URL);
  const brandIsExternal = brandUrl.indexOf(config.LMS_BASE_URL) !== 0;
  // The footer is a night band in both themes: a site logo is its light wordmark.
  const logoUrl = config.INDIGO_LOGO_WHITE_URL || `${config.LMS_BASE_URL}/theming/asset/images/logo.png`;

  const messages = {
    "footer.logo.altText": {
      id: "footer.logo.altText",
      defaultMessage: brandName,
      description: "alt text for the footer logo.",
    },
    "footer.copyright.text": {
      id: "footer.copyright.text",
      defaultMessage: `© ${new Date().getFullYear()} ${brandName}. All Rights Reserved.`,
      description: "copyright text for the footer",
    },
  };

  return (
    <div className="wrapper wrapper-footer">
      <footer id="footer" className="tutor-container">
        <div className="footer-top">
          <div className="powered-area">
            <ul className="logo-list">
              <li>
                <a
                  href={brandUrl}
                  rel="noreferrer"
                  target={brandIsExternal ? "_blank" : undefined}
                >
                  <img
                    src={logoUrl}
                    alt={intl.formatMessage(messages["footer.logo.altText"])}
                    height="40"
                  />
                </a>
              </li>
            </ul>
          </div>
          <nav className="nav-colophon">
            <ol>
              {indigoFooterNavLinks.map((link) => (
                <li key={link.url}>
                  <a href={`${link.url.startsWith("http") ? link.url : config.LMS_BASE_URL + link.url}`}>{link.title}</a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
        <span className="copyright-site">
          {intl.formatMessage(messages["footer.copyright.text"])}
        </span>
      </footer>
    </div>
  );
};
