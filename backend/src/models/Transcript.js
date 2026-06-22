import mongoose from 'mongoose'

const transcriptSchema = new mongoose.Schema(
  {
    upload: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Upload',
      required: true,
      unique: true,
      index: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    content: { type: mongoose.Schema.Types.Mixed, default: null },
    error: { type: String, default: null },
  },
  { timestamps: true },
)

export default mongoose.model('Transcript', transcriptSchema)
