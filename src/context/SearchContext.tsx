import React, { createContext, useContext, useState, useCallback } from 'react';
import { useProjectContext } from './ProjectContext';
import { useAppContext } from './AppContext';
import { useVariablesContext } from './VariablesContext';

export interface SearchResult {
    id: string;
    type: 'project' | 'session' | 'test' | 'variable' | 'configuration';
    title: string;
    description?: string | undefined;
    category?: string | undefined;
    method?: string | undefined;
    url?: string | undefined;
    tags?: string[] | undefined;
    lastModified?: string | undefined;
    relevance: number;
    path: string[];
}

export interface SearchFilters {
    types: string[];
    categories: string[];
    methods: string[];
    dateRange?: {
        start: Date;
        end: Date;
    };
}

interface SearchContextType {
    // Search state
    query: string;
    results: SearchResult[];
    filters: SearchFilters;
    isSearching: boolean;
    hasSearched: boolean;

    // Search actions
    setQuery: (query: string) => void;
    search: (query?: string) => void;
    clearSearch: () => void;
    setFilters: (filters: Partial<SearchFilters>) => void;
    clearFilters: () => void;

    // Results actions
    navigateToResult: (result: SearchResult) => void;
    getFilteredResults: () => SearchResult[];

    // Search metadata
    totalResults: number;
    searchHistory: string[];
    addToHistory: (query: string) => void;
    clearHistory: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearchContext = () => {
    const context = useContext(SearchContext);
    if (!context) {
        throw new Error('useSearchContext must be used within a SearchProvider');
    }
    return context;
};

interface SearchProviderProps {
    children: React.ReactNode;
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [filters, setFilters] = useState<SearchFilters>({
        types: [],
        categories: [],
        methods: []
    });
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);

    // Get data from other contexts
    const { projects } = useProjectContext();
    const { savedSessions } = useAppContext();
    const { globalVariables, sharedVariables } = useVariablesContext();

    // Search function
    const search = useCallback(async (searchQuery?: string) => {
        const searchTerm = searchQuery || query;
        if (!searchTerm.trim()) {
            setResults([]);
            setHasSearched(false);
            return;
        }

        setIsSearching(true);
        setHasSearched(true);

        try {
            const searchResults: SearchResult[] = [];
            const lowerQuery = searchTerm.toLowerCase();

            // Search projects
            projects.forEach(project => {
                const titleMatch = project.name.toLowerCase().includes(lowerQuery);
                const descMatch = project.description?.toLowerCase().includes(lowerQuery);

                if (titleMatch || descMatch) {
                    searchResults.push({
                        id: project.id,
                        type: 'project',
                        title: project.name,
                        description: project.description,
                        relevance: titleMatch ? 1.0 : 0.7,
                        path: ['Projects', project.name]
                    });
                }
            });

            // Search sessions
            savedSessions.forEach(session => {
                const titleMatch = session.name.toLowerCase().includes(lowerQuery);
                const urlMatch = session.urlData?.builtUrl?.toLowerCase().includes(lowerQuery);
                const methodMatch = session.requestConfig?.method?.toLowerCase().includes(lowerQuery);

                if (titleMatch || urlMatch || methodMatch) {
                    searchResults.push({
                        id: session.id,
                        type: 'session',
                        title: session.name,
                        description: undefined,
                        category: session.category,
                        method: session.requestConfig?.method,
                        url: session.urlData?.builtUrl,
                        relevance: titleMatch ? 1.0 : urlMatch ? 0.6 : 0.4,
                        path: ['Sessions', session.category || 'Uncategorized', session.name]
                    });
                }
            });

            // Search variables
            Object.entries(globalVariables).forEach(([key, value]) => {
                const keyMatch = key.toLowerCase().includes(lowerQuery);
                const valueMatch = value.toLowerCase().includes(lowerQuery);

                if (keyMatch || valueMatch) {
                    searchResults.push({
                        id: `global_${key}`,
                        type: 'variable',
                        title: key,
                        description: value,
                        relevance: keyMatch ? 1.0 : 0.6,
                        path: ['Variables', 'Global', key]
                    });
                }
            });

            sharedVariables.forEach(variable => {
                const keyMatch = variable.key.toLowerCase().includes(lowerQuery);
                const valueMatch = variable.value.toLowerCase().includes(lowerQuery);

                if (keyMatch || valueMatch) {
                    searchResults.push({
                        id: `shared_${variable.key}`,
                        type: 'variable',
                        title: variable.key,
                        description: variable.value,
                        relevance: keyMatch ? 1.0 : 0.6,
                        path: ['Variables', 'Session', variable.key]
                    });
                }
            });

            // Sort by relevance
            searchResults.sort((a, b) => b.relevance - a.relevance);

            setResults(searchResults);
            addToHistory(searchTerm);
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    }, [query, projects, savedSessions, globalVariables, sharedVariables]);

    // Clear search
    const clearSearch = useCallback(() => {
        setQuery('');
        setResults([]);
        setHasSearched(false);
        setFilters({
            types: [],
            categories: [],
            methods: []
        });
    }, []);

    // Update filters
    const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    }, []);

    // Clear filters
    const clearFilters = useCallback(() => {
        setFilters({
            types: [],
            categories: [],
            methods: []
        });
    }, []);

    // Get filtered results
    const getFilteredResults = useCallback(() => {
        return results.filter(result => {
            // Type filter
            if (filters.types.length > 0 && !filters.types.includes(result.type)) {
                return false;
            }

            // Category filter
            if (filters.categories.length > 0 && result.category && !filters.categories.includes(result.category)) {
                return false;
            }

            // Method filter
            if (filters.methods.length > 0 && result.method && !filters.methods.includes(result.method)) {
                return false;
            }

            // Date range filter
            if (filters.dateRange && result.lastModified) {
                const lastModified = new Date(result.lastModified);
                if (lastModified < filters.dateRange.start || lastModified > filters.dateRange.end) {
                    return false;
                }
            }

            return true;
        });
    }, [results, filters]);

    // Navigate to result
    const navigateToResult = useCallback((result: SearchResult) => {
        alert(`Navigate to: ${result.title} (${result.type})`);
    }, []);

    // Add to search history
    const addToHistory = useCallback((searchTerm: string) => {
        if (searchTerm.trim()) {
            setSearchHistory(prev => {
                const filtered = prev.filter(term => term !== searchTerm);
                return [searchTerm, ...filtered].slice(0, 10); // Keep last 10 searches
            });
        }
    }, []);

    // Clear search history
    const clearHistory = useCallback(() => {
        setSearchHistory([]);
    }, []);

    const value: SearchContextType = {
        query,
        results,
        filters,
        isSearching,
        hasSearched,
        setQuery,
        search,
        clearSearch,
        setFilters: updateFilters,
        clearFilters,
        navigateToResult,
        getFilteredResults,
        totalResults: getFilteredResults().length,
        searchHistory,
        addToHistory,
        clearHistory
    };

    return (
        <SearchContext.Provider value={value}>
            {children}
        </SearchContext.Provider>
    );
}; 