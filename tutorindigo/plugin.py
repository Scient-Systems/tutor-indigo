from __future__ import annotations

import itertools
import json
import os
import typing as t
from glob import glob

import importlib_resources
from tutor import hooks
from tutor.__about__ import __version_suffix__
from tutormfe.hooks import MFE_APPS, MFE_ATTRS_TYPE, PLUGIN_SLOTS

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
]

# All MFEs that need header component dependencies
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
# comes from PARAGON_THEME_URLS below — both point at the same fork.
NIGHT_QUEST_BRAND_REPO = "github:Scient-Systems/brand-openedx#ulmo/indigo"

brand_styled_mfes = indigo_styled_mfes + ["authn", "sqa-payment"]

for mfe in brand_styled_mfes:
    hooks.Filters.ENV_PATCHES.add_item(
        (
            f"mfe-dockerfile-post-npm-install-{mfe}",
            f"RUN npm install '@edx/brand@{NIGHT_QUEST_BRAND_REPO}'",
        )
    )

# Include js file in lms main.html, main_django.html, and certificate.html

hooks.Filters.ENV_PATCHES.add_items(
    [
        # for production
        (
            "openedx-common-assets-settings",
            """
javascript_files = ['base_application', 'application', 'certificates_wv']
dark_theme_filepath = ['indigo/js/dark-theme.js']

for filename in javascript_files:
    if filename in PIPELINE['JAVASCRIPT']:
        PIPELINE['JAVASCRIPT'][filename]['source_filenames'] += dark_theme_filepath
""",
        ),
        # for development
        (
            "openedx-lms-development-settings",
            """
javascript_files = ['base_application', 'application', 'certificates_wv']
dark_theme_filepath = ['indigo/js/dark-theme.js']

for filename in javascript_files:
    if filename in PIPELINE['JAVASCRIPT']:
        PIPELINE['JAVASCRIPT'][filename]['source_filenames'] += dark_theme_filepath

MFE_CONFIG['INDIGO_ENABLE_DARK_TOGGLE'] = {{ INDIGO_ENABLE_DARK_TOGGLE }}
MFE_CONFIG['INDIGO_FOOTER_NAV_LINKS'] = {{ INDIGO_FOOTER_NAV_LINKS }}
""",
        ),
        (
            "openedx-lms-production-settings",
            """
MFE_CONFIG['INDIGO_ENABLE_DARK_TOGGLE'] = {{ INDIGO_ENABLE_DARK_TOGGLE }}
MFE_CONFIG['INDIGO_FOOTER_NAV_LINKS'] = {{ INDIGO_FOOTER_NAV_LINKS }}
""",
        ),
    ]
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


for mfe in indigo_styled_mfes:
    PLUGIN_SLOTS.add_item(
        (
            mfe,
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
        ),
    )
    if mfe != "learning":
        PLUGIN_SLOTS.add_item(
            (
                mfe,
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
        )
        # DISABLED (2026-07-14): upstream indigo hid the default mobile header
        # ("it only shows logo") and replaced it with the logo-only
        # MobileViewHeader — but on header v6.6.0 (Ulmo) the default
        # mobile_header_slot contents are the full MobileHeader: hamburger
        # opening MobileMainMenuSlot (Courses / Discover New on the learner
        # dashboard, + the sqa Membership link injected by the sqa_payment
        # tutor plugin), logo_slot (already ThemedLogo), and the mobile user
        # menu. Hiding it left phones with no navigation at all.
        # PLUGIN_SLOTS.add_items(
        #     [
        #         (
        #             # Hide the default mobile header as it only shows logo
        #             mfe,
        #             "mobile_header_slot",
        #             """
        #         {
        #             op: PLUGIN_OPERATIONS.Hide,
        #             widgetId: 'default_contents',
        #         }
        #         """,
        #         ),
        #         (
        #             mfe,
        #             "mobile_header_slot",
        #             """
        #         {
        #             op: PLUGIN_OPERATIONS.Insert,
        #             widget: {
        #                 id: 'theme_switch_button',
        #                 type: DIRECT_PLUGIN,
        #                 RenderWidget: MobileViewHeader,
        #             },
        #         },
        #         """,
        #         ),
        #     ]
        # )

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

# Runtime brand CSS — core (structural overrides: header/footer/dashboard/…)
# AND the light/dark token variants.
#
# DO NOT use raw.githubusercontent.com here: it serves text/plain with
# X-Content-Type-Options: nosniff, so browsers silently refuse to apply it as
# a stylesheet (the old raw URLs below never worked — pages were riding on the
# stale CSS baked into the mfe image). jsDelivr serves proper text/css.
#
# BRAND_DIST_REF must be a COMMIT SHA: jsDelivr cannot parse the branch name
# (the slash in "ulmo/indigo" breaks its @ref syntax), and a SHA makes caching
# deterministic. ON EVERY brand-openedx PUSH: bump this SHA, then
# `tutor config save && tutor k8s start && kubectl -n openedx rollout restart
# deployment/lms` (no mfe image rebuild needed for CSS).
BRAND_DIST_REF = "27fc260658ca1e64120ec7c34ba52061aa81843b"
BRAND_DIST_CDN = f"https://cdn.jsdelivr.net/gh/Scient-Systems/brand-openedx@{BRAND_DIST_REF}"

paragon_theme_urls = {
    # $paragonVersion is substituted by frontend-platform with each MFE's own
    # installed paragon version.
    "core": {
        "urls": {
            "default": "https://cdn.jsdelivr.net/npm/@openedx/paragon@$paragonVersion/dist/core.min.css",
            "brandOverride": f"{BRAND_DIST_CDN}/dist/core.min.css",
        },
    },
    "variants": {
        "light": {
            "urls": {
                "default": f"{BRAND_DIST_CDN}/dist/light.min.css",
                "brandOverride": f"{BRAND_DIST_CDN}/dist/light.min.css",
            },
        },
        "dark": {
            "urls": {
                "default": f"{BRAND_DIST_CDN}/dist/dark.min.css",
                "brandOverride": f"{BRAND_DIST_CDN}/dist/dark.min.css",
            }
        },
    }
}

# Studio/authoring is deliberately unthemed (tool-dense surface — runbook 10).
# The global PARAGON_THEME_URLS above would otherwise let frontend-platform's
# built-in theming inside the authoring MFE honor the shared
# 'selected-paragon-theme-variant' localStorage key (same origin as the learner
# MFEs) and load dark.min.css, which has no authoring coverage: card titles and
# outline headings stay light-theme navy ink → unreadable on the dark
# background. Serving authoring a light-only variant set pins it to light
# regardless of the LMS toggle.
authoring_theme_urls = {
    "core": paragon_theme_urls["core"],
    "defaults": {"light": "light"},
    "variants": {"light": paragon_theme_urls["variants"]["light"]},
}

fstring = f"""
MFE_CONFIG["PARAGON_THEME_URLS"] = {json.dumps(paragon_theme_urls)}

try:
    MFE_CONFIG_OVERRIDES
except NameError:
    MFE_CONFIG_OVERRIDES = {{}}
MFE_CONFIG_OVERRIDES.setdefault("authoring", {{}})["PARAGON_THEME_URLS"] = {json.dumps(authoring_theme_urls)}
"""

hooks.Filters.ENV_PATCHES.add_item(("mfe-lms-common-settings", fstring))


@MFE_APPS.add()  # type: ignore
def _add_themed_logo(
    mfes: dict[str, MFE_ATTRS_TYPE],
) -> dict[str, MFE_ATTRS_TYPE]:
    for mfe in mfes:
        PLUGIN_SLOTS.add_item(
            (
                str(mfe),
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
        )

    return mfes
