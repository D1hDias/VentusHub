import type { Express } from "express";
import { auth } from "./better-auth.js";

export function setupBetterAuthRoutes(app: Express) {
  
  // Test if routes are being registered at all
  app.get("/api/test-route-registration", (req, res) => {
    res.json({ 
      success: true, 
      message: "Routes are being registered properly",
      timestamp: new Date().toISOString()
    });
  });

  // Debug endpoint para verificar configuração
  app.get("/api/auth-debug", (req, res) => {
    res.json({
      message: "Better Auth está ativo",
      config: {
        baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5000",
        secret: process.env.BETTER_AUTH_SECRET ? "configured" : "using default",
      },
      availableRoutes: [
        "POST /api/auth/sign-in/email",
        "POST /api/auth/sign-up/email", 
        "POST /api/auth/forget-password",
        "POST /api/auth/reset-password",
        "GET /api/auth/session"
      ],
      timestamp: new Date().toISOString()
    });
  });

  // Endpoint temporário para sessão até resolvermos o Better Auth
  app.get("/api/auth/session-temp", async (req, res) => {
    try {
      // Import database
      const { db } = await import('./db.js');
      const { user, session } = await import('../shared/schema.js');
      const { eq, and } = await import('drizzle-orm');
      
      // Debug cookies
      const cookies = req.headers.cookie;
      console.log('🔍 Session temp cookies:', cookies);
      
      if (!cookies) {
        return res.status(401).json({ message: "No session found" });
      }
      
      // Buscar token do Better Auth primeiro
      let sessionToken = null;
      
      // Primeiro, tentar buscar o session_data do Better Auth
      const sessionDataMatch = cookies.match(/better-auth\.session_data=([^;]+)/);
      if (sessionDataMatch) {
        try {
          // Decodificar Base64 primeiro
          const base64Data = decodeURIComponent(sessionDataMatch[1]);
          const decodedData = Buffer.from(base64Data, 'base64').toString('utf-8');
          const sessionData = JSON.parse(decodedData);
          
          sessionToken = sessionData.session?.session?.token;
          console.log('✅ Found Better Auth session data, token:', sessionToken?.substring(0, 10) + '...');
        } catch (error) {
          console.log('❌ Failed to parse Better Auth session data:', error.message);
        }
      }
      
      // Fallback para outros formatos se não encontrou
      if (!sessionToken) {
        const formats = [
          /better-auth\.session_token=([^;]+)/,
          /session_token=([^;]+)/,
          /better-auth\.session=([^;]+)/
        ];
        
        for (const format of formats) {
          const match = cookies.match(format);
          if (match) {
            sessionToken = match[1];
            console.log('✅ Found session token with format:', format.source);
            break;
          }
        }
      }
      
      if (!sessionToken) {
        console.log('❌ No session token found in any format');
        return res.status(401).json({ message: "No session token found", cookies });
      }
      
      console.log('🎯 Using session token:', sessionToken.substring(0, 10) + '...');
      
      // Buscar sessão no banco
      const sessions = await db
        .select({
          userId: session.userId,
          expiresAt: session.expiresAt
        })
        .from(session)
        .where(eq(session.token, sessionToken))
        .limit(1);
      
      if (sessions.length === 0) {
        return res.status(401).json({ message: "Invalid session" });
      }
      
      const userSession = sessions[0];
      
      // Verificar se a sessão não expirou
      if (userSession.expiresAt && new Date() > userSession.expiresAt) {
        return res.status(401).json({ message: "Session expired" });
      }
      
      // Buscar dados do usuário
      const users = await db
        .select()
        .from(user)
        .where(eq(user.id, userSession.userId))
        .limit(1);
      
      if (users.length === 0) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const userData = users[0];
      
      // Buscar perfil B2B se existir
      const { b2bUserProfiles } = await import('../shared/schema.js');
      const b2bProfiles = await db
        .select()
        .from(b2bUserProfiles)
        .where(eq(b2bUserProfiles.userId, userData.id))
        .limit(1);
      
      const userResponse = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        permissions: userData.permissions ? JSON.parse(userData.permissions) : [],
        isActive: userData.isActive,
        emailVerified: userData.emailVerified
      };
      
      // Adicionar perfil B2B se existir
      if (b2bProfiles.length > 0) {
        const b2bProfile = b2bProfiles[0];
        (userResponse as any).b2bProfile = {
          id: b2bProfile.id,
          userType: b2bProfile.userType,
          businessName: b2bProfile.businessName,
          document: b2bProfile.document,
          creci: b2bProfile.creci,
          tradeName: b2bProfile.tradeName,
          phone: b2bProfile.phone,
          bank: b2bProfile.bank,
          agency: b2bProfile.agency,
          account: b2bProfile.account,
          pixKey: b2bProfile.pixKey,
          isActive: b2bProfile.isActive,
          permissions: b2bProfile.permissions ? JSON.parse(b2bProfile.permissions) : []
        };
      }
      
      res.json({
        user: userResponse,
        session: {
          token: sessionToken,
          expiresAt: userSession.expiresAt
        }
      });
      
    } catch (error) {
      console.error('❌ Session temp error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Endpoint para fazer usuário admin (usado pelo makeFirstUserAdmin)
  app.post("/api/auth/make-admin", async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Import database
      const { db } = await import('./db.js');
      const { user } = await import('../shared/schema.js');
      const { eq } = await import('drizzle-orm');
      
      // Update user role to ADMIN (não MASTER_ADMIN pois isso é feito no registro)
      await db
        .update(user)
        .set({ 
          role: 'ADMIN',
          updatedAt: new Date()
        })
        .where(eq(user.id, userId));
      
      console.log('✅ Usuário promovido para ADMIN:', userId);
      res.json({ success: true, message: "User promoted to admin" });
      
    } catch (error) {
      console.error('❌ Error making user admin:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Endpoint para logout
  app.post("/api/auth/logout", async (req, res) => {
    try {
      // Tentar usar o Better Auth primeiro
      const fullUrl = `${req.protocol}://${req.get('host')}/api/auth/sign-out`;
      const webRequest = new Request(fullUrl, {
        method: 'POST',
        headers: {
          'cookie': req.get('cookie') || '',
          'content-type': 'application/json'
        }
      });
      
      const response = await auth.handler(webRequest);
      
      // Se o Better Auth funcionar, usar sua resposta
      if (response.ok) {
        // Copiar headers do Better Auth
        response.headers.forEach((value, key) => {
          if (!['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
            res.setHeader(key, value);
          }
        });
        
        const body = await response.text();
        return res.status(response.status).send(body);
      }
      
      // Fallback: limpar cookies manualmente
      res.clearCookie('better-auth.session_data');
      res.clearCookie('better-auth.session_token');
      res.clearCookie('session_token');
      res.json({ success: true, message: "Logged out successfully" });
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      
      // Fallback em caso de erro: limpar cookies
      res.clearCookie('better-auth.session_data');
      res.clearCookie('better-auth.session_token');
      res.clearCookie('session_token');
      res.json({ success: true, message: "Logged out (fallback)" });
    }
  });
  
  // Test endpoint to check if Better Auth is working
  app.get("/api/test-auth", async (req, res) => {
    try {
      // Test a simple Better Auth call
      const testUrl = `${req.protocol}://${req.get('host')}/api/auth/session`;
      const testRequest = new Request(testUrl, {
        method: 'GET',
        headers: { 'cookie': '' }
      });
      
      const testResponse = await auth.handler(testRequest);
      
      res.json({
        message: "Better Auth test endpoint",
        authObject: !!auth,
        authHandler: !!auth.handler,
        testSession: {
          status: testResponse.status,
          ok: testResponse.ok
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.json({
        message: "Better Auth test endpoint",
        authObject: !!auth,
        authHandler: !!auth.handler,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Debug endpoint para verificar usuários B2B
  app.get("/api/debug/b2b-users", async (req, res) => {
    try {
      const { db } = await import('./db.js');
      const { user } = await import('../shared/schema.js');
      const { b2bUserProfiles } = await import('../shared/schema.js');
      const { eq } = await import('drizzle-orm');

      // Buscar todos os usuários B2B
      const b2bUsers = await db
        .select({
          userId: b2bUserProfiles.userId,
          userType: b2bUserProfiles.userType,
          businessName: b2bUserProfiles.businessName,
          document: b2bUserProfiles.document,
          isActive: b2bUserProfiles.isActive,
          // Dados do usuário do Better Auth
          userName: user.name,
          userEmail: user.email,
          userEmailVerified: user.emailVerified
        })
        .from(b2bUserProfiles)
        .leftJoin(user, eq(b2bUserProfiles.userId, user.id));

      // Buscar também usuários do Better Auth que não têm perfil B2B
      const allUsers = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt
        })
        .from(user);

      res.json({
        success: true,
        b2bUsers,
        allUsers,
        totalB2BUsers: b2bUsers.length,
        totalUsers: allUsers.length
      });

    } catch (error) {
      console.error('Debug B2B users error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  // Test login endpoint
  app.post("/api/debug/test-login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email e senha são obrigatórios'
        });
      }

      console.log(`🔍 Testing login for: ${email} with password: ${password}`);

      // Import database
      const { db } = await import('./db.js');
      const { user } = await import('../shared/schema.js');
      const { eq } = await import('drizzle-orm');

      // Check if user exists
      const existingUser = await db
        .select()
        .from(user)
        .where(eq(user.email, email))
        .limit(1);

      if (existingUser.length === 0) {
        return res.json({
          success: false,
          error: 'Usuário não encontrado',
          userExists: false
        });
      }

      const userData = existingUser[0];
      console.log(`✅ User found: ${userData.name} (${userData.email})`);

      // Try Better Auth sign in
      const signInUrl = `${req.protocol}://${req.get('host')}/api/auth/sign-in/email`;
      
      const signInRequest = new Request(signInUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const result = await auth.handler(signInRequest);
      const resultText = await result.text();
      
      console.log('Better Auth result status:', result.status);
      console.log('Better Auth response:', resultText);

      let responseData = null;
      try {
        responseData = resultText ? JSON.parse(resultText) : null;
      } catch (e) {
        console.log('Could not parse response as JSON');
      }

      res.json({
        success: result.status < 400,
        userExists: true,
        userData: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          emailVerified: userData.emailVerified,
          createdAt: userData.createdAt
        },
        authResponse: {
          status: result.status,
          body: responseData || resultText,
        }
      });

    } catch (error) {
      console.error('Test login error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  // Recreate B2B user with correct password "123456"
  app.post("/api/debug/recreate-b2b-user", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email é obrigatório'
        });
      }

      console.log(`🔄 Recreating B2B user: ${email}`);

      // Import database
      const { db } = await import('./db.js');
      const { user } = await import('../shared/schema.js');
      const { b2bUserProfiles } = await import('../shared/schema.js');
      const { eq } = await import('drizzle-orm');

      // Get existing B2B profile data before deleting
      const existingB2B = await db
        .select()
        .from(b2bUserProfiles)
        .leftJoin(user, eq(b2bUserProfiles.userId, user.id))
        .where(eq(user.email, email))
        .limit(1);

      if (existingB2B.length === 0) {
        return res.json({
          success: false,
          error: 'Usuário B2B não encontrado'
        });
      }

      const b2bData = existingB2B[0].b2b_user_profiles;
      const userData = existingB2B[0].user;
      
      console.log(`✅ Found B2B user: ${userData.name} (${userData.email})`);

      try {
        // 1. Delete existing B2B profile
        await db.delete(b2bUserProfiles).where(eq(b2bUserProfiles.userId, userData.id));
        console.log('✅ Deleted existing B2B profile');

        // 2. Delete existing Better Auth user
        await db.delete(user).where(eq(user.id, userData.id));
        console.log('✅ Deleted existing Better Auth user');

        // 3. Create new user via Better Auth signup
        const signUpUrl = `${req.protocol}://${req.get('host')}/api/auth/sign-up/email`;
        
        const signUpRequest = new Request(signUpUrl, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            email: userData.email,
            password: "Temp123456",
            name: userData.name
          })
        });

        const signUpResult = await auth.handler(signUpRequest);
        const signUpText = await signUpResult.text();
        
        console.log('Better Auth signup result:', signUpResult.status);
        console.log('Better Auth signup response:', signUpText);

        if (signUpResult.status >= 400) {
          throw new Error(`Sign up failed: ${signUpText}`);
        }

        // 4. Get the new user ID
        const newUsers = await db
          .select()
          .from(user)
          .where(eq(user.email, email))
          .limit(1);

        if (newUsers.length === 0) {
          throw new Error('New user not found after signup');
        }

        const newUser = newUsers[0];
        console.log('✅ New user created:', newUser.id);

        // 5. Recreate B2B profile with same data
        await db.insert(b2bUserProfiles).values({
          userId: newUser.id,
          userType: b2bData.userType,
          businessName: b2bData.businessName,
          document: b2bData.document,
          creci: b2bData.creci,
          tradeName: b2bData.tradeName,
          phone: b2bData.phone,
          bank: b2bData.bank,
          agency: b2bData.agency,
          account: b2bData.account,
          pixKey: b2bData.pixKey,
          cep: b2bData.cep,
          street: b2bData.street,
          number: b2bData.number,
          complement: b2bData.complement,
          neighborhood: b2bData.neighborhood,
          city: b2bData.city,
          state: b2bData.state,
          isActive: true,
          permissions: b2bData.permissions
        });

        console.log('✅ B2B profile recreated');

        res.json({
          success: true,
          message: 'Usuário B2B recriado com senha "Temp123456" com sucesso',
          oldUserId: userData.id,
          newUserId: newUser.id,
          email: newUser.email
        });

      } catch (recreateError) {
        console.error('Recreation error:', recreateError);
        res.json({
          success: false,
          error: 'Erro ao recriar usuário',
          details: recreateError.message
        });
      }

    } catch (error) {
      console.error('Recreate B2B user error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  // Endpoint temporário para criar o usuário Diego
  app.post("/api/create-diego", async (req, res) => {
    try {
      console.log('🔄 Creating Diego user...');
      
      // Import db and check if user exists
      const { db } = await import('./db.js');
      const { user } = await import('../shared/schema.js');
      const { eq } = await import('drizzle-orm');
      
      // Check if user already exists
      const existingUser = await db
        .select()
        .from(user)
        .where(eq(user.email, 'diego@diasconsultor.com'))
        .limit(1);
      
      if (existingUser.length > 0) {
        return res.json({
          success: true,
          message: 'Diego user already exists',
          user: existingUser[0]
        });
      }
      
      // Try to create via Better Auth API
      console.log('Creating user via Better Auth...');
      
      const signUpUrl = `${req.protocol}://${req.get('host')}/api/auth/sign-up/email`;
      console.log('Sign up URL:', signUpUrl);
      
      const signUpRequest = new Request(signUpUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: 'diego@diasconsultor.com',
          password: '123456',
          name: 'Diego Santos'
        })
      });
      
      const result = await auth.handler(signUpRequest);
      const resultText = await result.text();
      
      console.log('Better Auth result:', result.status);
      console.log('Better Auth response:', resultText);
      
      let responseData = null;
      try {
        responseData = resultText ? JSON.parse(resultText) : null;
      } catch (e) {
        console.log('Could not parse response as JSON');
      }
      
      res.json({
        success: result.status < 400,
        status: result.status,
        message: result.status < 400 ? 'Diego user created successfully' : 'Failed to create user',
        response: responseData || resultText,
        debug: {
          url: signUpUrl,
          status: result.status,
          headers: Object.fromEntries(result.headers)
        }
      });
      
    } catch (error) {
      console.error('❌ Error creating Diego user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create Diego user',
        error: error.message,
        stack: error.stack
      });
    }
  });
  
  // Use Better Auth's standard handler with proper URL construction
  app.all("/api/auth/*", async (req, res) => {
    try {
      // Better Auth expects a full URL, so we need to construct it
      const protocol = req.get('x-forwarded-proto') || req.protocol;
      const host = req.get('host');
      const originalUrl = req.originalUrl;
      
      // Create a new request object with full URL
      const fullUrl = `${protocol}://${host}${originalUrl}`;
      
      console.log(`📞 Better Auth request: ${req.method} ${fullUrl}`);
      
      // Prepare headers
      const headers: Record<string, string> = {};
      
      // Copy important headers
      if (req.get('content-type')) {
        headers['content-type'] = req.get('content-type')!;
      }
      if (req.get('cookie')) {
        headers['cookie'] = req.get('cookie')!;
      }
      if (req.get('user-agent')) {
        headers['user-agent'] = req.get('user-agent')!;
      }
      if (req.get('authorization')) {
        headers['authorization'] = req.get('authorization')!;
      }
      if (req.get('x-forwarded-for')) {
        headers['x-forwarded-for'] = req.get('x-forwarded-for')!;
      }
      if (req.get('x-real-ip')) {
        headers['x-real-ip'] = req.get('x-real-ip')!;
      }
      
      // Create Web API Request object
      const webRequest = new Request(fullUrl, {
        method: req.method,
        headers,
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
      });
      
      // Call Better Auth handler
      console.log(`🔄 Calling Better Auth handler...`);
      const response = await auth.handler(webRequest);
      console.log(`✅ Better Auth response: ${response.status}`);
      
      // Copy response headers to Express response
      response.headers.forEach((value, key) => {
        // Skip headers that Express handles automatically
        if (!['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
          res.setHeader(key, value);
        }
      });
      
      // Set status
      res.status(response.status);
      
      // Handle response body
      if (response.body) {
        const text = await response.text();
        console.log(`📤 Response body:`, text.substring(0, 200) + (text.length > 200 ? '...' : ''));
        
        if (text) {
          // Try to parse as JSON, fallback to plain text
          try {
            const json = JSON.parse(text);
            res.json(json);
          } catch {
            res.send(text);
          }
        } else {
          res.end();
        }
      } else {
        res.end();
      }
    } catch (error: any) {
      console.error(`❌ Better Auth error:`, error.message);
      console.error(`❌ Error details:`, {
        method: req.method,
        url: req.originalUrl,
        body: req.body,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
      
      res.status(500).json({
        error: 'Authentication service error',
        message: error.message,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
      });
    }
  });

  // Better Auth routes for password reset pages
  app.get("/reset-password", (req, res) => {
    const token = req.query.token;
    
    if (!token) {
      return res.status(400).send(`
        <html>
          <head>
            <title>Token Inválido - VentusHub</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; text-align: center; }
              .error { color: #e74c3c; }
              .logo { width: 120px; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <img src="https://i.ibb.co/GQgj134N/logo2.png" alt="VentusHub" class="logo">
            <h1 class="error">Token Inválido</h1>
            <p>O link para redefinição de senha é inválido ou expirou.</p>
            <p>Por favor, solicite um novo link de redefinição.</p>
            <a href="/login">Voltar ao Login</a>
          </body>
        </html>
      `);
    }

    // Redirect to frontend with token
    res.redirect(`/?reset-password=true&token=${token}`);
  });

  app.get("/verify-email", (req, res) => {
    const token = req.query.token;
    
    if (!token) {
      return res.status(400).send(`
        <html>
          <head>
            <title>Token Inválido - VentusHub</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; text-align: center; }
              .error { color: #e74c3c; }
              .logo { width: 120px; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <img src="https://i.ibb.co/GQgj134N/logo2.png" alt="VentusHub" class="logo">
            <h1 class="error">Token Inválido</h1>
            <p>O link de verificação de email é inválido ou expirou.</p>
            <a href="/login">Voltar ao Login</a>
          </body>
        </html>
      `);
    }

    // Redirect to frontend with token
    res.redirect(`/?verify-email=true&token=${token}`);
  });
}