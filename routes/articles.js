import express from 'express';
import Article from '../models/articles.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// POST /api/articles - Create new article (BUTUH AUTH)
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, tags, coverImage, isPublished } = req.body;

    // Validasi required fields
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    // Buat article baru
    const article = new Article({
      title,
      content,
      tags: tags || [],
      coverImage: coverImage || '',
      isPublished: isPublished || false,
      author: req.user._id // dari middleware auth
    });

    await article.save();
    
    // Populate author info untuk response
    await article.populate('author', 'username email profilePicture');

    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      data: article
    });

  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating article',
      error: error.message
    });
  }
});

// GET /api/articles - Get all articles dengan filter dan pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      tag,
      author,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      publishedOnly = true
    } = req.query;

    // Setup query dasar
    let query = {};
    
    // Filter hanya artikel yang published
    if (publishedOnly === 'true') {
      query.isPublished = true;
    }

    // Filter by tag
    if (tag) {
      query.tags = { $in: [tag] };
    }

    // Filter by author
    if (author) {
      query.author = author;
    }

    // Search in title dan content
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Setup sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Hitung skip untuk pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Eksekusi query
    const articles = await Article.find(query)
      .populate('author', 'username email profilePicture')
      .populate('comments.user', 'username profilePicture')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Hitung total documents untuk pagination info
    const total = await Article.countDocuments(query);

    // Format response
    res.json({
      success: true,
      data: articles,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalArticles: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      filters: {
        tag,
        author,
        search,
        sortBy,
        sortOrder
      }
    });

  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching articles',
      error: error.message
    });
  }
});

// GET /api/articles/published - Hanya artikel yang published
router.get('/published', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const articles = await Article.find({ isPublished: true })
      .populate('author', 'username profilePicture')
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Article.countDocuments({ isPublished: true });

    res.json({
      success: true,
      data: articles,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalArticles: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching published articles',
      error: error.message
    });
  }
});

// GET /api/articles/draft - Hanya draft articles (butuh auth)
router.get('/draft', auth, async (req, res) => {
  try {
    const articles = await Article.find({ 
      author: req.user._id, 
      isPublished: false 
    })
      .populate('author', 'username profilePicture')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: articles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching draft articles',
      error: error.message
    });
  }
});

export default router;