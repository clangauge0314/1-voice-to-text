import mongoose from 'mongoose'

const uploadSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    originalName: { type: String, required: true, trim: true },
    cloudinaryUrl: { type: String, required: true },
    publicId: { type: String, required: true },
    duration: { type: Number, default: null },
    format: { type: String },
    bytes: { type: Number },
    status: {
      type: String,
      enum: ['uploaded', 'failed'],
      default: 'uploaded',
    },
  },
  { timestamps: true },
)

export default mongoose.model('Upload', uploadSchema)
