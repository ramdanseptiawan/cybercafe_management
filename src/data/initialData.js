export const initialData = {
  stockData: [
    { id: 1, name: 'Coffee Beans', quantity: 50, unit: 'kg', minLevel: 10, price: 25990, category: 'Beverages' },
    { id: 2, name: 'Milk', quantity: 20, unit: 'liters', minLevel: 5, price: 3500, category: 'Dairy' },
    { id: 3, name: 'Sugar', quantity: 15, unit: 'kg', minLevel: 5, price: 2990, category: 'Sweeteners' },
    { id: 4, name: 'Bread', quantity: 30, unit: 'loaves', minLevel: 10, price: 1990, category: 'Bakery' }
  ],

  menuData: [
    { id: 1, name: 'Espresso', price: 15000, ingredients: ['Coffee Beans', 'Water'], category: 'Coffee', available: true },
    { id: 2, name: 'Cappuccino', price: 20000, ingredients: ['Coffee Beans', 'Milk', 'Water'], category: 'Coffee', available: true },
    { id: 3, name: 'Latte', price: 22000, ingredients: ['Coffee Beans', 'Milk', 'Water'], category: 'Coffee', available: true },
    { id: 4, name: 'Sandwich', price: 25000, ingredients: ['Bread', 'Cheese', 'Ham'], category: 'Food', available: true }
  ],

  transactionsData: [
    { id: 1, type: 'purchase', item: 'Coffee Beans', quantity: 10, price: 259.90, date: '2024-01-15', supplier: 'Bean Co.' },
    { id: 2, type: 'sale', item: 'Cappuccino', quantity: 5, price: 22.50, date: '2024-01-15', customer: 'Table 3' },
    { id: 3, type: 'purchase', item: 'Milk', quantity: 15, price: 52.50, date: '2024-01-14', supplier: 'Dairy Farm' }
  ],

  computersData: [
    { id: 1, name: 'PC-01', status: 'available', specs: 'i5, 16GB RAM, GTX 1660', lastMaintenance: '2023-05-15', ipAddress: '192.168.1.101', location: 'Main Area' },
    { id: 2, name: 'PC-02', status: 'in-use', specs: 'i7, 32GB RAM, RTX 3060', lastMaintenance: '2023-06-10', ipAddress: '192.168.1.102', location: 'Gaming Zone' },
    { id: 3, name: 'PC-03', status: 'maintenance', specs: 'i5, 16GB RAM, GTX 1660', lastMaintenance: '2023-07-01', ipAddress: '192.168.1.103', location: 'Main Area' },
    { id: 4, name: 'PC-04', status: 'available', specs: 'i7, 32GB RAM, RTX 3070', lastMaintenance: '2023-06-20', ipAddress: '192.168.1.104', location: 'VIP Room' },
  ],

  activeSessionsData: [
    { 
      id: 1, 
      user: 'John Doe', 
      computer: 2, 
      computerName: 'PC-02',
      package: 1,
      packageName: '2 Hour Package',
      duration: 2,
      price: 15000,
      startTime: '14:30',
      endTime: '16:30',
      status: 'active',
      createdAt: new Date().toISOString()
    }
  ],

  timePackagesData: [
    { id: 1, name: '1 Hour Package', duration: 1, price: 8000, description: 'Standard internet usage' },
    { id: 2, name: '2 Hour Package', duration: 2, price: 15000, description: 'Standard internet usage' },
    { id: 3, name: '5 Hour Package', duration: 5, price: 35000, description: 'Standard internet usage' },
    { id: 4, name: 'Gaming Package', duration: 3, price: 25000, description: 'High-performance gaming' },
    { id: 5, name: 'All Day Pass', duration: 12, price: 80000, description: 'Unlimited usage for the day' }
  ],

  customersData: [
    { 
      id: 1, 
      name: 'John Doe', 
      email: 'john@example.com', 
      phone: '081234567890',
      membershipType: 'regular',
      joinDate: '2023-01-15',
      points: 120,
      visits: 15,
      totalSpent: 450000,
      notes: 'Prefers gaming PCs',
      preferredGames: ['Valorant', 'CS:GO', 'Dota 2']
    },
    { 
      id: 2, 
      name: 'Jane Smith', 
      email: 'jane@example.com', 
      phone: '081234567891',
      membershipType: 'gold',
      joinDate: '2023-02-20',
      points: 350,
      visits: 42,
      totalSpent: 1250000,
      notes: 'Regular customer, usually comes on weekends',
      preferredGames: ['League of Legends', 'Fortnite']
    }
  ],

  ordersData: [
    {
      id: 1,
      customer: 'John Doe',
      items: [
        { id: 1, name: 'Espresso', price: 3.50, quantity: 1 },
        { id: 2, name: 'Toast', price: 2.99, quantity: 2 }
      ],
      status: 'completed',
      notes: 'Extra sugar for coffee',
      tableNumber: '3',
      isDelivery: false,
      timestamp: '2024-01-15T14:30:00.000Z',
      total: 9.48
    },
    {
      id: 2,
      customer: 'Jane Smith',
      items: [
        { id: 2, name: 'Cappuccino', price: 4.50, quantity: 2 }
      ],
      status: 'pending',
      notes: '',
      tableNumber: '5',
      isDelivery: false,
      timestamp: new Date().toISOString(),
      total: 9.00
    }
  ]
};

// Enhanced user system with permissions
export const individualUsers = [
  {
    id: 'EMP001',
    username: 'john',
    password: 'password123',
    name: 'John Doe',
    department: 'Kitchen',
    role: 'employee',
    permissions: ['attendance', 'kitchen'], // Specific permissions
    email: 'john.doe@company.com',
    phone: '+62812345678',
    joinDate: '2024-01-15',
    avatar: '/api/placeholder/150/150',
    active: true
  },
  {
    id: 'EMP002',
    username: 'jane',
    password: 'password123',
    name: 'Jane Smith',
    department: 'Operations',
    role: 'employee',
    permissions: ['stock', 'computers'], // Stock and computer operator
    email: 'jane.smith@company.com',
    phone: '+62812345679',
    joinDate: '2024-02-01',
    avatar: '/api/placeholder/150/150',
    active: true
  },
  {
    id: 'EMP003',
    username: 'mike',
    password: 'password123',
    name: 'Mike Johnson',
    department: 'Kitchen',
    role: 'employee',
    permissions: ['kitchen', 'menu'], // Kitchen staff
    email: 'mike.johnson@company.com',
    phone: '+62812345680',
    joinDate: '2024-03-15',
    avatar: '/api/placeholder/150/150',
    active: true
  },
  {
    id: 'EMP004',
    username: 'sarah',
    password: 'password123',
    name: 'Sarah Wilson',
    department: 'IT',
    role: 'employee',
    permissions: ['computers', 'sessions'], // Teknisi
    email: 'sarah.wilson@company.com',
    phone: '+62812345681',
    joinDate: '2024-01-20',
    avatar: '/api/placeholder/150/150',
    active: true
  }
];

// Role definitions with permissions
export const roleDefinitions = [
  {
    id: 'admin',
    name: 'Administrator',
    permissions: ['all'], // All permissions
    description: 'Full system access'
  },
  {
    id: 'kitchen_staff',
    name: 'Kitchen Staff',
    permissions: ['dashboard', 'kitchen', 'menu', 'attendance'],
    description: 'Kitchen operations and menu management'
  },
  {
    id: 'stock_manager',
    name: 'Stock Manager',
    permissions: ['dashboard', 'stock', 'menu', 'reports', 'attendance'],
    description: 'Stock and inventory management'
  },
  {
    id: 'computer_operator',
    name: 'Computer Operator',
    permissions: ['dashboard', 'computers', 'sessions', 'customers', 'attendance'],
    description: 'Computer and session management'
  },
  {
    id: 'technician',
    name: 'Technician',
    permissions: ['dashboard', 'computers', 'sessions', 'attendance'],
    description: 'Technical support and maintenance'
  },
  {
    id: 'cashier',
    name: 'Cashier',
    permissions: ['dashboard', 'transactions', 'customers', 'attendance'],
    description: 'Transaction and customer management'
  }
];

// Available permissions
export const availablePermissions = [
  { id: 'dashboard', name: 'Dashboard', description: 'View dashboard and statistics' },
  { id: 'stock', name: 'Stock Management', description: 'Manage inventory and stock' },
  { id: 'menu', name: 'Menu Management', description: 'Manage cafe menu items' },
  { id: 'transactions', name: 'Transactions', description: 'Handle financial transactions' },
  { id: 'reports', name: 'Reports', description: 'View and generate reports' },
  { id: 'computers', name: 'Computer Management', description: 'Manage computer systems' },
  { id: 'sessions', name: 'Session Management', description: 'Manage user sessions' },
  { id: 'customers', name: 'Customer Management', description: 'Manage customer data' },
  { id: 'kitchen', name: 'Kitchen Management', description: 'Manage kitchen operations' },
  { id: 'attendance', name: 'Attendance', description: 'Manage attendance system' },
  { id: 'settings', name: 'Settings', description: 'System configuration' },
  { id: 'all', name: 'All Permissions', description: 'Complete system access' }
];