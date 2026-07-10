const mongoose = require('mongoose');

/**
 * Frontpage settings — singleton document pattern.
 * There should only ever be one document in this collection.
 */
const frontpageSchema = new mongoose.Schema(
  {
    hero: {
      text: { type: String, default: 'BECOME A PART OF THE WORLD' },
    },
    featuredCollections: {
      heading: {
        type: String,
        default: 'REDEFINING THE BOUNDARIES OF STYLE',
      },
      body: {
        type: String,
        default:
          'Founded on the principle that fashion should be fearless, 6th SIN bridges the gap between luxury craftsmanship and street-level attitude. Every piece is designed to make a statement — bold, unapologetic, and unmistakably yours.',
      },
      ctaText: {
        type: String,
        default: 'EXPLORE THE COLLECTION',
      },
    },
    newArrivals: {
      title: { type: String, default: 'NEW ARRIVALS' },
    },
  },
  {
    timestamps: true,
  }
);

frontpageSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

/**
 * Static method to get or create the singleton frontpage settings.
 */
frontpageSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Frontpage', frontpageSchema);
