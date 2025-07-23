import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiX, FiFilter, FiClock, FiArrowRight } from 'react-icons/fi';
import { useSearchContext, SearchResult } from '../../context/SearchContext';
import { useAppContext } from '../../context/AppContext';
import { Input, Button, Badge, IconWrapper } from './index';

interface SearchBarProps {
    placeholder?: string;
    className?: string;
    showFilters?: boolean;
    compact?: boolean;
    onResultClick?: (result: SearchResult) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
    placeholder = "Search projects, sessions, variables...",
    className = "",
    showFilters = true,
    compact = false,
    onResultClick
}) => {
    const {
        query,
        results,
        isSearching,
        hasSearched,
        totalResults,
        searchHistory,
        setQuery,
        search,
        clearSearch,
        navigateToResult,
        clearHistory,
        filters,
        setFilters,
        getFilteredResults
    } = useSearchContext();

    const { openUnifiedManager } = useAppContext();

    const [isOpen, setIsOpen] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [showFiltersPanel, setShowFiltersPanel] = useState(false);

    const filteredResults = getFilteredResults();

    // Handle search input changes
    const handleInputChange = (value: string) => {
        setQuery(value);
        if (value.trim()) {
            search(value);
            setIsOpen(true);
            setShowHistory(false);
        } else {
            setIsOpen(false);
            setShowHistory(false);
        }
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
            setShowHistory(false);
            inputRef.current?.blur();
            return;
        }

        // Use filtered results for display and navigation
        const filteredResults = getFilteredResults();

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const maxIndex = showHistory ? searchHistory.length - 1 : filteredResults.length - 1;
            setSelectedIndex(prev => Math.min(prev + 1, maxIndex));
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, -1));
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0) {
                if (showHistory) {
                    const historyItem = searchHistory[selectedIndex];
                    if (historyItem) {
                        setQuery(historyItem);
                        search(historyItem);
                        setIsOpen(true);
                        setShowHistory(false);
                    }
                } else {
                    const result = filteredResults[selectedIndex];
                    if (result) {
                        handleResultClick(result);
                    }
                }
            } else if (query.trim()) {
                search();
            }
        }

        if (e.key === '/') {
            e.preventDefault();
            inputRef.current?.focus();
        }
    };

    // Handle result click
    const handleResultClick = (result: SearchResult) => {
        if (onResultClick) {
            onResultClick(result);
        } else {
            // Special handling for variables - open unified manager
            if (result.type === 'variable') {
                openUnifiedManager('variables');
            } else {
                navigateToResult(result);
            }
        }
        setIsOpen(false);
        setSelectedIndex(-1);
    };

    // Handle history item click
    const handleHistoryClick = (historyItem: string) => {
        if (historyItem) {
            setQuery(historyItem);
            search(historyItem);
            setIsOpen(true);
            setShowHistory(false);
        }
    };

    // Handle input focus
    const handleInputFocus = () => {
        if (query.trim()) {
            setIsOpen(true);
            setShowHistory(false);
        } else if (searchHistory.length > 0) {
            setShowHistory(true);
        }
    };

    // Handle input blur
    const handleInputBlur = () => {
        // Delay closing to allow for clicks on results
        setTimeout(() => {
            setIsOpen(false);
            setShowHistory(false);
            setSelectedIndex(-1);
        }, 200);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowHistory(false);
                setSelectedIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset selected index when results change
    useEffect(() => {
        setSelectedIndex(-1);
    }, [results]);

    // Close filters panel when clicking outside
    useEffect(() => {
        if (!showFiltersPanel) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (
                searchRef.current &&
                !searchRef.current.contains(event.target as Node)
            ) {
                setShowFiltersPanel(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showFiltersPanel]);

    // Filter types
    const filterTypes = [
        { label: 'Project', value: 'project' },
        { label: 'Session', value: 'session' },
        { label: 'Test', value: 'test' },
        { label: 'Variable', value: 'variable' },
        { label: 'Configuration', value: 'configuration' },
    ];

    // Handle filter change
    const handleTypeFilterChange = (type: string) => {
        const currentTypes = filters.types;
        let newTypes;
        if (currentTypes.includes(type)) {
            newTypes = currentTypes.filter(t => t !== type);
        } else {
            newTypes = [...currentTypes, type];
        }
        setFilters({ types: newTypes });
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'project':
                return '📁';
            case 'session':
                return '🔗';
            case 'test':
                return '🧪';
            case 'variable':
                return '🔧';
            case 'configuration':
                return '⚙️';
            default:
                return '📄';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'project':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200';
            case 'session':
                return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200';
            case 'test':
                return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200';
            case 'variable':
                return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200';
            case 'configuration':
                return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    return (
        <div ref={searchRef} className={`relative ${className}`}>
            {/* Search Input */}
            <div className="relative">
                <Input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => handleInputChange(e.target.value || '')}
                    onKeyDown={handleKeyDown}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholder={placeholder}
                    icon={FiSearch}
                    iconPosition="left"
                    className={`${compact ? 'text-sm' : ''} ${isOpen ? 'ring-2 ring-blue-500' : ''}`}
                />

                {/* Clear button */}
                {query && (
                    <button
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        <IconWrapper icon={FiX} size="sm" />
                    </button>
                )}

                {/* Loading indicator */}
                {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                    </div>
                )}
            </div>

            {/* Search Results Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                    {/* Results */}
                    {hasSearched && !isSearching && (
                        <div className="p-4">

                            {/* Results header */}
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {totalResults} result{totalResults !== 1 ? 's' : ''}
                                </span>
                                {showFilters && (
                                    <div className="relative">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            icon={FiFilter}
                                            className="text-xs"
                                            onMouseDown={e => e.preventDefault()}
                                            onClick={() => setShowFiltersPanel(v => !v)}
                                        >
                                            Filters
                                        </Button>
                                        {showFiltersPanel && (
                                            <div onMouseDown={e => e.preventDefault()} className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4">
                                                <div className="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-200">Filter by type</div>
                                                <div className="space-y-1">
                                                    {filterTypes.map(ft => (
                                                        <label key={ft.value} className="flex items-center space-x-2 cursor-pointer text-sm text-gray-700 dark:text-gray-200">
                                                            <input
                                                                type="checkbox"
                                                                checked={filters.types.includes(ft.value)}
                                                                onChange={() => handleTypeFilterChange(ft.value)}
                                                                className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                            />
                                                            <span>{ft.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {filteredResults.length > 0 ? (
                                <>
                                    {/* Results list */}
                                    <div className="space-y-2">
                                        {filteredResults.map((result: SearchResult, index: number) => (
                                            <button
                                                key={result.id}
                                                onClick={() => handleResultClick(result)}
                                                className={`w-full p-3 text-left rounded-lg transition-colors ${index === selectedIndex
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                                    }`}
                                            >
                                                <div className="flex items-start space-x-3">
                                                    <div className="flex-shrink-0 mt-1">
                                                        <IconWrapper icon={getTypeIcon(result.type)} variant="colored" size="lg" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center space-x-2">
                                                            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                                {result.title}
                                                            </h4>
                                                            <Badge
                                                                variant="default"
                                                                size="sm"
                                                                className={`text-xs ${getTypeColor(result.type)}`}
                                                            >
                                                                {result.type}
                                                            </Badge>
                                                            {result.method && (
                                                                <Badge variant="default" size="sm" className="text-xs">
                                                                    {result.method}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {result.description && (
                                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                                                {result.description}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center space-x-2 mt-2">
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                {result.path.join(' › ')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex-shrink-0">
                                                        <IconWrapper
                                                            icon={FiArrowRight}
                                                            size="sm"
                                                            className="text-gray-400"
                                                        />
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="text-gray-400 dark:text-gray-500 mb-2">
                                        <IconWrapper icon={FiSearch} size="lg" />
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        No results found for "{query}"
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                        Try different keywords or check your spelling
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Search History */}
                    {showHistory && searchHistory.length > 0 && (
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Recent searches
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearHistory}
                                    className="text-xs text-red-600 hover:text-red-700"
                                >
                                    Clear
                                </Button>
                            </div>
                            <div className="space-y-1">
                                {searchHistory.map((historyItem, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleHistoryClick(historyItem)}
                                        className={`w-full p-2 text-left rounded-lg transition-colors flex items-center space-x-2 ${index === selectedIndex
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        <IconWrapper icon={FiClock} size="sm" className="text-gray-400" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                            {historyItem}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBar; 