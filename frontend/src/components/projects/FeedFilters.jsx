import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const DEPARTMENTS = [
  { value: 'COMPUTER_SCIENCE', label: 'Computer Science' },
  { value: 'ELECTRICAL_AND_COMPUTER_ENGINEERING', label: 'Electrical & Computer Eng.' },
  { value: 'MECHANICAL_ENGINEERING', label: 'Mechanical Engineering' },
  { value: 'CIVIL_ENVIRONMENTAL_AND_OCEAN_ENGINEERING', label: 'Civil, Environmental & Ocean Eng.' },
  { value: 'CHEMICAL_ENGINEERING_AND_MATERIALS_SCIENCE', label: 'Chemical Eng. & Materials Sci.' },
  { value: 'BIOMEDICAL_ENGINEERING', label: 'Biomedical Engineering' },
  { value: 'SYSTEMS_AND_ENTERPRISES', label: 'Systems & Enterprises' },
  { value: 'MATHEMATICAL_SCIENCES', label: 'Mathematical Sciences' },
  { value: 'PHYSICS', label: 'Physics' },
  { value: 'CHEMISTRY_AND_CHEMICAL_BIOLOGY', label: 'Chemistry & Chemical Biology' },
];

const YEARS = ['2025', '2024', '2023', '2022', '2021'];

export const FeedFilters = ({ filters, onFilterChange, hasActiveFilters, onClearFilters }) => {
  const [searchInput, setSearchInput] = useState(filters.searchTerm || '');
  const debouncedSearch = useDebounce(searchInput, 300);

  // Update filter when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.searchTerm) {
      onFilterChange({ ...filters, searchTerm: debouncedSearch });
    }
  }, [debouncedSearch]);

  const handleDepartmentChange = (e) => {
    const value = e.target.value;
    if (!value) {
      onFilterChange({ ...filters, departments: [] });
      return;
    }

    // For now, single select (can enhance to multi-select later)
    onFilterChange({ ...filters, departments: [value] });
  };

  const handleYearStartChange = (e) => {
    const year = e.target.value;
    if (!year) {
      onFilterChange({ ...filters, createdAfter: null });
    } else {
      onFilterChange({ ...filters, createdAfter: `${year}-01-01T00:00:00.000Z` });
    }
  };

  const handleYearEndChange = (e) => {
    const year = e.target.value;
    if (!year) {
      onFilterChange({ ...filters, createdBefore: null });
    } else {
      onFilterChange({ ...filters, createdBefore: `${year}-12-31T23:59:59.999Z` });
    }
  };

  const getYearFromFilter = (isoString) => {
    if (!isoString) return '';
    return isoString.substring(0, 4);
  };

  const currentDepartment = filters.departments && filters.departments.length > 0 ? filters.departments[0] : '';
  const yearStart = getYearFromFilter(filters.createdAfter);
  const yearEnd = getYearFromFilter(filters.createdBefore);

  return (
    <div className="linkedin-card p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Search Input */}
        <div className="md:col-span-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search projects..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Department Select */}
        <div className="md:col-span-3">
          <Select
            value={currentDepartment}
            onChange={handleDepartmentChange}
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map(dept => (
              <option key={dept.value} value={dept.value}>
                {dept.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Year Range - Start */}
        <div className="md:col-span-2">
          <Select
            value={yearStart}
            onChange={handleYearStartChange}
          >
            <option value="">Year From</option>
            {YEARS.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Select>
        </div>

        {/* Year Range - End */}
        <div className="md:col-span-2">
          <Select
            value={yearEnd}
            onChange={handleYearEndChange}
          >
            <option value="">Year To</option>
            {YEARS.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="md:col-span-12 md:col-start-1 flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchInput('');
                onClearFilters();
              }}
              className="text-sm"
            >
              <X className="w-4 h-4 mr-1" />
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
