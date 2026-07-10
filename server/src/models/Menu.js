const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, 'Menu item label is required'],
      trim: true,
    },
    href: {
      type: String,
      default: '#',
    },
  },
  { _id: true }
);

const menuCategorySchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, 'Category label is required'],
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    children: {
      type: [menuItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

menuCategorySchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    // Also transform children _id to id
    if (ret.children) {
      ret.children = ret.children.map((child) => ({
        id: child._id.toString(),
        label: child.label,
        href: child.href,
      }));
    }
    return ret;
  },
});

module.exports = mongoose.model('MenuCategory', menuCategorySchema);
