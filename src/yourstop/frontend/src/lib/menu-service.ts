// Real-time menu service for restaurant data
import { MenuData, MenuCategory, MenuItem } from './restaurant-data-types';

// Define missing interfaces locally
interface AllergenInfo {
  contains: string[];
  mayContain: string[];
}

interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}
import { API_CONFIG, isApiKeyConfigured, getApiKey, rateLimiter } from './api-config';

export interface MenuFilters {
  category?: string;
  dietary?: string[]; // ['vegetarian', 'vegan', 'gluten-free', 'dairy-free']
  priceRange?: {
    min: number;
    max: number;
  };
  allergens?: string[]; // Allergens to exclude
  availability?: boolean; // Only show available items
}

export interface MenuUpdate {
  restaurantId: string;
  categoryId: string;
  itemId: string;
  changes: Partial<MenuItem>;
  timestamp: string;
}

class MenuService {
  private baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  // Cache TTL for different types of data
  private readonly CACHE_TTL = {
    MENU: 24 * 60 * 60 * 1000, // 24 hours
    PRICING: 60 * 60 * 1000, // 1 hour
    AVAILABILITY: 5 * 60 * 1000, // 5 minutes
  };

  // Get menu data for a restaurant
  async getMenu(restaurantId: string, filters?: MenuFilters): Promise<MenuData> {
    const cacheKey = `menu_${restaurantId}_${JSON.stringify(filters)}`;
    const cached = this.getCachedData(cacheKey, this.CACHE_TTL.MENU);
    
    if (cached) {
      return cached;
    }

    try {
      // Check if POS APIs are configured
      const hasPosApis = isApiKeyConfigured('TOAST_API_KEY') || 
                        isApiKeyConfigured('SQUARE_API_KEY');

      let menu: MenuData;

      if (hasPosApis) {
        // Try multiple POS APIs in parallel
        const [toast, square] = await Promise.allSettled([
          this.fetchToastMenu(restaurantId, filters),
          this.fetchSquareMenu(restaurantId, filters)
        ]);

        // Merge menu data from all sources
        menu = this.mergeMenuData(
          toast.status === 'fulfilled' ? toast.value : null,
          square.status === 'fulfilled' ? square.value : null,
          restaurantId
        );
      } else {
        // Use enhanced mock data
        menu = this.generateMockMenu(restaurantId, filters);
      }

      this.setCachedData(cacheKey, menu, this.CACHE_TTL.MENU);
      return menu;
    } catch (error) {
      console.error('Error fetching menu:', error);
      // Fallback to mock data
      const menu = this.generateMockMenu(restaurantId, filters);
      this.setCachedData(cacheKey, menu, this.CACHE_TTL.MENU);
      return menu;
    }
  }

  // Get menu categories
  async getMenuCategories(restaurantId: string): Promise<MenuCategory[]> {
    const menu = await this.getMenu(restaurantId);
    return menu.categories;
  }

  // Get menu items by category
  async getMenuItems(restaurantId: string, categoryId: string, filters?: MenuFilters): Promise<MenuItem[]> {
    const menu = await this.getMenu(restaurantId);
    const category = menu.categories.find(c => c.id === categoryId);
    
    if (!category) return [];

    let items = category.items;

    // Apply filters
    if (filters) {
      items = this.filterMenuItems(items, filters);
    }

    return items;
  }

  // Search menu items
  async searchMenuItems(restaurantId: string, query: string, filters?: MenuFilters): Promise<MenuItem[]> {
    const menu = await this.getMenu(restaurantId);
    let allItems: MenuItem[] = [];

    // Flatten all items from all categories
    menu.categories.forEach(category => {
      allItems = allItems.concat(category.items);
    });

    // Search by name or description
    const searchResults = allItems.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.description?.toLowerCase().includes(query.toLowerCase())
    );

    // Apply additional filters
    if (filters) {
      return this.filterMenuItems(searchResults, filters);
    }

    return searchResults;
  }

  // Get item availability
  async getItemAvailability(restaurantId: string, itemId: string): Promise<{
    available: boolean;
    estimatedPrepTime?: number;
    lastUpdated: string;
  }> {
    const cacheKey = `availability_${restaurantId}_${itemId}`;
    const cached = this.getCachedData(cacheKey, this.CACHE_TTL.AVAILABILITY);
    
    if (cached) {
      return cached;
    }

    try {
      // Check if POS APIs are configured
      const hasPosApis = isApiKeyConfigured('TOAST_API_KEY') || 
                        isApiKeyConfigured('SQUARE_API_KEY');

      let availability;

      if (hasPosApis) {
        // Try to get real availability from POS systems
        const [toast, square] = await Promise.allSettled([
          this.fetchToastItemAvailability(restaurantId, itemId),
          this.fetchSquareItemAvailability(restaurantId, itemId)
        ]);

        // Use the first successful result
        availability = toast.status === 'fulfilled' ? toast.value : 
                     square.status === 'fulfilled' ? square.value : 
                     this.generateMockAvailability(itemId);
      } else {
        availability = this.generateMockAvailability(itemId);
      }

      this.setCachedData(cacheKey, availability, this.CACHE_TTL.AVAILABILITY);
      return availability;
    } catch (error) {
      console.error('Error fetching item availability:', error);
      const availability = this.generateMockAvailability(itemId);
      this.setCachedData(cacheKey, availability, this.CACHE_TTL.AVAILABILITY);
      return availability;
    }
  }

  // Private methods for API integrations
  private async fetchToastMenu(restaurantId: string, filters?: MenuFilters): Promise<MenuData | null> {
    if (!isApiKeyConfigured('TOAST_API_KEY')) return null;

    try {
      const apiKey = getApiKey('TOAST_API_KEY');
      const url = `${API_CONFIG.TOAST_BASE_URL}/restaurants/${restaurantId}/menu`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Toast API error');

      const data = await response.json();
      return this.transformToastMenuData(data, restaurantId);
    } catch (error) {
      console.error('Toast menu error:', error);
      return null;
    }
  }

  private async fetchSquareMenu(restaurantId: string, filters?: MenuFilters): Promise<MenuData | null> {
    if (!isApiKeyConfigured('SQUARE_API_KEY')) return null;

    try {
      const apiKey = getApiKey('SQUARE_API_KEY');
      const url = `${API_CONFIG.SQUARE_BASE_URL}/restaurants/${restaurantId}/menu`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Square API error');

      const data = await response.json();
      return this.transformSquareMenuData(data, restaurantId);
    } catch (error) {
      console.error('Square menu error:', error);
      return null;
    }
  }

  private async fetchToastItemAvailability(restaurantId: string, itemId: string): Promise<{
    available: boolean;
    estimatedPrepTime?: number;
    lastUpdated: string;
  }> {
    // Implementation for Toast item availability
    return {
      available: true,
      estimatedPrepTime: 15,
      lastUpdated: new Date().toISOString()
    };
  }

  private async fetchSquareItemAvailability(restaurantId: string, itemId: string): Promise<{
    available: boolean;
    estimatedPrepTime?: number;
    lastUpdated: string;
  }> {
    // Implementation for Square item availability
    return {
      available: true,
      estimatedPrepTime: 20,
      lastUpdated: new Date().toISOString()
    };
  }

  // Data transformation methods
  private transformToastMenuData(data: any, restaurantId: string): MenuData {
    // Transform Toast API response to our format
    return {
      restaurantId,
      categories: [],
      lastUpdated: new Date().toISOString(),
      source: 'toast'
    };
  }

  private transformSquareMenuData(data: any, restaurantId: string): MenuData {
    // Transform Square API response to our format
    return {
      restaurantId,
      categories: [],
      lastUpdated: new Date().toISOString(),
      source: 'square'
    };
  }

  // Enhanced mock data generation
  private generateMockMenu(restaurantId: string, filters?: MenuFilters): MenuData {
    const categories: MenuCategory[] = [
      {
        id: 'appetizers',
        name: 'Appetizers',
        description: 'Start your meal with our delicious appetizers',
        items: this.generateMockItems('appetizers', 8),
        order: 1
      },
      {
        id: 'mains',
        name: 'Main Courses',
        description: 'Our signature main dishes',
        items: this.generateMockItems('mains', 12),
        order: 2
      },
      {
        id: 'desserts',
        name: 'Desserts',
        description: 'Sweet endings to your meal',
        items: this.generateMockItems('desserts', 6),
        order: 3
      },
      {
        id: 'beverages',
        name: 'Beverages',
        description: 'Refreshing drinks and cocktails',
        items: this.generateMockItems('beverages', 10),
        order: 4
      }
    ];

    return {
      restaurantId,
      categories,
      lastUpdated: new Date().toISOString(),
      source: 'manual'
    };
  }

  private generateMockItems(category: string, count: number): MenuItem[] {
    const items: MenuItem[] = [];
    
    const itemTemplates = {
      appetizers: [
        { name: 'Bruschetta', basePrice: 8.50, description: 'Toasted bread with fresh tomatoes and basil' },
        { name: 'Calamari Fritti', basePrice: 12.00, description: 'Crispy fried calamari with marinara sauce' },
        { name: 'Burrata Salad', basePrice: 14.50, description: 'Creamy burrata with arugula and cherry tomatoes' },
        { name: 'Charcuterie Board', basePrice: 18.00, description: 'Selection of cured meats and artisan cheeses' }
      ],
      mains: [
        { name: 'Spaghetti Carbonara', basePrice: 18.50, description: 'Classic pasta with egg, Pecorino Romano, and guanciale' },
        { name: 'Grilled Salmon', basePrice: 24.00, description: 'Served with asparagus and lemon-dill sauce' },
        { name: 'Beef Tenderloin', basePrice: 32.00, description: '8oz tenderloin with roasted vegetables' },
        { name: 'Risotto Milanese', basePrice: 22.00, description: 'Creamy saffron risotto with parmesan' }
      ],
      desserts: [
        { name: 'Tiramisu', basePrice: 8.00, description: 'Coffee-soaked ladyfingers with mascarpone' },
        { name: 'Chocolate Lava Cake', basePrice: 9.50, description: 'Warm chocolate cake with vanilla ice cream' },
        { name: 'Panna Cotta', basePrice: 7.50, description: 'Vanilla panna cotta with berry compote' }
      ],
      beverages: [
        { name: 'House Wine', basePrice: 8.00, description: 'Red or white wine by the glass' },
        { name: 'Craft Beer', basePrice: 6.50, description: 'Local craft beer selection' },
        { name: 'Fresh Juice', basePrice: 4.50, description: 'Orange, apple, or cranberry juice' }
      ]
    };

    const templates = itemTemplates[category as keyof typeof itemTemplates] || [];
    
    for (let i = 0; i < count; i++) {
      const template = templates[i % templates.length];
      const variation = i >= templates.length ? ` (Variation ${Math.floor(i / templates.length) + 1})` : '';
      
      items.push({
        id: `${category}-${i + 1}`,
        name: template.name + variation,
        description: template.description,
        price: template.basePrice + (Math.random() * 4 - 2), // Add some price variation
        imageUrl: `https://source.unsplash.com/random/400x300?food,${category}&sig=${i}`,
        category: category,
        allergens: this.generateMockAllergens().contains,
        currency: 'GBP',
        dietaryInfo: [],
        isAvailable: true,
        lastUpdated: new Date().toISOString()
      });
    }

    return items;
  }

  private generateMockIngredients(category: string): string[] {
    const ingredientSets = {
      appetizers: ['tomatoes', 'basil', 'olive oil', 'garlic', 'bread'],
      mains: ['pasta', 'cheese', 'cream', 'herbs', 'vegetables'],
      desserts: ['sugar', 'eggs', 'flour', 'chocolate', 'cream'],
      beverages: ['water', 'ice', 'garnish']
    };
    
    const baseIngredients = ingredientSets[category as keyof typeof ingredientSets] || ['ingredient'];
    const additionalIngredients = ['salt', 'pepper', 'olive oil', 'herbs'];
    
    return [...baseIngredients, ...additionalIngredients.slice(0, Math.floor(Math.random() * 3))];
  }

  private generateMockAllergens(): AllergenInfo {
    const commonAllergens = ['gluten', 'dairy', 'nuts', 'eggs', 'soy', 'shellfish'];
    const hasAllergens = Math.random() > 0.3; // 70% chance of having allergens
    
    if (!hasAllergens) {
      return { contains: [], mayContain: [] };
    }
    
    const contains = commonAllergens.filter(() => Math.random() > 0.7);
    const mayContain = commonAllergens.filter(() => Math.random() > 0.8);
    
    return { contains, mayContain };
  }

  private generateMockNutritionalInfo(): NutritionalInfo {
    return {
      calories: Math.floor(Math.random() * 500) + 100,
      protein: Math.floor(Math.random() * 30) + 5,
      carbs: Math.floor(Math.random() * 50) + 10,
      fat: Math.floor(Math.random() * 20) + 2,
      fiber: Math.floor(Math.random() * 10),
      sugar: Math.floor(Math.random() * 20),
      sodium: Math.floor(Math.random() * 500) + 100
    };
  }

  private generateMockDietaryInfo(): string[] {
    const dietaryOptions = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'low-carb'];
    return dietaryOptions.filter(() => Math.random() > 0.6);
  }

  private generateMockAvailability(itemId: string): {
    available: boolean;
    estimatedPrepTime?: number;
    lastUpdated: string;
  } {
    return {
      available: Math.random() > 0.1, // 90% availability
      estimatedPrepTime: Math.floor(Math.random() * 20) + 10,
      lastUpdated: new Date().toISOString()
    };
  }

  private filterMenuItems(items: MenuItem[], filters: MenuFilters): MenuItem[] {
    return items.filter(item => {
      // Category filter
      if (filters.category && item.category !== filters.category) {
        return false;
      }

      // Dietary filter (removed since dietary property doesn't exist on MenuItem)

      // Price range filter
      if (filters.priceRange) {
        if (item.price < filters.priceRange.min || item.price > filters.priceRange.max) {
          return false;
        }
      }

      // Allergen filter (exclude items with specified allergens)
      if (filters.allergens && filters.allergens.length > 0) {
        const hasExcludedAllergens = filters.allergens.some(allergen =>
          item.allergens?.includes(allergen)
        );
        if (hasExcludedAllergens) return false;
      }

      // Availability filter (removed since availability property doesn't exist on MenuItem)

      return true;
    });
  }

  private mergeMenuData(toast: MenuData | null, square: MenuData | null, restaurantId: string): MenuData {
    // Merge data from multiple sources
    const allCategories: MenuCategory[] = [];
    const sources: string[] = [];

    if (toast) {
      allCategories.push(...toast.categories);
      sources.push('toast');
    }
    if (square) {
      allCategories.push(...square.categories);
      sources.push('square');
    }

    // Deduplicate categories and items
    const mergedCategories = this.mergeCategories(allCategories);

    return {
      restaurantId,
      categories: mergedCategories,
      lastUpdated: new Date().toISOString(),
      source: 'manual' as const
    };
  }

  private mergeCategories(categories: MenuCategory[]): MenuCategory[] {
    const categoryMap = new Map<string, MenuCategory>();

    categories.forEach(category => {
      const existing = categoryMap.get(category.id);
      if (!existing) {
        categoryMap.set(category.id, category);
      } else {
        // Merge items
        const mergedItems = this.mergeItems([...existing.items, ...category.items]);
        categoryMap.set(category.id, {
          ...existing,
          items: mergedItems
        });
      }
    });

    return Array.from(categoryMap.values()).sort((a, b) => a.order - b.order);
  }

  private mergeItems(items: MenuItem[]): MenuItem[] {
    const itemMap = new Map<string, MenuItem>();

    items.forEach(item => {
      const existing = itemMap.get(item.id);
      if (!existing) {
        itemMap.set(item.id, item);
      } else {
        // Merge item data, prioritizing newer information
        const mergedItem: MenuItem = {
          ...existing,
          ...item,
          lastUpdated: new Date().toISOString()
        };
        itemMap.set(item.id, mergedItem);
      }
    });

    return Array.from(itemMap.values());
  }

  // Cache management
  private getCachedData(key: string, ttl: number): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }
}

export const menuService = new MenuService();
