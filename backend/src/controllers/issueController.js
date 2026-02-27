const Issue = require('../models/Issue');
const path = require('path');
const fs = require('fs');

// @desc    Create new issue
// @route   POST /api/issues
// @access  Private
exports.createIssue = async (req, res) => {
  try {
    console.log('=== Create Issue Request ===');
    console.log('Body:', req.body);
    console.log('File:', req.file);
    console.log('User:', req.user);
    
    const { title, description, category, address, priority } = req.body;
    
    // Parse coordinates if it's a string
    let coordinates;
    try {
      coordinates = typeof req.body.coordinates === 'string' 
        ? JSON.parse(req.body.coordinates) 
        : req.body.coordinates;
    } catch (error) {
      console.error('Coordinate parse error:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates format'
      });
    }

    // Validate coordinates
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid coordinates [longitude, latitude]'
      });
    }
    
    // Validate that coordinates are numbers
    if (isNaN(coordinates[0]) || isNaN(coordinates[1])) {
      return res.status(400).json({
        success: false,
        message: 'Coordinates must be valid numbers'
      });
    }

    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    const issueData = {
      title,
      description,
      category,
      location: {
        type: 'Point',
        coordinates: coordinates
      },
      address,
      priority: priority || 'Medium',
      image: req.file.path || (req.file.url ? req.file.url : ''), // Cloudinary URL
      reportedBy: req.user._id
    };
    
    console.log('Creating issue with data:', issueData);
    const issue = await Issue.create(issueData);
    console.log('Issue created successfully:', issue);

    res.status(201).json({
      success: true,
      data: issue
    });
  } catch (error) {
    console.error('Issue creation error:', error);
    // No need to delete local file, as images are uploaded to Cloudinary
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all issues with filtering & pagination
// @route   GET /api/issues
// @access  Private
exports.getIssues = async (req, res) => {
  try {
    const { status, category, priority, page = 1, limit = 10 } = req.query;

    // Build query
    const query = {};
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    // If not admin, only show user's own issues
    if (req.user.role !== 'admin') {
      query.reportedBy = req.user._id;
    }

    const issues = await Issue.find(query)
      .populate('reportedBy', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Issue.countDocuments(query);

    res.status(200).json({
      success: true,
      count: issues.length,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: issues
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single issue
// @route   GET /api/issues/:id
// @access  Private
exports.getIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reportedBy', 'name email phone');

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    // Check if user is authorized to view this issue
    if (req.user.role !== 'admin' && issue.reportedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this issue'
      });
    }

    res.status(200).json({
      success: true,
      data: issue
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update issue status (Admin only)
// @route   PUT /api/issues/:id/status
// @access  Private/Admin
exports.updateIssueStatus = async (req, res) => {
  try {
    const { status, adminNotes, priority } = req.body;

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    if (status) issue.status = status;
    if (adminNotes) issue.adminNotes = adminNotes;
    if (priority) issue.priority = priority;

    await issue.save();

    res.status(200).json({
      success: true,
      data: issue
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete issue
// @route   DELETE /api/issues/:id
// @access  Private
exports.deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    // Check if user is authorized to delete this issue
    if (req.user.role !== 'admin' && issue.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this issue'
      });
    }

    // Delete image file
    const imagePath = path.join(__dirname, '../../uploads', issue.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await issue.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Issue deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get issues near a location
// @route   GET /api/issues/nearby/:longitude/:latitude/:distance
// @access  Private
exports.getNearbyIssues = async (req, res) => {
  try {
    const { longitude, latitude, distance = 5 } = req.params;

    const issues = await Issue.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseFloat(distance) * 1000 // Convert km to meters
        }
      }
    }).populate('reportedBy', 'name email');

    res.status(200).json({
      success: true,
      count: issues.length,
      data: issues
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get issue statistics (Admin)
// @route   GET /api/issues/stats
// @access  Private/Admin
exports.getIssueStats = async (req, res) => {
  try {
    const totalIssues = await Issue.countDocuments();
    const pendingIssues = await Issue.countDocuments({ status: 'Pending' });
    const verifiedIssues = await Issue.countDocuments({ status: 'Verified' });
    const inProgressIssues = await Issue.countDocuments({ status: 'In Progress' });
    const resolvedIssues = await Issue.countDocuments({ status: 'Resolved' });
    const rejectedIssues = await Issue.countDocuments({ status: 'Rejected' });

    // Group by category
    const categoryStats = await Issue.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Group by priority
    const priorityStats = await Issue.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalIssues,
        byStatus: {
          pending: pendingIssues,
          verified: verifiedIssues,
          inProgress: inProgressIssues,
          resolved: resolvedIssues,
          rejected: rejectedIssues
        },
        byCategory: categoryStats,
        byPriority: priorityStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
