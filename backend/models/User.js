const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: [true, "Name is required"], trim: true },
    email:    { type: String, required: [true, "Email is required"], unique: true, lowercase: true, trim: true },
    // No minlength here — password is hashed before mongoose validates it
    // Length check is done in the controller before hashing
    password: { type: String, required: [true, "Password is required"] },
    role:     { type: String, enum: ["farmer", "buyer", "admin"], default: "buyer" },

    // Farmer-specific
    farmName:  { type: String, default: undefined },
    location:  { type: String, default: undefined },
    tierLevel: { type: String, enum: ["bronze", "silver", "gold"], default: "bronze" },

    // Buyer-specific
    companyName: { type: String, default: undefined },
    isPremium:   { type: Boolean, default: false },

    avatar:   { type: String, default: undefined },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Remove password from JSON responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);