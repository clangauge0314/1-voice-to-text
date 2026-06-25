import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    plan: {
      type: String,
      enum: ['credit'],
      default: 'credit',
    },
    usedMinutes: { type: Number, default: 0, min: 0 },
    usedSeconds: { type: Number, default: 0, min: 0 },
    usedAiNotes: { type: Number, default: 0, min: 0 },
    audioSecondsBalance: { type: Number, default: 60 * 60, min: 0 },
    aiNotesBalance: { type: Number, default: 10, min: 0 },
    usagePeriodStart: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
)

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password)
}

export default mongoose.model('User', userSchema)
