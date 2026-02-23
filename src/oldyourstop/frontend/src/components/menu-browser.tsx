'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useMenu, useMenuCategories, useMenuItems, useMenuSearch } from '@/hooks/use-menu';
import { MenuItem, MenuCategory, MenuFilters } from '@/lib/restaurant-data-types';
import { MenuItem as MenuItemType } from '@/types/restaurant';
import { Search, Filter, Star, Clock, Users, Zap, Heart, Share2, Plus, Minus } from 'lucide-react';
import { format } from 'date-fns';

interface MenuBrowserProps {
  restaurantId: string;
  restaurantName: string;
}

export function MenuBrowser({ restaurantId, restaurantName }: MenuBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filters, setFilters] = useState<MenuFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [cart, setCart] = useState<{ [itemId: string]: number }>({});
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const { menu, loading, error, refreshMenu } = useMenu(restaurantId, filters);
  const { categories } = useMenuCategories(restaurantId);
  const { searchResults, searchItems, clearSearch } = useMenuSearch(restaurantId);

  const [displayItems, setDisplayItems] = useState<MenuItemType[]>([]);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchItems(searchQuery, filters);
    } else {
      clearSearch();
    }
  }, [searchQuery, filters, searchItems, clearSearch]);

  useEffect(() => {
    if (searchQuery.trim() && searchResults.length > 0) {
      setDisplayItems(searchResults as any);
    } else if (menu) {
      let items: MenuItemType[] = [];
      
      if (selectedCategory === 'all') {
        items = menu.categories.flatMap(cat => cat.items as any);
      } else {
        const category = menu.categories.find(cat => cat.id === selectedCategory);
        if (category) {
          items = category.items as any;
        }
      }
      
      setDisplayItems(items);
    }
  }, [searchQuery, searchResults, menu, selectedCategory]);

  const handleAddToCart = (itemId: string) => {
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) {
        newCart[itemId] -= 1;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const handleToggleFavorite = (itemId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(itemId)) {
        newFavorites.delete(itemId);
      } else {
        newFavorites.add(itemId);
      }
      return newFavorites;
    });
  };

  const handleFilterChange = (newFilters: Partial<MenuFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(price);
  };

  const getCartTotal = () => {
    return Object.entries(cart).reduce((total, [itemId, quantity]) => {
      const item = displayItems.find(i => i.id === itemId);
      return total + (item ? item.price * quantity : 0);
    }, 0);
  };

  const getCartItemCount = () => {
    return Object.values(cart).reduce((total, quantity) => total + quantity, 0);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={refreshMenu}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Menu</h2>
          <p className="text-gray-600">{restaurantName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button asChild>
            <a href={`/restaurants/${restaurantId}/book`}>
              Book Table
            </a>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Price Range</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.priceRange?.min || ''}
                      onChange={(e) => handleFilterChange({
                        priceRange: {
                          ...filters.priceRange,
                          min: e.target.value ? parseFloat(e.target.value) : undefined
                        }
                      })}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.priceRange?.max || ''}
                      onChange={(e) => handleFilterChange({
                        priceRange: {
                          ...filters.priceRange,
                          max: e.target.value ? parseFloat(e.target.value) : undefined
                        }
                      })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Dietary</label>
                  <div className="space-y-2">
                    {['vegetarian', 'vegan', 'gluten-free', 'dairy-free'].map(diet => (
                      <label key={diet} className="flex items-center space-x-2">
                        <Checkbox
                          checked={filters.dietary?.includes(diet) || false}
                          onCheckedChange={(checked) => {
                            const currentDietary = filters.dietary || [];
                            const newDietary = checked
                              ? [...currentDietary, diet]
                              : currentDietary.filter(d => d !== diet);
                            handleFilterChange({ dietary: newDietary });
                          }}
                        />
                        <span className="text-sm capitalize">{diet}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Availability</label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <Checkbox
                        checked={filters.availability || false}
                        onCheckedChange={(checked) => handleFilterChange({ availability: !!checked })}
                      />
                      <span className="text-sm">Available now</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Menu Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayItems.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Item Image */}
                {item.imageUrl && (
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Item Info */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleFavorite(item.id)}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          favorites.has(item.id) ? 'text-red-500 fill-current' : 'text-gray-400'
                        }`}
                      />
                    </Button>
                  </div>

                  <p className="text-sm text-gray-600">{item.description}</p>

                  {/* Price and Rating */}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">
                      {formatPrice(item.price)}
                    </span>
                    {(item as any).popularity && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">{(item as any).popularity}%</span>
                      </div>
                    )}
                  </div>

                  {/* Dietary Tags */}
                  {(item as any).dietary && (item as any).dietary.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(item as any).dietary.map((diet: string) => (
                        <Badge key={diet} variant="secondary" className="text-xs">
                          {diet}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Allergens */}
                  {item.allergens && (item.allergens.contains?.length > 0 || item.allergens.mayContain?.length > 0) && (
                    <div className="text-xs text-gray-500">
                      <strong>Allergens:</strong>{' '}
                      {item.allergens.contains?.length > 0 && (
                        <span>Contains: {item.allergens.contains.join(', ')}</span>
                      )}
                      {item.allergens.mayContain?.length > 0 && (
                        <span>May contain: {item.allergens.mayContain.join(', ')}</span>
                      )}
                    </div>
                  )}

                  {/* Prep Time */}
                  {(item as any).prepTime && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{(item as any).prepTime} min</span>
                    </div>
                  )}

                  {/* Availability */}
                  <div className="flex items-center gap-2">
                    {(item as any).availability ? (
                      <Badge className="bg-green-100 text-green-800">Available</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">Unavailable</Badge>
                    )}
                    {(item as any).spiceLevel && (item as any).spiceLevel > 0 && (
                      <div className="flex gap-1">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Zap
                            key={i}
                            className={`w-3 h-3 ${
                              i < (item as any).spiceLevel! ? 'text-red-500 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add to Cart */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveFromCart(item.id)}
                        disabled={!cart[item.id]}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">
                        {cart[item.id] || 0}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddToCart(item.id)}
                        disabled={!item.availability}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(item.id)}
                      disabled={!item.availability}
                      className="flex-1"
                    >
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cart Summary */}
      {getCartItemCount() > 0 && (
        <Card className="fixed bottom-4 right-4 z-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {getCartItemCount()} items
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {formatPrice(getCartTotal())}
                </p>
              </div>
              <Button>
                View Cart
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {displayItems.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or filters to find what you're looking for.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setFilters({});
                setSelectedCategory('all');
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
