import mongoose from 'mongoose'

const memoSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    upload: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Upload',
      required: true,
      unique: true,
      index: true,
    },
    transcript: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transcript',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    preview: { type: String, default: '', trim: true },
    words: { type: [mongoose.Schema.Types.Mixed], default: null },
    segments: { type: [mongoose.Schema.Types.Mixed], default: null },
  },
  { timestamps: true },
)

export default mongoose.model('Memo', memoSchema)
