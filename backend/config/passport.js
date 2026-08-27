const passport         = require("passport");
const GoogleStrategy   = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const User             = require("../models/User");

// ── Only register Google strategy if credentials are provided ──
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== "your_google_client_id_here") {
  passport.use(new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  `${process.env.BACKEND_URL || "https://farm-fusion-4.onrender.com"}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });
        if (user) return done(null, user);
        user = await User.create({
          name:     profile.displayName,
          email:    profile.emails[0].value,
          password: `google_oauth_${profile.id}`,
          role:     "buyer",
          avatar:   profile.photos[0]?.value || null,
        });
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  ));
  console.log("✅ Google OAuth strategy registered");
} else {
  console.log("⚠️  Google OAuth skipped — add GOOGLE_CLIENT_ID to .env to enable");
}

// ── Only register Facebook strategy if credentials are provided ──
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_ID !== "your_facebook_app_id_here") {
  passport.use(new FacebookStrategy(
    {
      clientID:      process.env.FACEBOOK_APP_ID,
      clientSecret:  process.env.FACEBOOK_APP_SECRET,
      callbackURL:   `${process.env.BACKEND_URL || "https://farm-fusion-4.onrender.com"}/api/auth/facebook/callback`,
      profileFields: ["id", "displayName", "emails", "photos"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value || `fb_${profile.id}@noemail.com`;
        let user = await User.findOne({ email });
        if (user) return done(null, user);
        user = await User.create({
          name:     profile.displayName,
          email,
          password: `facebook_oauth_${profile.id}`,
          role:     "buyer",
          avatar:   profile.photos?.[0]?.value || null,
        });
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  ));
  console.log("✅ Facebook OAuth strategy registered");
} else {
  console.log("⚠️  Facebook OAuth skipped — add FACEBOOK_APP_ID to .env to enable");
}

module.exports = passport;