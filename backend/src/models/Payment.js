import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    paymentId: { type: String, required: true, unique: true, index: true },
    packId: {
      type: String,
      enum: ['nano', 'starter', 'plus', 'standard', 'pro', 'power'],
      required: true,
    },
    creditAudioSeconds: { type: Number, min: 0, default: 0 },
    creditAiNotes: { type: Number, min: 0, default: 0 },
    orderName: { type: String, required: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'KRW' },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'cancelled'],
      default: 'pending',
    },
    paymentType: {
      type: String,
      enum: ['credit_pack'],
      default: 'credit_pack',
    },
    portoneStatus: { type: String },
    paidAt: { type: Date },
  },
  { timestamps: true },
)

export default mongoose.model('Payment', paymentSchema)
