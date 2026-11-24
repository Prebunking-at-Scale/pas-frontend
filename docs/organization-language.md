# Organisation language

Each organisation has one language, a two-letter code. It is set when a super admin creates the organisation and can be changed afterwards in two places.

Organisation admins change their own organisation's language in the settings form on `/admin`. The form sends the name and the language together in one `PATCH /api/auth/organisation`.

Super admins change any organisation's language on `/superadmin`: expand the organisation, pick a language and save. The request is the same `PATCH`, with `organisation_id` in the query string so core-api acts on that organisation instead of the one the super admin is logged in to. core-api only accepts `organisation_id` from super admins, so the settings form on `/admin` does not send it.

Both pages use `OrganizationLanguageSelect`. Its options come from `utils/organizationLanguages.ts`, which the create organisation dialog also uses. The list is the EU languages plus the other languages PAS organisations publish in. Each code is two letters, because that is all core-api accepts, so a language without a two-letter code (Montenegrin, for example) cannot be set. core-api accepts any two-letter code, so an organisation can hold a language that is not in the list. The select adds that code to its options so the current value is shown and saving the form does not change it.
