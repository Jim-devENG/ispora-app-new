console.log('🚀 Ispora Edge Function starting...');
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
  
  // Create a minimal error server
  Deno.serve(() => new Response(
    JSON.stringify({
      error: 'Server failed to initialize',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : String(error)
    }),
    {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    }
  ));
  throw error;
}

// Serve the Edge Function with error handling
Deno.serve(async (req: Request) => {
  try {
    console.log(`📥 Incoming request: ${req.method} ${req.url}`);
    
    if (!server || typeof server.fetch !== 'function') {
      throw new Error(`Server object is invalid: ${typeof server}, fetch: ${typeof server?.fetch}`);
    }
    
    return await server.fetch(req);
  } catch (error) {
    console.error('❌ Edge Function error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : String(error)
      }), 
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
});

console.log('✅ Edge Function initialized successfully');
