import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    content: {
      type: String,
      required: true
    },
    excerpt: {
      type: String,
      maxlength: 500
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    coverImage: {
      type: String,
      default: ''
    },
    readTime: {
      type: Number,
      default: 0
    },
    claps: {
      type: Number,
      default: 0
    },
    clappedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        content: {
          type: String,
          required: true
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    isPublished: {
      type: Boolean,
      default: false
    },
    publishedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

articleSchema.pre('save', function (next) {
  // Generate excerpt dari content
  if (this.content && !this.excerpt) {
    this.excerpt = this.content.substring(0, 150) + '...';
  }

  // Hitung estimasi waktu baca (200 kata/menit)
  const wordCount = this.content ? this.content.split(' ').length : 0;
  this.readTime = Math.ceil(wordCount / 200);

  // Set tanggal publish jika artikel baru dipublish
  if (this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  next();
});

const Article = mongoose.model('Article', articleSchema);
export default Article;