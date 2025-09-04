export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  
  // Get the path after /api/
  const path = event.node.req.url?.replace(/^\/api\//, '') || '';
  
  // Build the backend URL
  const backendUrl = `${config.backendEndpoint}/api/${path}`;
  
  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Special handling for /auth/organisation/invite
  if (path === 'auth/organisation/invite' || path.startsWith('auth/organisation/invite?')) {
    // Check if this is a superadmin creating a new organization
    // If organisation_id is in query params, it's a superadmin creating for a new org
    const query = getQuery(event);
    if (query.organisation_id) {
      // Superadmin creating invitation for a new organization - use X-API-TOKEN
      headers['X-API-TOKEN'] = config.apiKey;
    } else {
      // Regular admin inviting to their current organization - use Bearer token
      const authHeader = event.node.req.headers.authorization;
      if (authHeader) {
        headers['Authorization'] = authHeader;
      }
    }
  } 
  // For other /auth and /alerts endpoints, forward the user's Bearer token if present
  else if (path.startsWith('auth/') || path.startsWith('alerts')) {
    const authHeader = event.node.req.headers.authorization;
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
  } 
  // For all other endpoints, use the API key
  else {
    headers['X-API-TOKEN'] = config.apiKey;
  }
  
  // Forward the request to the backend
  try {
    const response = await $fetch.raw(backendUrl, {
      method: event.node.req.method,
      headers,
      // Forward query parameters
      query: getQuery(event),
      // Forward body for POST/PUT/PATCH requests
      body: event.node.req.method !== 'GET' && event.node.req.method !== 'HEAD' 
        ? await readBody(event) 
        : undefined,
    });
    
    // Return the response with the same status code
    setResponseStatus(event, response.status);
    
    // Forward response headers if needed
    if (response.headers.get('content-type')) {
      setHeader(event, 'content-type', response.headers.get('content-type') as string);
    }
    
    return response._data;
  } catch (error: any) {
    // Handle errors
    console.error('Proxy error:', error);
    
    // Forward error status if available
    if (error.statusCode) {
      setResponseStatus(event, error.statusCode);
    } else {
      setResponseStatus(event, 500);
    }
    
    return {
      error: error.message || 'Internal server error',
      statusCode: error.statusCode || 500
    };
  }
});