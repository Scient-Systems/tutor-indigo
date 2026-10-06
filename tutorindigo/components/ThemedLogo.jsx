
const ThemedLogo = () => {
  const BASE_URL = getConfig().LMS_BASE_URL;
  // A site with its own brand profile serves its logo from brand-openedx. The
  // header is a night band in both themes, so that is its light wordmark.
  const siteLogo = getConfig().INDIGO_LOGO_WHITE_URL;
  const logoUrl = siteLogo || `${BASE_URL}/static/indigo/images/logo.png`;
  const logoWhiteUrl = siteLogo || `${BASE_URL}/static/indigo/images/logo-white.png`;
  const brandName = getConfig().INDIGO_BRAND_NAME || getConfig().SITE_NAME || "Home";
  // A site that hides registration (SHOW_REGISTRATION_LINKS false) should not
  // offer Sign Up in the header either; the stock header shows it regardless.
  const hideSignUp = getConfig().SHOW_REGISTRATION_LINKS === false;

  return (
    <>
      <style>
        {`
          #root header .logo-image.logo-white {
            display: none;
          }
          [data-paragon-theme-variant="dark"] #root header .logo-image {
            display: none;
          }
          [data-paragon-theme-variant="dark"] #root header .logo-white {
            display: block;
          }
          ${hideSignUp ? '#root header a[href*="/register"] { display: none; }' : ''}
        `}
      </style>
      <a href={`${BASE_URL}/dashboard`} title={brandName} className="logo">
        <img className="logo-image" src={logoUrl} alt={brandName} />
        <img className="logo-image logo-white" src={logoWhiteUrl} alt={brandName} />
      </a>
    </>
  );
};
