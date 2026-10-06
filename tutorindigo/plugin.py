from __future__ import annotations

import itertools
import json
import os
import typing as t
from glob import glob

import importlib_resources
from tutor import hooks
from tutor.__about__ import __version_suffix__
from tutormfe.hooks import FRONTEND_COMPAT_SLOTS, MFE_APPS, MFE_ATTRS_TYPE, PLUGIN_SLOTS

from .__about__ import __version__

# Handle version suffix in main mode, just like tutor core
if __version_suffix__:
    __version__ += "-" + __version_suffix__


################# Configuration
config: t.Dict[str, t.Dict[str, t.Any]] = {
    # Add here your new settings
    "defaults": {
        "VERSION": __version__,
        "WELCOME_MESSAGE": "Where curious minds become builders",
        "PRIMARY_COLOR": "#101A33",  # Meridian ink (deep navy)
        "ENABLE_DARK_TOGGLE": True,
        # Per-site brand. One theme and one set of images serve every site; a
        # site that is not Stem Quest Academy (the training demo) sets these.
        # The name in the footer and its logo link. An empty BRAND_URL links
        # the footer logo to the site's own home page.
        "BRAND_NAME": "Stem Quest Academy",
        "BRAND_URL": "https://stemquestacademy.com/",
        # A folder pair in brand-openedx: assets/<profile>/ and dist-<profile>/
        # (that palette's stylesheets). Empty = the logo in the image and dist/.
        # The assets folder holds logo-white.png (light wordmark: the header,
        # footer and login page are night bands in both themes, so this is the
        # one shown on the site), logo.png (dark wordmark, for light surfaces:
        # emails and the printed certificate) and mark.png (favicon).
        "BRAND_PROFILE": "",
        # Catalog banner line. Empty = the default in SqaCatalog.jsx.
        "CATALOG_HEADLINE": "",
        # Membership panel, Membership menu link and the plan picker redirect.
        "SHOW_MEMBERSHIP": True,
        # AI token card on the profile page.
        "SHOW_AI_TOKENS": True,
        # The mode a visitor starts in before choosing one: "dark" or "light".
        # The toggle and a saved choice always win.
        "DEFAULT_THEME": "dark",
        # Footer links are dictionaries with a "title" and "url"
        # To remove all links, run:
        # tutor config save --set INDIGO_FOOTER_NAV_LINKS=[]
        "FOOTER_NAV_LINKS": [
            {"title": "About Us", "url": "/about"},
            {"title": "Blog", "url": "/blog"},
            {"title": "Donate", "url": "/donate"},
            {"title": "Terms of Service", "url": "/tos"},
            {"title": "Privacy Policy", "url": "/privacy"},
            {"title": "Help", "url": "/help"},
            {"title": "Contact Us", "url": "/contact"},
        ],
    },
    "unique": {},
    "overrides": {},
}

# Theme templates
hooks.Filters.ENV_TEMPLATE_ROOTS.add_item(
    str(importlib_resources.files("tutorindigo") / "templates")
)
# This is where the theme is rendered in the openedx build directory
hooks.Filters.ENV_TEMPLATE_TARGETS.add_items(
    [
        ("indigo", "build/openedx/themes"),
        ("indigo/env.config.jsx", "plugins/mfe/build/mfe"),
    ],
)

# Force the rendering of scss files, even though they are included in a
# "partials" directory
hooks.Filters.ENV_PATTERNS_INCLUDE.add_items(
    [
        r"indigo/lms/static/sass/partials/lms/theme/",
        r"indigo/cms/static/sass/partials/cms/theme/",
    ]
)


# init script: set theme automatically
with open(
    os.path.join(
        str(importlib_resources.files("tutorindigo") / "templates"),
        "indigo",
        "tasks",
        "init.sh",
    ),
    encoding="utf-8",
) as task_file:
    hooks.Filters.CLI_DO_INIT_TASKS.add_item(("lms", task_file.read()))


# Override openedx & mfe docker image names
@hooks.Filters.CONFIG_DEFAULTS.add(priority=hooks.priorities.LOW)
def _override_openedx_docker_image(
    items: list[tuple[str, t.Any]],
) -> list[tuple[str, t.Any]]:
    openedx_image = ""
    mfe_image = ""
    for k, v in items:
        if k == "DOCKER_IMAGE_OPENEDX":
            openedx_image = v
        elif k == "MFE_DOCKER_IMAGE":
            mfe_image = v
    if openedx_image:
        items.append(("DOCKER_IMAGE_OPENEDX", f"{openedx_image}-indigo"))
    if mfe_image:
        items.append(("MFE_DOCKER_IMAGE", f"{mfe_image}-indigo"))
    return items


# Load all configuration entries
hooks.Filters.CONFIG_DEFAULTS.add_items(
    [(f"INDIGO_{key}", value) for key, value in config["defaults"].items()]
)
hooks.Filters.CONFIG_UNIQUE.add_items(
    [(f"INDIGO_{key}", value) for key, value in config["unique"].items()]
)
hooks.Filters.CONFIG_OVERRIDES.add_items(list(config["overrides"].items()))


#  MFEs that are styled using Indigo
indigo_styled_mfes = [
    "learning",
    "learner-dashboard",
    "profile",
    "account",
    "discussions",
    "authoring",
    # SQA: on Verawood the Catalog MFE is the homepage, so it needs the same
    # header, footer and brand package as everything else. Upstream v22.0.0
    # does not style it.
    "catalog",
]

# All MFEs that need header component dependencies. Our header/footer and the
# Sqa* dashboard widgets import these, so they must exist in every MFE we style.
all_mfes_needing_deps = [
    "learning",
    "learner-dashboard",
    "profile",
    "account",
    "discussions",
    "authn",
    "admin-console",
    "authoring",
    "gradebook",
    "ora-grading",
    "communications",
    "catalog",
]

mfe_deps_install = "RUN npm install react-responsive @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons @fortawesome/fontawesome-svg-core"

for mfe in all_mfes_needing_deps:
    hooks.Filters.ENV_PATCHES.add_item(
        (
            f"mfe-dockerfile-post-npm-install-{mfe}",
            mfe_deps_install,
        )
    )

# Night Quest brand: bake the SQA brand package (fonts, night chrome header,
# cosmic login, footer) into each styled MFE at build time. Runtime token CSS
# comes from PARAGON_THEME_URLS below - both point at the same fork.
# NOTE: this is the VERAWOOD branch of the brand fork, not ulmo/indigo. The two
# lines must move together; see openedx-deploy/versions.yml (also_pinned_at).
NIGHT_QUEST_BRAND_REPO = "github:Scient-Systems/brand-openedx#verawood/indigo"

brand_styled_mfes = indigo_styled_mfes + ["authn", "sqa-payment"]

for mfe in brand_styled_mfes:
    hooks.Filters.ENV_PATCHES.add_item(
        (
            f"mfe-dockerfile-post-npm-install-{mfe}",
            f"RUN npm install '@edx/brand@{NIGHT_QUEST_BRAND_REPO}'",
        )
    )

# Add react components and patches from tutor-indigo
for path in itertools.chain(
    glob(
        os.path.join(str(importlib_resources.files("tutorindigo") / "components"), "*")
    ),
    glob(os.path.join(str(importlib_resources.files("tutorindigo") / "patches"), "*")),
):
    with open(path, encoding="utf-8") as patch_file:
        hooks.Filters.ENV_PATCHES.add_item((os.path.basename(path), patch_file.read()))


INDIGO_FOOTER_SLOT = (
    "org.openedx.frontend.layout.footer.v1",
    """
    {
        op: PLUGIN_OPERATIONS.Hide,
        widgetId: 'default_contents',
    },
    {
        op: PLUGIN_OPERATIONS.Insert,
        widget: {
            id: 'indigo_footer',
            type: DIRECT_PLUGIN,
            priority: 1,
            RenderWidget: IndigoFooter,
        },
    },
    {
        op: PLUGIN_OPERATIONS.Insert,
        widget: {
            id: 'read_theme_cookie',
            type: DIRECT_PLUGIN,
            priority: 2,
            RenderWidget: AddDarkTheme,
        },
    },
""",
)

INDIGO_FOOTER_COMPAT_SLOT = (
    "org.openedx.frontend.layout.footer.v1",
    """
    {
        op: PLUGIN_OPERATIONS.Insert,
        widget: {
            id: 'indigo_footer',
            type: DIRECT_PLUGIN,
            priority: 1,
            RenderWidget: IndigoFooter,
        },
    },
""",
)

INDIGO_DESKTOP_SECONDARY_MENU_SLOT = (
    "desktop_secondary_menu_slot",
    """
    {
        op: PLUGIN_OPERATIONS.Insert,
        widget: {
            id: 'theme_switch_button',
            type: DIRECT_PLUGIN,
            RenderWidget: ToggleThemeButton,
        },
    },
""",
)

# SQA: theme toggle inside the mobile hamburger panel. The desktop toggle lives in
# desktop_secondary_menu_slot, which never renders on mobile, so without this there
# is no way to switch theme on a phone.
SQA_MOBILE_THEME_TOGGLE_SLOT = (
    "org.openedx.frontend.layout.header_mobile_main_menu.v1",
    """
    {
        op: PLUGIN_OPERATIONS.Insert,
        widget: {
            id: 'theme_switch_button_mobile',
            type: DIRECT_PLUGIN,
            RenderWidget: ToggleThemeButton,
        },
    },
""",
)

# Hide the default mobile header (it only shows the logo) and replace it.
# SQA: NOT APPLIED - see the loop below. Upstream hides the default mobile header
# and swaps in the logo-only MobileViewHeader. On Ulmo's header the default
# contents were the FULL mobile header (hamburger -> main menu, including the
# Membership link injected by the sqa_payment plugin, plus the mobile user menu),
# so hiding it left phones with no navigation at all (found 2026-07-14).
# Kept defined because FRONTEND_COMPAT_SLOTS below still references it.
# TODO(verawood): re-check on the v22 header - if upstream fixed the default
# contents, we can drop our override and take theirs.
INDIGO_MOBILE_HEADER_SLOT = (
    "mobile_header_slot",
    """
    {
        op: PLUGIN_OPERATIONS.Hide,
        widgetId: 'default_contents',
    },
    {
        op: PLUGIN_OPERATIONS.Insert,
        widget: {
            id: 'theme_switch_button',
            type: DIRECT_PLUGIN,
            RenderWidget: MobileViewHeader,
        },
    },
""",
)

INDIGO_LOGO_SLOT = (
    "logo_slot",
    """
    {
        op: PLUGIN_OPERATIONS.Hide,
        widgetId: 'default_contents',
    },
    {
        op: PLUGIN_OPERATIONS.Insert,
        widget: {
            id: 'custom_logo',
            type: DIRECT_PLUGIN,
            RenderWidget: ThemedLogo,
        }
    }
""",
)

# Frontend-base site compatibility
FRONTEND_COMPAT_SLOTS.add_item(("all", *INDIGO_FOOTER_COMPAT_SLOT))
FRONTEND_COMPAT_SLOTS.add_item(("all", *INDIGO_DESKTOP_SECONDARY_MENU_SLOT))
FRONTEND_COMPAT_SLOTS.add_item(("all", *INDIGO_MOBILE_HEADER_SLOT))
FRONTEND_COMPAT_SLOTS.add_item(("all", *INDIGO_LOGO_SLOT))

for mfe in indigo_styled_mfes:
    PLUGIN_SLOTS.add_item((mfe, *INDIGO_FOOTER_SLOT))
    if mfe != "learning":
        PLUGIN_SLOTS.add_item((mfe, *INDIGO_DESKTOP_SECONDARY_MENU_SLOT))
        # SQA: ours, instead of upstream's INDIGO_MOBILE_HEADER_SLOT. See the note
        # on that constant - upstream's version removes phone navigation.
        PLUGIN_SLOTS.add_item((mfe, *SQA_MOBILE_THEME_TOGGLE_SLOT))

PLUGIN_SLOTS.add_items(
    [
        (
            # Hide the default Help Link added in plugin slot
            "learning",
            "learning_help_slot",
            """
        {
            op: PLUGIN_OPERATIONS.Hide,
            widgetId: 'default_contents',
        }
        """,
        ),
        (
            "learning",
            "learning_help_slot",
            """
        {
            op: PLUGIN_OPERATIONS.Insert,
            widget: {
                id: 'theme_switch_button',
                type: DIRECT_PLUGIN,
                RenderWidget: ToggleThemeButton,
            },
        },
        """,
        ),
    ]
)

PLUGIN_SLOTS.add_items(
    [
        (
            "authoring",
            "org.openedx.frontend.layout.studio_header_search_button_slot.v1",
            """
        {
            op: PLUGIN_OPERATIONS.Insert,
            widget: {
                priority: 10,
                id: 'custom_notification_tray_before',
                type: DIRECT_PLUGIN,
                RenderWidget: ToggleThemeButton,
            },
        },
        """,
        ),
        (
            "authoring",
            "org.openedx.frontend.layout.studio_footer.v1",
            """
            {
                op: PLUGIN_OPERATIONS.Insert,
                widget: {
                    id: 'read_theme_cookie',
                    type: DIRECT_PLUGIN,
                    priority: 2,
                    RenderWidget: AddDarkTheme,
                },
            },
        """,
        ),
    ]
)

# Catalog MFE homepage (Verawood): our banner and course list replace the stock
# ones, and the full catalog page reuses the same card. Components live in
# tutorindigo/components/SqaCatalog.jsx; styles in brand-openedx
# paragon/_catalog.scss. Data comes from the LMS course search, with level and
# tags indexed by sqa_django_app.
PLUGIN_SLOTS.add_items(
    [
        (
            "catalog",
            "org.openedx.frontend.catalog.home_page.banner",
            """
        {
            op: PLUGIN_OPERATIONS.Hide,
            widgetId: 'default_contents',
        },
        {
            op: PLUGIN_OPERATIONS.Insert,
            widget: {
                id: 'sqa_catalog_banner',
                type: DIRECT_PLUGIN,
                RenderWidget: SqaCatalogBanner,
            },
        },
        """,
        ),
        (
            "catalog",
            "org.openedx.frontend.catalog.home_page.courses_list",
            """
        {
            op: PLUGIN_OPERATIONS.Hide,
            widgetId: 'default_contents',
        },
        {
            op: PLUGIN_OPERATIONS.Insert,
            widget: {
                id: 'sqa_catalog_list',
                type: DIRECT_PLUGIN,
                RenderWidget: SqaCatalogList,
            },
        },
        """,
        ),
        (
            # /courses: the stock page (square-checkbox filter sidebar, Audit,
            # Organizations...) is replaced by the same list as the homepage.
            # Its slots all sit inside a fixed-width container, so this is a light
            # page with a title and search rather than the full-bleed banner.
            "catalog",
            "org.openedx.frontend.catalog.course_catalog_page.intro",
            """
        {
            op: PLUGIN_OPERATIONS.Hide,
            widgetId: 'default_contents',
        },
        {
            op: PLUGIN_OPERATIONS.Insert,
            widget: {
                id: 'sqa_catalog_courses_page',
                type: DIRECT_PLUGIN,
                RenderWidget: SqaCatalogCoursesPage,
            },
        },
        """,
        ),
        (
            "catalog",
            "org.openedx.frontend.catalog.course_catalog_page.search_field",
            """
        {
            op: PLUGIN_OPERATIONS.Hide,
            widgetId: 'default_contents',
        },
        """,
        ),
        (
            "catalog",
            "org.openedx.frontend.catalog.course_catalog_page.data_table",
            """
        {
            op: PLUGIN_OPERATIONS.Hide,
            widgetId: 'default_contents',
        },
        """,
        ),
        (
            # Course about page: no price row. Access is by membership plan,
            # so a per-course price ("Free") is wrong for every course.
            "catalog",
            "org.openedx.frontend.catalog.course_about_page.sidebar.details.course_price",
            """
        {
            op: PLUGIN_OPERATIONS.Hide,
            widgetId: 'default_contents',
        },
        """,
        ),
        (
            # Course about page: our enroll button shows the membership
            # requirement and why a learner can't enroll, where the stock one
            # says only "An error occurred". SqaCourseAboutEnroll.jsx.
            "catalog",
            "org.openedx.frontend.catalog.course_about_page.enrollment_button",
            """
        {
            op: PLUGIN_OPERATIONS.Hide,
            widgetId: 'default_contents',
        },
        {
            op: PLUGIN_OPERATIONS.Insert,
            widget: {
                id: 'sqa_course_about_enroll',
                type: DIRECT_PLUGIN,
                RenderWidget: SqaCourseAboutEnroll,
            },
        },
        """,
        ),
    ]
)

# One header main menu in every MFE with the standard header (SqaHeaderNav.jsx).
# Without it each MFE showed its own: the catalog lost Membership, the payment
# MFE lost Discover New and Membership. The sqa_payment plugin's own Membership
# and Pathways links (learner dashboard only) are hidden in
# patches/mfe-env-config-runtime-final, since SqaMainMenu has both.
SQA_HEADER_NAV_MFES = ["learner-dashboard", "catalog", "profile", "account", "sqa-payment"]

for mfe in SQA_HEADER_NAV_MFES:
    for slot, suffix in (
        ("org.openedx.frontend.layout.header_desktop_main_menu.v1", ""),
        ("org.openedx.frontend.layout.header_mobile_main_menu.v1", "-mobile"),
    ):
        PLUGIN_SLOTS.add_item(
            (
                mfe,
                slot,
                f"""
        {{
            op: PLUGIN_OPERATIONS.Hide,
            widgetId: 'default_contents',
        }},
        {{
            op: PLUGIN_OPERATIONS.Insert,
            widget: {{
                id: 'sqa_main_menu{suffix}',
                type: DIRECT_PLUGIN,
                priority: 1,
                RenderWidget: SqaMainMenu,
            }},
        }},
        """,
            )
        )

# Level order for the catalog. SQA_CATALOG_LEVELS is set by sqa_django_app; the
# guard keeps this theme working on a platform without it (levels then show in
# the order the search index returns them).
hooks.Filters.ENV_PATCHES.add_item(
    (
        "mfe-lms-common-settings",
        """
if "SQA_CATALOG_LEVELS" in globals():
    MFE_CONFIG["SQA_CATALOG_LEVELS"] = SQA_CATALOG_LEVELS
""",
    )
)

# Flight-deck redesign widgets for the learner dashboard (Meridian/Grove).
# Components live in tutorindigo/components/Sqa*.jsx and are styled by
# brand-openedx paragon/_dashboard.scss.
PLUGIN_SLOTS.add_items(
    [
        (
            # Hero band (greeting + resume runway + stat strip) above the
            # stock course list. priority 1 renders it before default_contents
            # (priority 50); CSS `order` lifts it above the panel heading.
            "learner-dashboard",
            "org.openedx.frontend.learner_dashboard.course_list.v1",
            """
        {
            op: PLUGIN_OPERATIONS.Insert,
            widget: {
                id: 'sqa_dashboard_hero',
                type: DIRECT_PLUGIN,
                priority: 1,
                RenderWidget: SqaDashboardHero,
            },
        },
        """,
        ),
        (
            # Replace the stock "Looking for a challenge?" sidebar card with
            # the membership instrument rail (live sqa plugin API data).
            "learner-dashboard",
            "org.openedx.frontend.learner_dashboard.widget_sidebar.v1",
            """
        {
            op: PLUGIN_OPERATIONS.Hide,
            widgetId: 'default_contents',
        },
        {
            op: PLUGIN_OPERATIONS.Insert,
            widget: {
                id: 'sqa_membership_instrument',
                type: DIRECT_PLUGIN,
                RenderWidget: SqaMembershipInstrument,
            },
        },
        {
            // Sends verified users who haven't picked a plan to the plans
            // page. Renders nothing. SqaPlanRedirect.jsx.
            op: PLUGIN_OPERATIONS.Insert,
            widget: {
                id: 'sqa_plan_redirect',
                type: DIRECT_PLUGIN,
                RenderWidget: SqaPlanRedirect,
            },
        },
        """,
        ),
        (
            # Course-end page: our course-complete screen instead of the stock
            # celebration (Open edX certificate art, alert colours). The stock
            # body is hidden by brand-openedx _course-exit.scss. Needs the
            # courseware.microfrontend_course_exit_page waffle flag, which is
            # what makes the last unit's Next button lead here.
            "learning",
            "org.openedx.frontend.learning.course_exit_view_courses.v1",
            """
        {
            op: PLUGIN_OPERATIONS.Hide,
            widgetId: 'default_contents',
        },
        {
            op: PLUGIN_OPERATIONS.Insert,
            widget: {
                id: 'sqa_course_complete',
                type: DIRECT_PLUGIN,
                RenderWidget: SqaCourseComplete,
            },
        },
        """,
        ),
        (
            # AI token card in the profile form (below Education field).
            "profile",
            "org.openedx.frontend.profile.additional_profile_fields.v1",
            """
        {
            op: PLUGIN_OPERATIONS.Insert,
            widget: {
                id: 'sqa_token_card',
                type: DIRECT_PLUGIN,
                RenderWidget: SqaTokenCard,
            },
        },
        """,
        ),
        (
            # Designed empty state (ghost wordmark + catalog CTA).
            "learner-dashboard",
            "org.openedx.frontend.learner_dashboard.no_courses_view.v1",
            """
        {
            op: PLUGIN_OPERATIONS.Hide,
            widgetId: 'default_contents',
        },
        {
            op: PLUGIN_OPERATIONS.Insert,
            widget: {
                id: 'sqa_dashboard_empty',
                type: DIRECT_PLUGIN,
                RenderWidget: SqaDashboardEmptyState,
            },
        },
        """,
        ),
    ]
)

# Runtime token CSS, served from OUR brand fork rather than edly-io's.
#
# DO NOT use raw.githubusercontent.com here: it serves text/plain with
# X-Content-Type-Options: nosniff, so browsers silently refuse to apply it as a
# stylesheet. Upstream v22 ships raw URLs for paragon_theme_urls; we override
# them for that reason. jsDelivr serves proper text/css.
#
# BRAND_DIST_REF must be a COMMIT SHA: jsDelivr cannot parse the branch name
# (the slash in "verawood/indigo" breaks its @ref syntax), and a SHA makes
# caching deterministic. ON EVERY brand-openedx PUSH: bump this SHA, then
# `tutor config save && tutor k8s start && kubectl -n <ns> rollout restart
# deployment/lms` (no mfe image rebuild needed for CSS).
#
# This is the tip of Scient-Systems/brand-openedx verawood/indigo. Keep it in
# step with versions.yml (also_pinned_at: BRAND_DIST_REF).
BRAND_DIST_REF = "e4a2fdb6d4f1da3ca20537fa7972481611a6e4b0"
BRAND_DIST_CDN = f"https://cdn.jsdelivr.net/gh/Scient-Systems/brand-openedx@{BRAND_DIST_REF}"
# Rendered by Tutor per site: "dist", or "dist-<INDIGO_BRAND_PROFILE>" for a site
# with its own palette. Not an f-string: the braces are Jinja's.
BRAND_DIST_DIR = "{{ 'dist-' ~ INDIGO_BRAND_PROFILE if INDIGO_BRAND_PROFILE else 'dist' }}"
BRAND_PROFILE_ASSETS = BRAND_DIST_CDN + "/assets/{{ INDIGO_BRAND_PROFILE }}"

# Which theme a visitor gets before they have chosen one. frontend-platform
# (v8.7 useParagonTheme.getDefaultThemeVariant) picks, in order: the only
# variant if just one is configured; the visitor's saved choice; the "dark"
# default if their system prefers dark; otherwise the "light" default.
# Pointing BOTH defaults at dark makes everyone start dark, while the toggle
# (shown to logged-in users) can still switch to light. For dark ONLY, drop the
# "light" entry from paragon_theme_urls["variants"] and set
# INDIGO_ENABLE_DARK_TOGGLE to False so the toggle isn't a dead button.
# INDIGO_DEFAULT_THEME, rendered per site by Tutor (the braces are Jinja's).
# Both entries carry it, so the starting mode does not depend on the system.
DEFAULT_THEME_LIGHT_ENTRY = "{{ INDIGO_DEFAULT_THEME }}"
DEFAULT_THEME_DARK_ENTRY = "{{ 'light' if INDIGO_DEFAULT_THEME == 'light' else 'dark' }}"

paragon_theme_urls = {
    # $paragonVersion is substituted by frontend-platform with each MFE's own
    # installed paragon version.
    "core": {
        "urls": {
            "default": "https://cdn.jsdelivr.net/npm/@openedx/paragon@$paragonVersion/dist/core.min.css",
            "brandOverride": f"{BRAND_DIST_CDN}/{BRAND_DIST_DIR}/core.min.css",
        },
    },
    "defaults": {
        "light": DEFAULT_THEME_LIGHT_ENTRY,
        "dark": DEFAULT_THEME_DARK_ENTRY,
    },
    "variants": {
        "light": {
            "urls": {
                "default": f"{BRAND_DIST_CDN}/{BRAND_DIST_DIR}/light.min.css",
                "brandOverride": f"{BRAND_DIST_CDN}/{BRAND_DIST_DIR}/light.min.css",
            },
        },
        "dark": {
            "urls": {
                "default": f"{BRAND_DIST_CDN}/{BRAND_DIST_DIR}/dark.min.css",
                "brandOverride": f"{BRAND_DIST_CDN}/{BRAND_DIST_DIR}/dark.min.css",
            }
        },
    },
}

# New in v22: the frontend-base "site" reads its theme from here rather than
# from PARAGON_THEME_URLS. Same brand fork, same SHA pin, different shape.
frontend_base_theme = {
    "core": {
        "url": f"{BRAND_DIST_CDN}/{BRAND_DIST_DIR}/core.min.css",
    },
    "defaults": {
        "light": DEFAULT_THEME_LIGHT_ENTRY,
        "dark": DEFAULT_THEME_DARK_ENTRY,
    },
    "variants": {
        "light": {
            "url": f"{BRAND_DIST_CDN}/{BRAND_DIST_DIR}/light.min.css",
        },
        "dark": {
            "url": f"{BRAND_DIST_CDN}/{BRAND_DIST_DIR}/dark.min.css",
        },
    },
}

hooks.Filters.CONFIG_DEFAULTS.add_item(("PARAGON_THEME_URLS", paragon_theme_urls))

hooks.Filters.ENV_PATCHES.add_item(
    (
        "mfe-lms-common-settings",
        """
MFE_CONFIG["PARAGON_THEME_URLS"] = {{ PARAGON_THEME_URLS }}
FRONTEND_SITE_CONFIG.setdefault("commonAppConfig", {})
FRONTEND_SITE_CONFIG["theme"] = """
        + json.dumps(frontend_base_theme)
        + """
FRONTEND_SITE_CONFIG["commonAppConfig"]["PARAGON_THEME_URLS"] = {{ PARAGON_THEME_URLS }}
FRONTEND_SITE_CONFIG["commonAppConfig"][
    "INDIGO_ENABLE_DARK_TOGGLE"
] = {{ INDIGO_ENABLE_DARK_TOGGLE }}
FRONTEND_SITE_CONFIG["commonAppConfig"][
    "INDIGO_FOOTER_NAV_LINKS"
] = {{ INDIGO_FOOTER_NAV_LINKS }}
""",
    )
)

# Per-site brand, read at runtime: by the MFE components through the MFE config
# API and by the LMS templates through Django settings. Runtime because the
# images are built once for every site; nothing here is baked into them.
_BRAND_MFE_KEYS = """
{name}["INDIGO_BRAND_NAME"] = {{{{ INDIGO_BRAND_NAME | tojson }}}}
{name}["INDIGO_BRAND_URL"] = {{{{ INDIGO_BRAND_URL | tojson }}}}
{name}["INDIGO_SHOW_MEMBERSHIP"] = {{{{ INDIGO_SHOW_MEMBERSHIP }}}}
{name}["INDIGO_SHOW_AI_TOKENS"] = {{{{ INDIGO_SHOW_AI_TOKENS }}}}
{{% if INDIGO_CATALOG_HEADLINE %}}
{name}["SQA_CATALOG_HEADLINE"] = {{{{ INDIGO_CATALOG_HEADLINE | tojson }}}}
{{% endif %}}
{{% if INDIGO_BRAND_PROFILE %}}
{name}["INDIGO_LOGO_WHITE_URL"] = "{assets}/logo-white.png"
{name}["LOGO_URL"] = "{assets}/logo-white.png"
{name}["LOGO_WHITE_URL"] = "{assets}/logo-white.png"
{name}["LOGO_TRADEMARK_URL"] = "{assets}/logo-white.png"
{name}["FAVICON_URL"] = "{assets}/mark.png"
{{% endif %}}
"""
hooks.Filters.ENV_PATCHES.add_item(
    (
        "mfe-lms-common-settings",
        _BRAND_MFE_KEYS.format(name="MFE_CONFIG", assets=BRAND_PROFILE_ASSETS)
        + _BRAND_MFE_KEYS.format(
            name='FRONTEND_SITE_CONFIG["commonAppConfig"]', assets=BRAND_PROFILE_ASSETS
        ),
    )
)
_BRAND_LMS_SETTINGS = """
INDIGO_BRAND_NAME = {{{{ INDIGO_BRAND_NAME | tojson }}}}
INDIGO_BRAND_URL = {{{{ INDIGO_BRAND_URL | tojson }}}}
{{% if INDIGO_BRAND_PROFILE %}}
INDIGO_LOGO_URL = "{assets}/logo.png"
INDIGO_LOGO_WHITE_URL = "{assets}/logo-white.png"
LOGO_URL = INDIGO_LOGO_WHITE_URL
LOGO_URL_PNG = INDIGO_LOGO_URL
{{% endif %}}
"""
hooks.Filters.ENV_PATCHES.add_item(
    (
        "openedx-lms-common-settings",
        _BRAND_LMS_SETTINGS.format(assets=BRAND_PROFILE_ASSETS),
    )
)


@MFE_APPS.add()  # type: ignore
def _add_themed_logo(
    mfes: dict[str, MFE_ATTRS_TYPE],
) -> dict[str, MFE_ATTRS_TYPE]:
    for mfe in mfes:
        PLUGIN_SLOTS.add_item((str(mfe), *INDIGO_LOGO_SLOT))

    return mfes
