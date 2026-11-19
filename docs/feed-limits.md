# Channel and keyword limits

core-api caps each organisation's active channel feeds and total keywords (summed across active keyword feeds). `GET /api/media_feeds` returns the caps in `limits`.

The channels page shows "N of LIMIT used" under each section heading and disables the add button once the limit is reached. Usage is computed from the feeds already loaded, so it needs no extra request. Archived feeds do not count.

The API is the source of truth. If a create or edit goes over the limit (for example, adding several keywords to an existing feed), it returns a 400 and the dialog shows the API's message.

An organisation can have one active keyword feed per topic, so the add dialog only lists topics without one.

`limits` is optional in `MediaFeedsResponse` so the page still works against a core-api deployed before the limits existed. In that case no usage is shown.
