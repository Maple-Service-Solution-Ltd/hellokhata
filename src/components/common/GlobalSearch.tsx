// Hello Khata OS - Global Search Component
// হ্যালো খাতা - গ্লোবাল সার্চ কম্পোনেন্ট

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useGlobalSearch } from '@/hooks/queries';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  Package,
  User,
  ShoppingCart,
  Receipt,
  Building2,
  Search,
  X,
  Clock,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { SearchResult, SearchEntityType } from '@/types';

// Search icon component for type
function SearchTypeIcon({ type }: { type: SearchEntityType }) {
  const icons = {
    item: Package,
    party: User,
    sale: ShoppingCart,
    expense: Receipt,
    account: Building2,
  };
  const Icon = icons[type] || Package;
  return <Icon className="w-4 h-4" />;
}

// Search result item
function SearchResultItem({ result, onClick }: { result: SearchResult; onClick: () => void }) {
  const { isBangla } = useAppTranslation();
  
  return (
    <Link
      href={result.url}
      onClick={onClick}
      className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-lg"
    >
      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <SearchTypeIcon type={result.type} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{result.title}</p>
        {result.subtitle && (
          <p className="text-xs text-gray-500">{result.subtitle}</p>
        )}
        {result.description && (
          <p className="text-xs text-gray-400 truncate">{result.description}</p>
        )}
      </div>
      <Badge variant="outline" className="text-xs capitalize">
        {result.type === 'item' ? (isBangla ? 'পণ্য' : 'Item') :
         result.type === 'party' ? (isBangla ? 'পার্টি' : 'Party') :
         result.type === 'sale' ? (isBangla ? 'বিক্রি' : 'Sale') :
         result.type === 'expense' ? (isBangla ? 'খরচ' : 'Expense') :
         result.type}
      </Badge>
    </Link>
  );
}

// Global Search Modal
interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchProps) {
  const { isBangla } = useAppTranslation();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        setDebouncedQuery(query);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);
  
  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);
  
  // Reset query when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Using setTimeout to avoid the setState in effect warning
      const timer = setTimeout(() => {
        setQuery('');
        setDebouncedQuery('');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  // Search query
  const { data: searchResults, isLoading } = useGlobalSearch(debouncedQuery);
  
  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle search - handled by parent
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  
  const handleResultClick = useCallback(() => {
    onClose();
  }, [onClose]);
  
  // Recent searches (mock)
  const recentSearches = ['চাল', 'করিম', 'INV-001'];
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl p-0 gap-0">
        {/* Search Input */}
        <div className="flex items-center border-b px-4">
          <Search className="w-5 h-5 text-gray-400" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isBangla ? 'পণ্য, পার্টি, বিক্রি খুঁজুন...' : 'Search items, parties, sales...'}
            className="border-0 focus-visible:ring-0 text-lg"
          />
          {query && (
            <Button variant="ghost" size="icon" onClick={() => setQuery('')}>
              <X className="w-4 h-4" />
            </Button>
          )}
          <kbd className="hidden sm:block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded">
            ESC
          </kbd>
        </div>
        
        {/* Results */}
        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : searchResults && searchResults.totalResults > 0 ? (
            <div className="p-2">
              {/* Grouped Results */}
              {Object.entries(searchResults.groupedResults).map(([type, results]) => (
                <div key={type} className="mb-4">
                  <p className="px-3 py-1 text-xs font-medium text-gray-500 uppercase">
                    {type === 'item' ? (isBangla ? 'পণ্য' : 'Items') :
                     type === 'party' ? (isBangla ? 'পার্টি' : 'Parties') :
                     type === 'sale' ? (isBangla ? 'বিক্রি' : 'Sales') :
                     type === 'expense' ? (isBangla ? 'খরচ' : 'Expenses') :
                     type}
                  </p>
                  {(results as SearchResult[]).map((result) => (
                    <SearchResultItem
                      key={result.id}
                      result={result}
                      onClick={handleResultClick}
                    />
                  ))}
                </div>
              ))}
            </div>
          ) : query.length >= 2 && !isLoading ? (
            <div className="text-center py-8">
              <Search className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">
                {isBangla ? `"${query}" এর জন্য কোনো ফলাফল নেই` : `No results for "${query}"`}
              </p>
            </div>
          ) : query.length < 2 ? (
            <div className="p-4">
              {/* Recent Searches */}
              <p className="text-xs font-medium text-gray-500 mb-2">
                {isBangla ? 'সাম্প্রতিক অনুসন্ধান' : 'Recent Searches'}
              </p>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term) => (
                  <Button
                    key={term}
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => setQuery(term)}
                  >
                    <Clock className="w-3 h-3" />
                    {term}
                  </Button>
                ))}
              </div>
              
              {/* Quick Links */}
              <p className="text-xs font-medium text-gray-500 mt-4 mb-2">
                {isBangla ? 'দ্রুত অ্যাক্সেস' : 'Quick Access'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/sales/new"
                  onClick={onClose}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <ShoppingCart className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm">{isBangla ? 'নতুন বিক্রি' : 'New Sale'}</span>
                </Link>
                <Link
                  href="/parties/new"
                  onClick={onClose}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <User className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">{isBangla ? 'নতুন পার্টি' : 'New Party'}</span>
                </Link>
                <Link
                  href="/inventory/new"
                  onClick={onClose}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Package className="w-4 h-4 text-purple-500" />
                  <span className="text-sm">{isBangla ? 'নতুন পণ্য' : 'New Item'}</span>
                </Link>
                <Link
                  href="/reports"
                  onClick={onClose}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">{isBangla ? 'রিপোর্ট' : 'Reports'}</span>
                </Link>
              </div>
            </div>
          ) : null}
        </ScrollArea>
        
        {/* Footer */}
        <div className="border-t px-4 py-2 flex items-center justify-between text-xs text-gray-500">
          <span>
            {searchResults?.totalResults 
              ? `${searchResults.totalResults} ${isBangla ? 'টি ফলাফল' : 'results'}`
              : ''}
          </span>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">↑↓</kbd>
            <span>{isBangla ? 'নেভিগেট' : 'navigate'}</span>
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">↵</kbd>
            <span>{isBangla ? 'নির্বাচন' : 'select'}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Search Trigger Button
export function SearchTrigger({ onClick }: { onClick: () => void }) {
  const { isBangla } = useAppTranslation();
  
  return (
    <Button
      variant="outline"
      className="relative w-full sm:w-64 justify-start text-muted-foreground"
      onClick={onClick}
    >
      <Search className="w-4 h-4 mr-2" />
      <span className="hidden sm:inline">{isBangla ? 'খুঁজুন...' : 'Search...'}</span>
      <span className="sm:hidden">{isBangla ? 'খুঁজুন' : 'Search'}</span>
      <kbd className="pointer-events-none absolute right-2 hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
        ⌘K
      </kbd>
    </Button>
  );
}

export default GlobalSearchModal;
