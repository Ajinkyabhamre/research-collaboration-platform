import { Search, X } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

export const ProjectsFilters = ({ filters, onFilterChange, hasActiveFilters, onClearFilters }) => {
  return (
    <div className="linkedin-card p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Search Input */}
        <div className="md:col-span-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search projects..."
              value={filters.search}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        {/* Department Select */}
        <div className="md:col-span-3">
          <Select
            value={filters.department}
            onChange={(e) => onFilterChange({ ...filters, department: e.target.value })}
          >
            <option value="">All Departments</option>
            <option value="COMPUTER_SCIENCE">Computer Science</option>
            <option value="ELECTRICAL_AND_COMPUTER_ENGINEERING">Electrical & Computer Eng.</option>
            <option value="MECHANICAL_ENGINEERING">Mechanical Engineering</option>
            <option value="CIVIL_ENVIRONMENTAL_AND_OCEAN_ENGINEERING">Civil, Environmental & Ocean Eng.</option>
            <option value="CHEMICAL_ENGINEERING_AND_MATERIALS_SCIENCE">Chemical Eng. & Materials Sci.</option>
            <option value="BIOMEDICAL_ENGINEERING">Biomedical Engineering</option>
            <option value="SYSTEMS_AND_ENTERPRISES">Systems & Enterprises</option>
            <option value="MATHEMATICAL_SCIENCES">Mathematical Sciences</option>
            <option value="PHYSICS">Physics</option>
            <option value="CHEMISTRY_AND_CHEMICAL_BIOLOGY">Chemistry & Chemical Biology</option>
          </Select>
        </div>

        {/* Year Select */}
        <div className="md:col-span-2">
          <Select
            value={filters.year}
            onChange={(e) => onFilterChange({ ...filters, year: e.target.value })}
          >
            <option value="">All Years</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
            <option value="2021">2021</option>
          </Select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="md:col-span-1 flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="w-full"
              title="Clear all filters"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
