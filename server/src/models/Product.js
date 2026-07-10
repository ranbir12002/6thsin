const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    price: {
      type: String,
      required: [true, 'Price is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    images: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['MENSWEAR', 'WOMENSWEAR', 'ACCESSORIES', 'ACTIVEWEAR', 'HOME'],
      index: true,
    },
    subcategory: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: '',
    },
    colors: [
      {
        name: { type: String, required: true },
        hex: { type: String, required: true },
      },
    ],
    sizes: {
      type: [String],
      default: [],
    },
    material: {
      type: String,
      default: '',
    },
    careInstructions: {
      type: [String],
      default: [],
    },
    fit: {
      type: String,
      default: '',
    },
    articleNumber: {
      type: String,
      default: '',
    },
    supplierInfo: {
      type: String,
      default: '',
    },
    countryOfProduction: {
      type: String,
      default: '',
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate slug from name before saving
productSchema.pre('validate', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Virtual to match frontend's `id` field
productSchema.virtual('id').get(function () {
  return this.slug;
});

// Ensure virtuals are included in JSON output
productSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Product', productSchema);
