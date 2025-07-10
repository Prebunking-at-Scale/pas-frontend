# Build base

The task you're assigned is to build the base of the application structure, together with the navigation.

The flow should be this one

1) The user access the project and is prompted to log in (create the mock for this page but allow bypassing authentication for the time being since we still don't have a functional authentication endpoint)
2) The user access to the main dashboard. The main layout has a sidebar and a main section for the content. Please refer to the images inside the planning/images folder to see how it should be. 
3) For now, we have the main dashboard view, the narratives list view and the narrative detail view. Create the reusable components for topics, entities, actors, viral narratives card and prevalent narratives cards. The narratives list must allow filtering by channnel (Instagram/TikTok/Youtube), languages (still don't know what languages will be available), date, actors, entities, topics and keywords. 
4) We should also have a section for configure alerts. Mock the content because we still don't have the view or the details. 
5) We should also have a section to edit the user profile. Mock the content because we still don't have endpoints or details.
6) Mock data for everything. To obtain that mocked data, implement the API according to the documentation available and make methods returning mock data. 
