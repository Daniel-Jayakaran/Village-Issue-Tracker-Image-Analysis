/**
 * Database Seed Script
 * Enterprise Village Issue Tracking System
 * 
 * Run: npm run seed
 * Seeds initial demo data into MongoDB
 */

const { connectDatabase, closeDatabase } = require('./connection');
const { User } = require('../models');

async function seedDatabase() {
    console.log('🚀 Starting database seeding...\n');
    
    try {
        // Connect to MongoDB
        await connectDatabase();

        // Check if already seeded
        const existingUsers = await User.countDocuments();
        if (existingUsers > 0) {
            console.log('⚠️  Database already contains data. Skipping seed.\n');
            await closeDatabase();
            process.exit(0);
        }

        console.log('📦 Seeding initial data...\n');

        // Create Admin User
        const admin = await User.create({
            email: 'admin@village.gov.in',
            password: 'password123',
            name: 'Village Administrator',
            phone: '9876543210',
            role: 'ADMIN',
            village: 'Rampur',
            district: 'Lucknow',
            state: 'Uttar Pradesh'
        });
        console.log('✅ Admin user created: admin@village.gov.in');

        // Create Worker Users
        await User.create({
            email: 'worker1@village.gov.in',
            password: 'password123',
            name: 'Ramesh Kumar',
            phone: '9876543211',
            role: 'WORKER',
            village: 'Rampur',
            district: 'Lucknow',
            state: 'Uttar Pradesh'
        });

        await User.create({
            email: 'worker2@village.gov.in',
            password: 'password123',
            name: 'Suresh Singh',
            phone: '9876543212',
            role: 'WORKER',
            village: 'Rampur',
            district: 'Lucknow',
            state: 'Uttar Pradesh'
        });
        console.log('✅ Worker users created: worker1@village.gov.in, worker2@village.gov.in');

        // Create Citizen Users
        await User.create({
            email: 'citizen1@example.com',
            password: 'password123',
            name: 'Mohan Lal',
            phone: '9876543213',
            role: 'CITIZEN',
            address: '123 Main Street',
            village: 'Rampur',
            district: 'Lucknow',
            state: 'Uttar Pradesh'
        });

        await User.create({
            email: 'citizen2@example.com',
            password: 'password123',
            name: 'Geeta Devi',
            phone: '9876543214',
            role: 'CITIZEN',
            address: '456 Village Road',
            village: 'Rampur',
            district: 'Lucknow',
            state: 'Uttar Pradesh'
        });
        console.log('✅ Citizen users created: citizen1@example.com, citizen2@example.com');

        console.log('\n✨ Database seeding complete!\n');
        console.log('📋 Test Credentials:');
        console.log('   Admin:   admin@village.gov.in / password123');
        console.log('   Worker:  worker1@village.gov.in / password123');
        console.log('   Citizen: citizen1@example.com / password123');
        console.log('');

        await closeDatabase();
        process.exit(0);
    } catch (error) {
        console.error('❌ Database seeding failed:', error);
        process.exit(1);
    }
}

// Run seeding
seedDatabase();
