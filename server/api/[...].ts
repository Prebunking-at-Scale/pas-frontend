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

  // Check if this is a PATCH or POST request to /api/claims or /api/narratives
  // These requests come from the Narratives API
  const method = event.node.req.method;
  const isClaimsOrNarrativesEndpoint = path.startsWith('claims') || path.startsWith('narratives');
  const isPatchOrPost = method === 'PATCH' || method === 'POST';

  if (isClaimsOrNarrativesEndpoint && isPatchOrPost) {
    const xApiToken = event.node.req.headers['X-API-TOKEN'] || event.node.req.headers['x-api-token'];
    if (xApiToken) {
      headers['X-API-TOKEN'] = xApiToken as string;
    }
  } else {
    // For other requests, forward the Bearer token if present
    const authHeader = event.node.req.headers.authorization;
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
  }
  
  // Forward the request to the backend
  try {
    const response = await $fetch.raw(backendUrl, {
      method: event.node.req.method as any,
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