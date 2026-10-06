
const ThemedLogo = () => {
  const BASE_URL = getConfig().LMS_BASE_URL;
  // A site with its own brand profile serves its logos from brand-openedx.
  const logoUrl = getConfig().INDIGO_LOGO_URL || `${BASE_URL}/static/indigo/images/logo.png`;
  const logoWhiteUrl = getConfig().INDIGO_LOGO_WHITE_URL || `${BASE_URL}/static/indigo/images/logo-white.png`;
  const brandName = getConfig().INDIGO_BRAND_NAME || getConfig().SITE_NAME || "Home";

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
        `}
      </style>
      <a href={`${BASE_URL}/dashboard`} title={brandName} className="logo">
        <img className="logo-image" src={logoUrl} alt={brandName} />
        <img className="logo-image logo-white" src={logoWhiteUrl} alt={brandName} />
      </a>
    </>
  );
};
