// This file contains resource-related route handlers
// To be imported and used in index.tsx

export const RESOURCES_BUCKET = 'make-b8526fa6-resources';

export async function ensureResourcesBucket(supabaseAdmin: any) {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some((bucket: any) => bucket.name === RESOURCES_BUCKET);
    
    if (!bucketExists) {
      console.log('Creating resources bucket...');
      await supabaseAdmin.storage.createBucket(RESOURCES_BUCKET, {
        public: false,
        fileSizeLimit: 52428800, // 50MB limit
      });
      console.log('✓ Resources bucket created');
    }
  } catch (error) {
    console.error('Error ensuring resources bucket:', error);
  }
}

export function setupResourceRoutes(app: any, authenticateUser: any, generateId: any, kv: any, supabaseAdmin: any) {
  // Create a resource (link or note)
  app.post("/make-server-b8526fa6/resources", async (c: any) => {
    try {
      const auth = await authenticateUser(c);
      if ('error' in auth) {
        return c.json({ error: auth.error }, auth.status);
      }

      const { user } = auth;
      const body = await c.req.json();
      const { mentorshipId, type, title, description, linkUrl, content } = body;

      if (!mentorshipId || !type || !title) {
        return c.json({ error: 'Mentorship ID, type, and title are required' }, 400);
      }

      if (type !== 'link' && type !== 'note') {
        return c.json({ error: 'Type must be link or note for this endpoint' }, 400);
      }

      // Verify mentorship exists and user is the mentor
      const mentorship = await kv.get(`mentorship:${mentorshipId}`);
      if (!mentorship) {
        return c.json({ error: 'Mentorship not found' }, 404);
      }

      if (mentorship.mentorId !== user.id) {
        return c.json({ error: 'Only mentors can share resources' }, 403);
      }

      // Create resource
      const resourceId = generateId('resource');
      const resource = {
        id: resourceId,
        mentorshipId,
        mentorId: user.id,
        studentId: mentorship.studentId,
        type,
        title,
        description: description || null,
        linkUrl: type === 'link' ? linkUrl : null,
        content: type === 'note' ? content : null,
        createdAt: new Date().toISOString(),
      };

      await kv.set(`resource:${resourceId}`, resource);

      // Get mentor info for enriched response
      const mentor = await kv.get(`user:${user.id}`);
      const enrichedResource = {
        ...resource,
        mentor: mentor ? { 
          id: mentor.id, 
          firstName: mentor.firstName, 
          lastName: mentor.lastName 
        } : null,
      };

      return c.json({ success: true, resource: enrichedResource });
    } catch (error: any) {
      console.log('Create resource error:', error);
      return c.json({ error: error.message || 'Failed to create resource' }, 500);
    }
  });

  // Upload a file resource
  app.post("/make-server-b8526fa6/resources/upload", async (c: any) => {
    try {
      const auth = await authenticateUser(c);
      if ('error' in auth) {
        return c.json({ error: auth.error }, auth.status);
      }

      const { user } = auth;
      
      // Parse form data
      const formData = await c.req.formData();
      const mentorshipId = formData.get('mentorshipId') as string;
      const title = formData.get('title') as string;
      const description = formData.get('description') as string;
      const file = formData.get('file') as File;

      if (!mentorshipId || !title || !file) {
        return c.json({ error: 'Mentorship ID, title, and file are required' }, 400);
      }

      // Verify mentorship exists and user is the mentor
      const mentorship = await kv.get(`mentorship:${mentorshipId}`);
      if (!mentorship) {
        return c.json({ error: 'Mentorship not found' }, 404);
      }

      if (mentorship.mentorId !== user.id) {
        return c.json({ error: 'Only mentors can share resources' }, 403);
      }

      // Upload file to Supabase Storage
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${mentorshipId}/${fileName}`;
      
      const fileArrayBuffer = await file.arrayBuffer();
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from(RESOURCES_BUCKET)
        .upload(filePath, fileArrayBuffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('File upload error:', uploadError);
        return c.json({ error: 'Failed to upload file' }, 500);
      }

      // Get signed URL (valid for 1 year)
      const { data: signedUrlData } = await supabaseAdmin.storage
        .from(RESOURCES_BUCKET)
        .createSignedUrl(filePath, 31536000); // 1 year in seconds

      if (!signedUrlData) {
        return c.json({ error: 'Failed to generate download URL' }, 500);
      }

      // Create resource record
      const resourceId = generateId('resource');
      const resource = {
        id: resourceId,
        mentorshipId,
        mentorId: user.id,
        studentId: mentorship.studentId,
        type: 'file',
        title,
        description: description || null,
        fileUrl: signedUrlData.signedUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        createdAt: new Date().toISOString(),
      };

      await kv.set(`resource:${resourceId}`, resource);

      // Get mentor info for enriched response
      const mentor = await kv.get(`user:${user.id}`);
      const enrichedResource = {
        ...resource,
        mentor: mentor ? { 
          id: mentor.id, 
          firstName: mentor.firstName, 
          lastName: mentor.lastName 
        } : null,
      };

      return c.json({ success: true, resource: enrichedResource });
    } catch (error: any) {
      console.log('Upload file resource error:', error);
      return c.json({ error: error.message || 'Failed to upload file' }, 500);
    }
  });

  // Get all resources for a mentorship
  app.get("/make-server-b8526fa6/resources", async (c: any) => {
    try {
      const auth = await authenticateUser(c);
      if ('error' in auth) {
        return c.json({ error: auth.error }, auth.status);
      }

      const { user } = auth;
      const mentorshipId = c.req.query('mentorshipId');

      if (!mentorshipId) {
        return c.json({ error: 'Mentorship ID is required' }, 400);
      }

      // Verify mentorship exists and user has access
      const mentorship = await kv.get(`mentorship:${mentorshipId}`);
      if (!mentorship) {
        return c.json({ error: 'Mentorship not found' }, 404);
      }

      if (mentorship.mentorId !== user.id && mentorship.studentId !== user.id) {
        return c.json({ error: 'Unauthorized' }, 403);
      }

      // Get all resources for this mentorship
      const allResources = await kv.getByPrefix('resource:');
      const mentorshipResources = allResources
        .filter((r: any) => r.mentorshipId === mentorshipId)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Enrich with mentor data
      const enrichedResources = await Promise.all(
        mentorshipResources.map(async (resource: any) => {
          const mentor = await kv.get(`user:${resource.mentorId}`);
          return {
            ...resource,
            mentor: mentor ? { 
              id: mentor.id, 
              firstName: mentor.firstName, 
              lastName: mentor.lastName 
            } : null,
          };
        })
      );

      return c.json({ success: true, resources: enrichedResources });
    } catch (error: any) {
      console.log('Get resources error:', error);
      return c.json({ error: error.message || 'Failed to get resources' }, 500);
    }
  });

  // Delete a resource
  app.delete("/make-server-b8526fa6/resources/:resourceId", async (c: any) => {
    try {
      const auth = await authenticateUser(c);
      if ('error' in auth) {
        return c.json({ error: auth.error }, auth.status);
      }

      const { user } = auth;
      const resourceId = c.req.param('resourceId');
      
      const resource = await kv.get(`resource:${resourceId}`);
      if (!resource) {
        return c.json({ error: 'Resource not found' }, 404);
      }

      // Only the mentor who created it can delete
      if (resource.mentorId !== user.id) {
        return c.json({ error: 'Unauthorized' }, 403);
      }

      // If it's a file, delete from storage
      if (resource.type === 'file' && resource.fileUrl) {
        try {
          // Extract file path from signed URL
          const urlParts = resource.fileUrl.split('/');
          const tokenIndex = urlParts.findIndex((part: string) => part === 'sign');
          if (tokenIndex > 0) {
            const pathParts = urlParts.slice(tokenIndex - 2, tokenIndex);
            const filePath = `${pathParts[0]}/${pathParts[1]}`;
            
            await supabaseAdmin.storage
              .from(RESOURCES_BUCKET)
              .remove([filePath]);
          }
        } catch (storageError) {
          console.error('Error deleting file from storage:', storageError);
          // Continue to delete the resource record even if storage deletion fails
        }
      }

      await kv.del(`resource:${resourceId}`);

      return c.json({ success: true });
    } catch (error: any) {
      console.log('Delete resource error:', error);
      return c.json({ error: error.message || 'Failed to delete resource' }, 500);
    }
  });
}
