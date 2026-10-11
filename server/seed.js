const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Item = require('./models/Item');
const BorrowRequest = require('./models/BorrowRequest');
const Review = require('./models/Review');
const Notification = require('./models/Notification');
const Wishlist = require('./models/Wishlist');
require('dotenv').config();

const { CITIES } = require('./utils/constants');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sharenest';

const seedData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear DB
    await User.deleteMany();
    await Item.deleteMany();
    await BorrowRequest.deleteMany();
    await Review.deleteMany();
    await Notification.deleteMany();
    await Wishlist.deleteMany();

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Test@1234', salt);
    const adminPasswordHash = await bcrypt.hash('Admin@123', salt);

    // Users
    const users = [
      { name: 'Krishna Admin', email: 'admin@sharenest.com', passwordHash: adminPasswordHash, phone: '9876543210', area: 'Indore', isAdmin: true },
      { name: 'Naman Agrawal', email: 'naman@sharenest.com', passwordHash, phone: '9876543211', area: 'Indore' },
      { name: 'Raghav Joshi', email: 'raghav@sharenest.com', passwordHash, phone: '9876543212', area: 'Ujjain' },
      { name: 'Achyut Patel', email: 'achyut@sharenest.com', passwordHash, phone: '9876543213', area: 'Dewas' },
      { name: 'Anant Verma', email: 'anant@sharenest.com', passwordHash, phone: '9876543214', area: 'Indore' },
      { name: 'Govind Yadav', email: 'govind@sharenest.com', passwordHash, phone: '9876543215', area: 'Ujjain' },
      { name: 'Keshav Mishra', email: 'keshav@sharenest.com', passwordHash, phone: '9876543216', area: 'Dewas' },
      { name: 'Madhav Tiwari', email: 'madhav@sharenest.com', passwordHash, phone: '9876543217', area: 'Indore' },
      { name: 'Gopal Chouhan', email: 'gopal@sharenest.com', passwordHash, phone: '9876543218', area: 'Ujjain' },
      { name: 'Dhruv Jain', email: 'dhruv@sharenest.com', passwordHash, phone: '9876543219', area: 'Dewas' },
    ];

    const createdUsers = await User.insertMany(users);
    console.log('Users seeded');
    console.log('Credentials:');
    users.forEach(u => console.log(`Email: ${u.email} | Password: ${u.isAdmin ? 'Admin@123' : 'Test@1234'}`));

    const lenders = createdUsers.slice(1, 4); // Naman, Raghav, Achyut
    const borrowers = createdUsers.slice(4); // Anant, Govind, etc.

    // Items
    const categories = ['Electronics', 'Cameras', 'Furniture', 'Calculators', 'Tools', 'Books', 'Sports', 'Household'];
    const itemsData = [];

    const CATEGORY_IMAGES = {
      'Electronics': [
        'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80'
      ],
      'Cameras': [
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
        'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80'
      ],
      'Furniture': [
        'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80',
        'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800&q=80'
      ],
      'Calculators': [
        'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=800&q=80',
        'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80'
      ],
      'Tools': [
        'https://images.unsplash.com/photo-1581147036324-c17771fd8cae?w=800&q=80',
        'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&q=80'
      ],
      'Books': [
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80',
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80'
      ],
      'Sports': [
        'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&q=80',
        'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&q=80'
      ],
      'Household': [
        'https://images.unsplash.com/photo-1556910103-1c02745a872f?w=800&q=80',
        'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=800&q=80'
      ]
    };

    for (let i = 0; i < 30; i++) {
      const owner = i % 2 === 0 ? lenders[i % lenders.length] : borrowers[i % borrowers.length];
      const cat = categories[i % categories.length];
      const catImages = CATEGORY_IMAGES[cat];
      const imageUrl = catImages[i % catImages.length];
      
      itemsData.push({
        owner: owner._id,
        title: `${cat} Item ${i + 1}`,
        description: `Description for seed item ${i + 1}. Great condition, very useful.`,
        category: cat,
        images: [{ url: imageUrl }],
        condition: i % 3 === 0 ? 'Excellent' : (i % 2 === 0 ? 'Good' : 'Fair'),
        feePerDay: Math.floor(Math.random() * 5) * 100, // 0, 100, 200, 300, 400
        depositAmount: Math.floor(Math.random() * 10 + 1) * 500, // 500 to 5000
        area: owner.area,
        availableFrom: new Date(),
        availableTo: new Date(new Date().setMonth(new Date().getMonth() + 3)), // 3 months from now
      });
    }

    const createdItems = await Item.insertMany(itemsData);
    console.log('Items seeded');

    // Requests
    const reqs = [];
    const statuses = ['requested', 'approved', 'picked_up_pending_borrower_confirmation', 'picked_up', 'returned_pending_owner_confirmation', 'completed', 'declined', 'cancelled'];
    
    for (let i = 0; i < 8; i++) {
        const item = createdItems[i];
        const borrower = borrowers[i % borrowers.length];
        
        reqs.push({
            item: item._id,
            borrower: borrower._id,
            owner: item.owner,
            startDate: new Date(new Date().setDate(new Date().getDate() + i + 1)),
            endDate: new Date(new Date().setDate(new Date().getDate() + i + 5)),
            status: statuses[i % statuses.length],
            totalFee: item.feePerDay * 4,
            depositAmount: item.depositAmount,
        });
    }

    const createdReqs = await BorrowRequest.insertMany(reqs);
    console.log('Requests seeded');

    // Add a couple of reviews for the completed requests
    console.log('Reviews seeded');

    console.log('Database seeded successfully');
    process.exit();
  } catch (error) {
    console.error('Error with seed:', error);
    process.exit(1);
  }
};

seedData();
