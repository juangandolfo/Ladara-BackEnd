import dotenv from 'dotenv';
import { AppDataSource } from '../data-source';
import { Product } from '../product/product.entity';
import { User } from '../user/user.entity';
import { BusinessSetting } from '../business-settings/business-setting.entity';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const DEFAULT_PRODUCT_IMAGE = '/vacuna.jpg';

async function runSeeds() {
  try {
    await AppDataSource.initialize();
    console.log('✓ Database connection established');

    // Seed Users
    const userRepository = AppDataSource.getRepository(User);
    const existingUsers = await userRepository.count();
    
    if (existingUsers === 0) {
      const users = [
        { id: uuidv4(), name: 'Admin User', isAdmin: true },
        { id: uuidv4(), name: 'John Doe', isAdmin: false },
        { id: uuidv4(), name: 'Jane Smith', isAdmin: false },
      ];
      await userRepository.save(users);
      console.log('✓ Users seeded:', users.length);
    } else {
      console.log('✓ Users already exist, skipping...');
    }

    const businessSettingRepository = AppDataSource.getRepository(BusinessSetting);
    const existingShippingCost = await businessSettingRepository.findOneBy({ key: 'shippingCost' });

    if (!existingShippingCost) {
      await businessSettingRepository.save({
        key: 'shippingCost',
        value: 8,
        description: 'Delivery cost charged for active carts.',
      });
      console.log('✓ Shipping cost seeded: 8.00');
    }

    // Seed Products
    const productRepository = AppDataSource.getRepository(Product);
    const existingProducts = await productRepository.count();

    if (existingProducts === 0) {
      const products = [
        {
          name: 'Laptop Pro',
          price: 1299.99,
          description: 'High-performance laptop for professionals',
          code: 'LAP-001',
          stock: 15,
          category: 'Electronics',
          image: DEFAULT_PRODUCT_IMAGE,
        },
        {
          name: 'Wireless Mouse',
          price: 29.99,
          description: 'Ergonomic wireless mouse with precision control',
          code: 'MOU-001',
          stock: 50,
          category: 'Accessories',
          image: DEFAULT_PRODUCT_IMAGE,
        },
        {
          name: 'USB-C Cable',
          price: 12.99,
          description: 'High-speed USB-C charging and data cable',
          code: 'CAB-001',
          stock: 100,
          category: 'Cables',
          image: DEFAULT_PRODUCT_IMAGE,
        },
        {
          name: 'Mechanical Keyboard',
          price: 149.99,
          description: 'RGB mechanical keyboard with Cherry MX switches',
          code: 'KEY-001',
          stock: 25,
          category: 'Accessories',
          image: DEFAULT_PRODUCT_IMAGE,
        },
        {
          name: 'Monitor 4K',
          price: 599.99,
          description: '27-inch 4K ultra HD display for professional work',
          code: 'MON-001',
          stock: 8,
          category: 'Electronics',
          image: DEFAULT_PRODUCT_IMAGE,
        },
        {
          name: 'Webcam HD',
          price: 79.99,
          description: '1080p HD webcam with built-in microphone',
          code: 'WEB-001',
          stock: 30,
          category: 'Accessories',
          image: DEFAULT_PRODUCT_IMAGE,
        },
      ];

      await productRepository.save(products);
      console.log('✓ Products seeded:', products.length);
    } else {
      console.log('✓ Products already exist, skipping...');
    }

    console.log('\n✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

runSeeds();
