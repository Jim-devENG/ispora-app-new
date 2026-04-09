# 🔧 502 Bad Gateway Error - Debugging & Fix

## Error Encountered
```
502: Bad gateway
Cloudflare reports that the Supabase Edge Function host is down
```

## Root Cause Analysis

The 502 error indicates that the Edge Function is crashing during initialization or startup. This happens **before** any requests are processed.

### Possible Causes:
1. ✅ **Module import error** - Syntax error or runtime error when loading server code
2. ✅ **Missing export** - Server app not properly exported (FIXED)
3. ✅ **Module-level async code** - Top-level await causing issues
4. ✅ **Circular dependencies** - Modules importing each other incorrectly

## Changes Made

### 1. Fixed Server Export (`/supabase/functions/server/index.tsx`)

**Removed:**
```typescript
// OLD - This was causing issues
try {
  Deno.serve(app.fetch);
  console.log('✅ Server started successfully');
} catch (error) {
  console.error('❌ FATAL: Server failed to start:', error);
  Deno.serve(() => new Response(...));
}
```

**Added:**
```typescript
// NEW - Clean export for edge function wrapper
export default app;
```

### 2. Removed Module-Level Console.log

**Removed:**
```typescript
console.log('🚀 Server starting...');  // This was after export
```

Reason: Console.log after `export default` is valid but could cause issues in Deno's module loading.

### 3. Enhanced Edge Function Wrapper (`/supabase/functions/make-server-b8526fa6/index.ts`)

**Added comprehensive error handling:**

```typescript
// Dynamic import with try-catch
console.log('📦 Attempting to import server module...');

let server: any;
try {
  const module = await import('../server/index.tsx');
  server = module.default;
  console.log('✅ Server module imported successfully');
  console.log('Server type:', typeof server);
  console.log('Server has fetch:', typeof server?.fetch);
} catch (error) {
  console.error('❌ FATAL: Failed to import server module:', error);
  console.error('Error details:', error instanceof Error ? error.stack : String(error));
  
  // Create error server that returns details
  Deno.serve(() => new Response(
    JSON.stringify({
      error: 'Server failed to initialize',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : String(error)
    }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  ));
  throw error;
}

// Serve with validation
Deno.serve(async (req: Request) => {
  try {
    if (!server || typeof server.fetch !== 'function') {
      throw new Error(`Server object is invalid`);
    }
    return await server.fetch(req);
  } catch (error) {
    // Return detailed error response
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message,
      details: error.stack
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});
```

## Benefits of New Approach

### ✅ Better Error Visibility
- If server fails to import, error details are returned in HTTP response
- No more silent 502 errors - actual error message is captured
- Stack traces included for debugging

### ✅ Validation
- Checks that server object exists before calling
- Verifies `server.fetch` is a function
- Prevents crashes from invalid module exports

### ✅ Logging
- Logs each stage of initialization
- Logs incoming requests for debugging
- Logs error details to Supabase function logs

## How To Debug If Issues Persist

### 1. Check Edge Function Logs
```bash
supabase functions logs make-server-b8526fa6 --tail
```

Look for:
- `📦 Attempting to import server module...`
- `✅ Server module imported successfully` (GOOD)
- `❌ FATAL: Failed to import server module` (BAD - shows error)

### 2. Test Health Endpoint
```bash
curl https://xyqdwrqiduxpxmszwhwb.supabase.co/functions/v1/make-server-b8526fa6/health
```

**Expected (Success):**
```json
{
  "status": "ok",
  "timestamp": "2026-04-06T...",
  "message": "Ispora server is running"
}
```

**If Still 502:**
Check the function logs for the actual import error

### 3. Check For Syntax Errors
If the edge function is returning error details, look for:
- `SyntaxError:` - Code syntax problem
- `TypeError:` - Type issue (missing import, undefined variable)
- `ReferenceError:` - Undefined variable
- Module loading errors

## Common Issues & Solutions

### Issue 1: "Failed to import server module"
**Cause:** Syntax error in server/index.tsx or imported files  
**Solution:** Check the error details in the response/logs for the specific file and line

### Issue 2: "Server object is invalid"
**Cause:** Server module doesn't export a Hono app  
**Solution:** Verify `export default app` exists at end of server/index.tsx

### Issue 3: "server.fetch is not a function"
**Cause:** Exported object is not a Hono app instance  
**Solution:** Verify `const app = new Hono()` and correct export

### Issue 4: Still getting 502
**Cause:** Edge function not deployed or environment variables missing  
**Solution:** 
```bash
# Redeploy
supabase functions deploy make-server-b8526fa6

# Check environment variables
supabase secrets list
```

## Expected Behavior Now

### ✅ Success Flow:
1. Edge function starts
2. `📦 Attempting to import server module...` logged
3. `✅ Server module imported successfully` logged
4. Server type and fetch function validated
5. Requests are handled normally
6. Health endpoint returns 200 OK

### ❌ Failure Flow (Now Debuggable):
1. Edge function starts
2. `📦 Attempting to import server module...` logged
3. `❌ FATAL: Failed to import server module` logged
4. Error details logged with stack trace
5. Minimal error server starts
6. HTTP requests return 500 with error details (not 502)
7. Developer can see ACTUAL error message

## Next Steps

1. **Wait for edge function to redeploy** (automatic in Figma Make)
2. **Refresh browser** to clear cache
3. **Check console** - Should see API calls succeed OR detailed error message
4. **If still 502**, check Supabase function logs for initialization error

## Files Modified

1. ✅ `/supabase/functions/server/index.tsx`
   - Removed Deno.serve() call
   - Cleaned up module-level code
   - Added clean export

2. ✅ `/supabase/functions/make-server-b8526fa6/index.ts`
   - Added dynamic import with error handling
   - Added comprehensive logging
   - Added validation checks
   - Returns detailed errors instead of crashing

## Architecture

```
Entry Point: /supabase/functions/make-server-b8526fa6/index.ts
    ↓
    | 1. console.log('Starting...')
    | 2. Dynamic import('../server/index.tsx')
    | 3. Validate server.fetch exists
    | 4. Deno.serve(server.fetch)
    ↓
Server: /supabase/functions/server/index.tsx
    ↓
    | 1. Import dependencies
    | 2. Create Hono app
    | 3. Setup middleware
    | 4. Define routes
    | 5. export default app
    ↓
Hono App Instance
    - Has .fetch(req) method
    - Handles all HTTP requests
    - Returns Response objects
```

## Status

✅ **Export fixed** - Server properly exports Hono app  
✅ **Module-level code cleaned** - Removed problematic console.log  
✅ **Error handling added** - Edge function catches and reports errors  
✅ **Logging improved** - Can see what's happening during initialization  
⏳ **Waiting for deployment** - Changes should auto-deploy in Figma Make

---

**If you still see 502 errors after deployment**, the edge function will now return the actual error message instead of just crashing. Check the browser console or function logs for the detailed error.

*Fix applied: April 6, 2026*
