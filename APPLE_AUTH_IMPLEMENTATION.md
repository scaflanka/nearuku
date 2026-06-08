# Apple Sign-In Implementation Guide (Backend & Portal)

This document provides the exact configuration and code needed to implement Apple Authentication for the **Nearu** iOS app.

> [!NOTE]
> Apple Authentication is currently supported on **iOS only**.

---

## 1. Apple Developer Portal Setup

To support Apple Sign-In, you need to configure several identifiers and keys in your Apple Developer account.

### A. App ID Configuration
1.  Go to **Certificates, Identifiers & Profiles** > **Identifiers**.
2.  Select your **App ID** (`com.Nearu`).
3.  Under **Capabilities**, check **Sign In with Apple**.
4.  Click **Edit** next to it and select **Enable as a primary App ID**.

### B. Private Key (Signing Key)
1.  Go to **Keys**.
2.  Create a new key, name it (e.g., "Nearu Apple Auth"), and check **Sign in with Apple**.
3.  Click **Configure** and select your Primary App ID.
4.  Download the `.p8` file (keep this safe).
5.  Note the **Key ID** (10-character string).

---

## 2. Node.js Backend Implementation

This implementation matches the **Nearu** frontend requirements.

### Prerequisites
```bash
npm install apple-signin-auth jsonwebtoken
```

### Environment Variables (.env)
```env
APPLE_TEAM_ID=XXXXXXXXXX
APPLE_CLIENT_ID=com.Nearu        # Must match iOS Bundle Identifier
APPLE_KEY_ID=XXXXXXXXXX
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
JWT_SECRET=your_jwt_secret        # Shared with other auth methods
```

### API Implementation (Express + Prisma)

This handler processes `POST /auth/apple`.

```javascript
const appleSignin = require('apple-signin-auth');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const handleAppleAuth = async (req, res) => {
    // Frontend sends: identityToken, fullName, user (appleUserId)
    const { identityToken, fullName, user: appleUserId } = req.body;

    try {
        // 1. Verify the identityToken with Apple
        const { sub: userAppleId, email, email_verified } = await appleSignin.verifyIdToken(identityToken, {
            audience: process.env.APPLE_CLIENT_ID,
            ignoreExpiration: false,
        });

        // 2. Check if user already exists
        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { appleId: userAppleId },
                    { email: email }
                ]
            }
        });

        if (!user) {
            // 3. Register new user
            // Note: Apple only sends fullName on the FIRST sign-in
            const name = fullName 
                ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim() 
                : 'Apple User';

            user = await prisma.user.create({
                data: {
                    email: email,
                    name: name,
                    appleId: userAppleId,
                    emailVerified: email_verified === 'true',
                }
            });
        } else if (!user.appleId) {
            // Link existing account to Apple ID if not already linked
            user = await prisma.user.update({
                where: { id: user.id },
                data: { appleId: userAppleId }
            });
        }

        // 4. Generate App Tokens
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

        // 5. Return success response
        return res.status(200).json({
            success: true,
            token,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            }
        });

    } catch (error) {
        console.error('Apple Auth Error:', error);
        return res.status(401).json({
            success: false,
            message: 'Invalid Apple identity token.'
        });
    }
};

module.exports = { handleAppleAuth };
```

---

## 3. Recommended Prisma Schema Changes
Ensure your `User` model has a field for `appleId` to link accounts.

```prisma
model User {
  id            Int      @id @default(autoincrement())
  email         String   @unique
  name          String?
  appleId       String?  @unique // <--- Add this field
  emailVerified Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

---

## 4. Logic Details
1.  **Verification**: The `apple-signin-auth` library validates the token's signature, expiration, and audience (`com.Nearu`).
2.  **User Matching**: We match users by `appleId` first, then by `email` to prevent duplicate accounts.
3.  **Full Name**: Apple only provides `fullName` and `email` once (on the first authorization). Your backend must persist these during the first registration.
4.  **Frontend Tokens**: Save the `token` and `refreshToken` returned by this API to enable subsequent authenticated requests.
