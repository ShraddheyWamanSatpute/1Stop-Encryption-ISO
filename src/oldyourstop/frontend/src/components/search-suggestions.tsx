'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Clock, TrendingUp, History, X, Utensils } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SearchSuggestion {
  id?: string;
  type: 'restaurant' | 'cuisine' | 'location' | 'history' | 'trending';
  text: string;
  subtitle?: string;
  icon?: React.ReactNode;
  popularity?: number;
  description?: string;
}

interface SearchSuggestionsProps {
  query: string;
  onSelect: (suggestion: SearchSuggestion) => void;
  isVisible: boolean;
  onClose: () => void;
  locationQuery?: string;
}

export function SearchSuggestions({ query, onSelect, isVisible, onClose, locationQuery }: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length >= 2 && isVisible) {
      fetchSuggestions(query);
    } else if (query.length === 0 && isVisible) {
      // Show search history when query is empty
      showSearchHistory();
    } else {
      setSuggestions([]);
    }
    setSelectedIndex(-1);
  }, [query, isVisible]);

  const fetchSuggestions = async (searchQuery: string) => {
    setLoading(true);
    try {
      // Get local suggestions first (from localStorage)
      const localSuggestions = getLocalSuggestions(searchQuery);
      
      // Fetch API suggestions
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(locationQuery || '')}`);
      let apiSuggestions: SearchSuggestion[] = [];
      
      if (response.ok) {
        const data = await response.json();
        apiSuggestions = data.suggestions || [];
      }

      // Combine and deduplicate suggestions
      const combinedSuggestions = [...localSuggestions, ...apiSuggestions];
      const uniqueSuggestions = combinedSuggestions.reduce((acc, current) => {
        const exists = acc.find(item => item.text.toLowerCase() === current.text.toLowerCase());
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, [] as SearchSuggestion[]);

      // Sort by relevance and popularity
      uniqueSuggestions.sort((a, b) => {
        const aStartsWith = a.text.toLowerCase().startsWith(searchQuery.toLowerCase()) ? 1 : 0;
        const bStartsWith = b.text.toLowerCase().startsWith(searchQuery.toLowerCase()) ? 1 : 0;
        
        if (aStartsWith !== bStartsWith) {
          return bStartsWith - aStartsWith;
        }
        
        return (b.popularity || 0) - (a.popularity || 0);
      });

      setSuggestions(uniqueSuggestions.slice(0, 10));
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      // Fallback to local suggestions only
      const localSuggestions = getLocalSuggestions(searchQuery);
      setSuggestions(localSuggestions);
    } finally {
      setLoading(false);
    }
  };

  const getLocalSuggestions = (searchQuery: string): SearchSuggestion[] => {
    // Get search history from localStorage
    const history = JSON.parse(localStorage.getItem('search_history') || '[]');
    const recentSearches = history
      .filter((item: string) => item.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 3)
      .map((item: string) => ({
        text: item,
        type: 'history' as const,
        description: 'Recent search',
        icon: <History className="h-4 w-4" />
      }));

    // Mock suggestions for demo
    const mockSuggestions: SearchSuggestion[] = [
      {
        id: '1',
        type: 'restaurant',
        text: 'One Aldwych',
        subtitle: 'Modern European • Covent Garden',
        popularity: 0.9,
        icon: <Utensils className="h-4 w-4" />
      },
      {
        id: '2',
        type: 'restaurant',
        text: 'The Clermont London',
        subtitle: 'British • Charing Cross',
        popularity: 0.8,
        icon: <Utensils className="h-4 w-4" />
      },
      {
        id: '3',
        type: 'cuisine',
        text: 'Italian Restaurants',
        subtitle: 'Cuisine type',
        popularity: 0.7,
        icon: <TrendingUp className="h-4 w-4" />
      },
      {
        id: '4',
        type: 'cuisine',
        text: 'Japanese Restaurants',
        subtitle: 'Cuisine type',
        popularity: 0.6,
        icon: <TrendingUp className="h-4 w-4" />
      },
      {
        id: '5',
        type: 'location',
        text: 'Covent Garden',
        subtitle: 'Area in London',
        popularity: 0.8,
        icon: <MapPin className="h-4 w-4" />
      },
      {
        id: '6',
        type: 'location',
        text: 'Soho',
        subtitle: 'Area in London',
        popularity: 0.7,
        icon: <MapPin className="h-4 w-4" />
      }
    ];

    // Filter mock suggestions based on query
    const filteredMockSuggestions = mockSuggestions.filter(suggestion =>
      suggestion.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      suggestion.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return [...recentSearches, ...filteredMockSuggestions];
  };

  const showSearchHistory = () => {
    const history = JSON.parse(localStorage.getItem('search_history') || '[]');
    const historySuggestions = history.slice(0, 8).map((query: string) => ({
      text: query,
      type: 'history' as const,
      description: 'Recent search',
      icon: <History className="h-4 w-4" />
    }));
    setSuggestions(historySuggestions);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    // Save to search history
    const history = JSON.parse(localStorage.getItem('search_history') || '[]');
    const newHistory = [suggestion.text, ...history.filter((item: string) => item !== suggestion.text)].slice(0, 20);
    localStorage.setItem('search_history', JSON.stringify(newHistory));

    onSelect(suggestion);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isVisible || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'restaurant':
        return <Utensils className="h-4 w-4 text-blue-600" />;
      case 'cuisine':
        return <Utensils className="h-4 w-4 text-green-600" />;
      case 'location':
        return <MapPin className="h-4 w-4 text-red-600" />;
      case 'history':
        return <History className="h-4 w-4 text-gray-500" />;
      case 'trending':
        return <TrendingUp className="h-4 w-4 text-orange-600" />;
      default:
        return <Search className="h-4 w-4 text-gray-500" />;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div 
      ref={containerRef} 
      className="absolute top-full left-0 right-0 z-50 mt-2"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <Card className="shadow-lg border-0">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <Clock className="h-4 w-4 animate-spin mx-auto mb-2" />
              <p className="text-sm">Searching...</p>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="max-h-80 overflow-y-auto">
              {/* Header */}
              <div className="px-4 py-2 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {query.length === 0 ? 'Recent Searches' : 'Suggestions'}
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Suggestions */}
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id || `${suggestion.type}-${index}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={cn(
                    "w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3 transition-colors",
                    selectedIndex === index && "bg-blue-50 border-l-4 border-blue-500"
                  )}
                >
                  <div className="text-gray-400">
                    {getSuggestionIcon(suggestion.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {suggestion.text}
                    </div>
                    {(suggestion.subtitle || suggestion.description) && (
                      <div className="text-sm text-gray-500 truncate">
                        {suggestion.subtitle || suggestion.description}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {suggestion.popularity && (
                      <div className="text-xs text-gray-400">
                        {Math.round(suggestion.popularity * 100)}%
                      </div>
                    )}
                    {suggestion.type === 'trending' && (
                      <TrendingUp className="h-3 w-3 text-orange-500" />
                    )}
                  </div>
                </button>
              ))}

              {/* Footer */}
              {query.length > 0 && (
                <div className="px-4 py-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">↑↓</kbd> to navigate, 
                    <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs ml-1">Enter</kbd> to select
                  </p>
                </div>
              )}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-4 text-center text-gray-500">
              <Search className="h-6 w-6 mx-auto mb-2" />
              <p className="text-sm">No suggestions found for "{query}"</p>
              <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
