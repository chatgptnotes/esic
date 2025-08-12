import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useSearchableRadiology } from '@/hooks/useSearchableRadiology';

interface SelectedRadiology {
  id: string;
  name: string;
  description?: string;
  category?: string;
}

interface SearchableRadiologySelectProps {
  selectedRadiology: SelectedRadiology[];
  onAddRadiology: (radiology: { id: string; name: string; description?: string; category?: string }) => void;
}

const SearchableRadiologySelect = ({ 
  selectedRadiology, 
  onAddRadiology 
}: SearchableRadiologySelectProps) => {
  const { radiology, isLoading, searchTerm, setSearchTerm } = useSearchableRadiology();
  const [showResults, setShowResults] = useState(false);

  const handleRadiologySelect = (radiologyItem: { id: string; name: string; description?: string | null; category?: string | null }) => {
    onAddRadiology({
      id: radiologyItem.id,
      name: radiologyItem.name,
      description: radiologyItem.description || undefined,
      category: radiologyItem.category || undefined
    });
    setSearchTerm('');
    setShowResults(false);
  };

  const filteredRadiology = radiology.filter(radiologyItem => 
    !selectedRadiology.some(selected => selected.id === radiologyItem.id)
  );

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      <Input
        placeholder="Search radiology studies by name, description, or category..."
        className="pl-10 border-gray-300"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setShowResults(e.target.value.length > 0);
        }}
        onFocus={() => setShowResults(searchTerm.length > 0)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
      />
      
      {showResults && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 text-center text-gray-500">Loading radiology studies...</div>
          ) : filteredRadiology.length > 0 ? (
            filteredRadiology.map((radiologyItem) => (
              <div
                key={radiologyItem.id}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                onClick={() => handleRadiologySelect(radiologyItem)}
              >
                <div className="font-medium text-gray-900">{radiologyItem.name}</div>
                {radiologyItem.description && (
                  <div className="text-sm text-gray-600">{radiologyItem.description}</div>
                )}
                {radiologyItem.category && (
                  <div className="text-xs text-gray-500">Category: {radiologyItem.category}</div>
                )}
              </div>
            ))
          ) : (
            <div className="p-3 text-center text-gray-500">No radiology studies found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableRadiologySelect;