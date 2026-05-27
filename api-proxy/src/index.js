// In-memory rate limiting map (Note: Reset per isolate, but good for basic protection)
const rateLimitMap = new Map();

// Configuration
const ALLOWED_ORIGINS = [
  'http://localhost:5173', // Vite default local
  'http://localhost:3000', 
  // ADD YOUR PRODUCTION FRONTEND URL HERE:
  // 'https://your-apna-rooms-frontend.vercel.app' 
];

const RATE_LIMIT_MAX_REQUESTS = 100; // max requests per window
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute window

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    
    // 1. Strict Origin Validation (CORS)
    const isAllowedOrigin = !origin || ALLOWED_ORIGINS.includes(origin);
    if (!isAllowedOrigin) {
      return new Response("Forbidden: Invalid Origin", { status: 403 });
    }

    // Handle CORS Preflight
    if (request.method === "OPTIONS") {
      return handleCORS(origin);
    }

    // 2. HTTP Method Validation
    const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    if (!allowedMethods.includes(request.method)) {
      return new Response("Method Not Allowed", { status: 405 });
    }

    // 3. Rate Limiting (Basic IP based)
    // In workers, connecting IP is in 'CF-Connecting-IP'
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (isRateLimited(ip)) {
      return new Response("Too Many Requests. Please slow down.", { 
        status: 429,
        headers: { "Retry-After": "60" }
      });
    }

    // 4. Routing and Secret Injection
    let targetUrl;
    let modifiedHeaders = new Headers(request.headers);

    if (url.pathname.startsWith('/api')) {
      // Route to your backend Node.js
      targetUrl = `${env.BACKEND_URL}${url.pathname}${url.search}`;
      
      // Inject backend API key if needed (stored securely in Cloudflare Secrets)
      if (env.BACKEND_SECRET_KEY) {
        modifiedHeaders.set("Authorization", `Bearer ${env.BACKEND_SECRET_KEY}`);
      }
    } 
    else if (url.pathname.startsWith('/supabase')) {
      // Route to Supabase
      targetUrl = `${env.SUPABASE_URL}${url.pathname.replace('/supabase', '')}${url.search}`;
      
      // Silently inject Supabase Anon/Service Key
      // This hides the key from the frontend entirely!
      if (env.SUPABASE_KEY) {
        modifiedHeaders.set("apikey", env.SUPABASE_KEY);
        modifiedHeaders.set("Authorization", `Bearer ${env.SUPABASE_KEY}`);
      }
    } 
    else {
      return new Response("Not Found", { status: 404 });
    }

    // Prepare proxy request
    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers: modifiedHeaders,
      body: request.body,
      redirect: 'manual'
    });

    // 5. Forward request and apply strict security headers
    try {
      const targetResponse = await fetch(proxyRequest);
      
      const finalHeaders = new Headers(targetResponse.headers);
      // Ensure CORS on the actual response
      if (origin) {
         finalHeaders.set("Access-Control-Allow-Origin", origin);
      }
      
      // Security Headers
      finalHeaders.set("X-XSS-Protection", "1; mode=block");
      finalHeaders.set("X-Frame-Options", "DENY");
      finalHeaders.set("X-Content-Type-Options", "nosniff");
      finalHeaders.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
      finalHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");

      // Strip sensitive headers coming back from upstream
      finalHeaders.delete("Server");
      finalHeaders.delete("X-Powered-By");

      return new Response(targetResponse.body, {
        status: targetResponse.status,
        statusText: targetResponse.statusText,
        headers: finalHeaders
      });
    } catch (err) {
      return new Response("Bad Gateway", { status: 502 });
    }
  },
};

function handleCORS(origin) {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin"
    }
  });
}

function isRateLimited(ip) {
  if (ip === 'unknown') return false;
  
  const now = Date.now();
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }

  const timestamps = rateLimitMap.get(ip);
  // Filter out old requests
  const recentRequests = timestamps.filter(time => now - time < RATE_LIMIT_WINDOW_MS);
  
  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return true; // Limit exceeded
  }

  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  return false;
}
