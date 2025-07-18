# The Project

We're building a frontend for a project that retrieves videos from social networks, analyses them using AI, extracts claims and looks for common narrative between all contents processed. Our frontend aims to show the results in a simple, streamlined way, with the focus on this:

* Actors of those narratives
* Entities mentioned on the narratives
* Topics of the narratives received
* Individual videos analised, with basic info (views, comments…)
* Claims extracted from each video
* Narratives found across claims and videos

# Framework

- Nuxt.js
- Tailwind
- Shadcn/vue for UI components

# Workflow and guidelines

* Make sure not to harcode texts. Use the Nuxt i18n module. All texts should be translated to en, de, fr and es.
* Prefer reusable components.
* Document all decisions in the /docs folder.

# API

This is the link to the openapi.json file describing the API: https://8000--main--pas-backend--dfernandez.coder.fundacionmaldita.es/schema/openapi.json

# Bash commands

- pnpm dev: Build the project and listen for changes - assume it's running and watching for changes.
