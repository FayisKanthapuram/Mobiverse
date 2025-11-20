import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/userModel.js";
import dotenv from "dotenv"
dotenv.config({ quiet: true });

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Extract email safely
        const email =
          profile.emails && profile.emails[0]
            ? profile.emails[0].value
            : null;

        let user = null;

        // Find user by email
        if (email) {
          user = await User.findOne({ email });
        }

        

        if (user) {
          // If user exists but doesn't have Google linked yet
          if (!user.googleId) {
            user.googleId = profile.id;
            user.avatar=profile.photos?.[0]?.value || null;
            await user.save();
          }
          return done(null, user);
        } else {
          // If new Google user
          const newUser = new User({
            username: profile.displayName,
            email: email,
            googleId: profile.id,
            avatar: profile.photos?.[0]?.value || null, // optional: save profile pic
          });
          await newUser.save();
          return done(null, newUser);
        }
      } catch (error) {
        console.error("Google auth error:", error);
        return done(error, null);
      }
    }
  )
);

// Serialize user to session (store only user.id)
passport.serializeUser((user, done) => done(null, user.id));

// Deserialize (fetch full user from DB)
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
