
const IndigoFooter = () => {
  const intl = useIntl();
  const config = getConfig();

  const indigoFooterNavLinks = config.INDIGO_FOOTER_NAV_LINKS || [];

  const messages = {
    "footer.logo.altText": {
      id: "footer.logo.altText",
      defaultMessage: "Stem Quest Academy",
      description: "alt text for the footer logo.",
    },
    "footer.copyright.text": {
      id: "footer.copyright.text",
      defaultMessage: `© ${new Date().getFullYear()} Stem Quest Academy. All Rights Reserved.`,
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
                  href="https://stemquestacademy.com/"
                  rel="noreferrer"
                  target="_blank"
                >
                  <img
                    src={`${config.LMS_BASE_URL}/theming/asset/images/logo.png`}
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
