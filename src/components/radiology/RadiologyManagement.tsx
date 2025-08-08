import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileText, 
  TestTube, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  BarChart3,
  Calendar,
  Users,
  Activity,
  TrendingUp,
  RefreshCw,
  Camera,
  Zap,
  Monitor,
  Scan,
  Eye,
  Download,
  Settings,
  Bell,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import RadiologyDashboard from './RadiologyDashboard';
import RadiologySubSpecialityForm from './RadiologySubSpecialityForm';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color, trend }) => (
  <Card className="relative overflow-hidden">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{value}</span>
            {trend && (
              <div className="flex items-center text-purple-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">{trend}</span>
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

interface QuickActionProps {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ title, icon, onClick }) => (
  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
    <CardContent className="p-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="p-3 bg-blue-50 rounded-lg">
          {icon}
        </div>
        <span className="font-medium">{title}</span>
      </div>
    </CardContent>
  </Card>
);

interface ActivityItemProps {
  title: string;
  time: string;
  type: 'urgent' | 'normal' | 'completed' | 'rejected' | 'maintenance';
}

const ActivityItem: React.FC<ActivityItemProps> = ({ title, time, type }) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'text-orange-600';
      case 'completed': return 'text-green-600';
      case 'rejected': return 'text-red-600';
      case 'maintenance': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'urgent': return <AlertTriangle className="h-3 w-3" />;
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      case 'rejected': return <AlertTriangle className="h-3 w-3" />;
      case 'maintenance': return <Activity className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
      <div className={`mt-1 ${getTypeColor(type)}`}>
        {getTypeIcon(type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
    </div>
  );
};

interface TopTestProps {
  name: string;
  count: number;
  tat: string;
}

const TopTest: React.FC<TopTestProps> = ({ name, count, tat }) => (
  <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-900">{name}</p>
      <p className="text-xs text-gray-500">Count: {count}</p>
    </div>
    <div className="text-right">
      <p className="text-sm font-medium text-gray-600">TAT: {tat}</p>
    </div>
  </div>
);

interface RadiologyTest {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  modality_id?: string;
  body_part?: string;
  study_type?: string;
  created_at: string;
}

const RadiologyManagement: React.FC = () => {
  const [activeView, setActiveView] = useState('overview');
  const [radiologyTests, setRadiologyTests] = useState<RadiologyTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTariff, setSelectedTariff] = useState('Private');
  const [formData, setFormData] = useState({
    name: '',
    subSpecialty: '',
    testingMethod: 'Radiology',
    service: '',
    note: '',
    useAsDefault: false
  });
  const [showSubSpecialityForm, setShowSubSpecialityForm] = useState(false);

  const handleNewOrder = () => {
    setActiveView('orders');
  };

  const handleCollectSample = () => {
    setActiveView('scheduling');
  };

  const handleEnterResults = () => {
    setActiveView('results');
  };

  const handleGenerateReport = () => {
    setActiveView('reports');
  };

  const handleImportData = () => {
    setActiveView('importData');
  };

  const handleSubSpecialityClick = () => {
    console.log('Button clicked! Opening form...');
    setShowSubSpecialityForm(true);
  };

  const handleSubSpecialitySubmit = async (specialityName: string) => {
    try {
      // Here you can add logic to save the sub specialty to database
      console.log('Sub Specialty Name:', specialityName);
      
      // For now, just show success message
      alert(`Sub Specialty "${specialityName}" added successfully!`);
      
      // You can add database save logic here
      // const { data, error } = await supabase
      //   .from('radiology_subspecialties')
      //   .insert([{ name: specialityName }]);
      
    } catch (error) {
      console.error('Error adding sub specialty:', error);
      alert('Error adding sub specialty. Please try again.');
    }
  };

  const handleBackClick = () => {
    setActiveView('overview');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmitImport = async () => {
    if (!selectedFile) {
      alert('Please select a file to import');
      return;
    }

    try {
      setLoading(true);
      // Here you would implement the actual file import logic
      console.log('Importing file:', selectedFile.name);
      console.log('Selected tariff:', selectedTariff);
      
      // Simulate import process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('File imported successfully!');
      setActiveView('addTest');
      setSelectedFile(null);
    } catch (error) {
      console.error('Error importing file:', error);
      alert('Error importing file');
    } finally {
      setLoading(false);
    }
  };

  // Delete radiology test
  const deleteRadiologyTest = async (testId: string, testName: string) => {
    if (!confirm(`Are you sure you want to delete "${testName}"?`)) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('radiology')
        .delete()
        .eq('id', testId);

      if (error) {
        console.error('Error deleting radiology test:', error);
        alert('Error deleting test: ' + error.message);
        return;
      }

      // Remove from local state
      setRadiologyTests(prev => prev.filter(test => test.id !== testId));
      alert('Test deleted successfully!');
    } catch (error) {
      console.error('Error in deleteRadiologyTest:', error);
      alert('Error deleting test');
    } finally {
      setLoading(false);
    }
  };

  // Load radiology tests from database
  const loadRadiologyTests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('radiology')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading radiology tests:', error);
        return;
      }

      // Transform data to match RadiologyTest interface
      const transformedData = data?.map(item => ({
        id: item.id,
        name: item.name,
        code: item.name.toUpperCase().replace(/\s+/g, '_').substring(0, 20),
        is_active: true,
        body_part: item.category,
        study_type: 'routine',
        created_at: item.created_at
      })) || [];

      setRadiologyTests(transformedData);
    } catch (error) {
      console.error('Error in loadRadiologyTests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add new radiology test
  const addRadiologyTest = async () => {
    try {
      if (!formData.name.trim()) {
        alert('Test name is required!');
        return;
      }

      setLoading(true);
      
      const { data, error } = await supabase
        .from('radiology')
        .insert([{
          name: formData.name,
          category: formData.subSpecialty || 'General',
          description: formData.note || `${formData.testingMethod} examination`,
          cost: '₹500' // Default cost
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding radiology test:', error);
        alert('Error adding test: ' + error.message);
        return;
      }

      // Transform and add to local state
      const transformedData = {
        id: data.id,
        name: data.name,
        code: data.name.toUpperCase().replace(/\s+/g, '_').substring(0, 20),
        is_active: true,
        body_part: data.category,
        study_type: 'routine',
        created_at: data.created_at
      };

      setRadiologyTests(prev => [transformedData, ...prev]);
      
      // Reset form
      setFormData({
        name: '',
        subSpecialty: '',
        testingMethod: 'Radiology',
        service: '',
        note: '',
        useAsDefault: false
      });

      // Go back to list view
      setActiveView('addTest');
      alert('Test added successfully!');
    } catch (error) {
      console.error('Error in addRadiologyTest:', error);
      alert('Error adding test');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadRadiologyTests();
  }, []);

  // Pagination logic
  const filteredTests = radiologyTests.filter(test => 
    searchTerm === '' || 
    test.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTests = filteredTests.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    
    return pages;
  };

  // Render different views based on activeView
  if (activeView === 'importData') {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-primary">Radiology - Import Data</h1>
            </div>
          </div>

          {/* Import Form */}
          <div className="bg-white rounded-lg shadow p-6 max-w-4xl">
            <div className="space-y-6">
              {/* Download Format Link */}
              <div className="text-right">
                <a 
                  href="#" 
                  className="text-blue-600 hover:text-blue-800 underline"
                  onClick={(e) => {
                    e.preventDefault();
                    // Here you would implement the format download
                    alert('Format download would be implemented here');
                  }}
                >
                  Click here for download the Format
                </a>
              </div>

              {/* Select Tariff */}
              <div className="flex items-center gap-4">
                <label className="w-32 text-sm font-medium text-gray-700">
                  Select Tariff
                </label>
                <select 
                  value={selectedTariff}
                  onChange={(e) => setSelectedTariff(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Private">Private</option>
                  <option value="Government">Government</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Corporate">Corporate</option>
                </select>
              </div>

              {/* Select File */}
              <div className="flex items-center gap-4">
                <label className="w-32 text-sm font-medium text-gray-700">
                  Select the File:
                </label>
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button 
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    onClick={handleSubmitImport}
                    disabled={loading || !selectedFile}
                  >
                    {loading ? 'Importing...' : 'Submit'}
                  </Button>
                </div>
              </div>

              {/* Selected File Info */}
              {selectedFile && (
                <div className="text-sm text-gray-600">
                  Selected file: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </div>
              )}

              {/* Back Button */}
              <div className="flex justify-start pt-4">
                <Button 
                  variant="outline"
                  onClick={() => setActiveView('addTest')}
                >
                  Back
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeView === 'addTestForm' || activeView === 'editTestForm') {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-primary">Add Test</h1>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-lg shadow p-6 max-w-4xl">
            <div className="space-y-6">
              {/* Test Name */}
              <div className="flex items-center gap-4">
                <label className="w-48 text-sm font-medium text-gray-700">
                  Test Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter test name"
                />
              </div>

              {/* Select Sub Specialty */}
              <div className="flex items-center gap-4">
                <label className="w-48 text-sm font-medium text-gray-700">
                  Select Sub Specialty :
                </label>
                <select 
                  value={formData.subSpecialty}
                  onChange={(e) => setFormData(prev => ({ ...prev, subSpecialty: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Sub Specialty</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="General">General</option>
                  <option value="Abdomen">Abdomen</option>
                  <option value="Chest">Chest</option>
                  <option value="Head">Head</option>
                  <option value="Spine">Spine</option>
                </select>
              </div>

              {/* Select Radiology or Similar Testing Method */}
              <div className="flex items-center gap-4">
                <label className="w-48 text-sm font-medium text-gray-700">
                  Select Radiology or Similar Testing Method :
                </label>
                <select 
                  value={formData.testingMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, testingMethod: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Radiology">Radiology</option>
                  <option value="CT Scan">CT Scan</option>
                  <option value="MRI">MRI</option>
                  <option value="X-Ray">X-Ray</option>
                  <option value="Ultrasound">Ultrasound</option>
                  <option value="Mammography">Mammography</option>
                  <option value="Nuclear Medicine">Nuclear Medicine</option>
                </select>
              </div>

              {/* Map Test To Service */}
              <div className="flex items-start gap-4">
                <label className="w-48 text-sm font-medium text-gray-700 mt-2">
                  Map Test To Service <span className="text-red-500">*</span>
                </label>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    placeholder="Search Service"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select 
                    value={formData.service}
                    onChange={(e) => setFormData(prev => ({ ...prev, service: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Service</option>
                    <option value="Emergency Service">Emergency Service</option>
                    <option value="OPD Service">OPD Service</option>
                    <option value="IPD Service">IPD Service</option>
                    <option value="ICU Service">ICU Service</option>
                    <option value="Radiology Service">Radiology Service</option>
                  </select>
                </div>
              </div>

              {/* Note */}
              <div className="flex items-start gap-4">
                <label className="w-48 text-sm font-medium text-gray-700 mt-2">
                  Note :
                </label>
                <textarea
                  rows={4}
                  value={formData.note}
                  onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter notes..."
                />
              </div>

              {/* Use as default */}
              <div className="flex items-center gap-4">
                <label className="w-48 text-sm font-medium text-gray-700">
                  Use as default:
                </label>
                <input
                  type="checkbox"
                  checked={formData.useAsDefault}
                  onChange={(e) => setFormData(prev => ({ ...prev, useAsDefault: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-4 pt-4">
                <Button 
                  variant="outline"
                  onClick={() => setActiveView('addTest')}
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  onClick={addRadiologyTest}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeView === 'addTest') {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-primary">Radiology Management</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                className="bg-blue-600 text-white hover:bg-blue-700"
                onClick={handleImportData}
              >
                Import Data
              </Button>
              <Button 
                variant="outline" 
                className="bg-blue-600 text-white hover:bg-blue-700"
                onClick={handleSubSpecialityClick}
              >
                Radiology Sub Speciality
              </Button>
                             <Button 
                 className="bg-blue-600 text-white hover:bg-blue-700"
                 onClick={() => setActiveView('addTestForm')}
               >
                 Add Test
               </Button>
              <Button 
                variant="outline"
                onClick={handleBackClick}
              >
                Back
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Type To Search"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page when searching
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button className="bg-blue-600 text-white hover:bg-blue-700">
              Search
            </Button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Id</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      Loading radiology tests...
                    </td>
                  </tr>
                ) : radiologyTests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      No radiology tests found. Add your first test!
                    </td>
                  </tr>
                ) : (
                  currentTests.map((test, index) => (
                    <tr key={test.id} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{startIndex + index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{test.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {test.is_active ? "Yes" : "No"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="text-blue-600">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-green-600"
                            onClick={() => setActiveView('editTestForm')}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => deleteRadiologyTest(test.id, test.name)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {/* Dynamic Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <Button 
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, filteredTests.length)}</span> of{' '}
                      <span className="font-medium">{filteredTests.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handlePrevious}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      {getPageNumbers().map((page) => (
                        <Button 
                          key={page} 
                          variant={page === currentPage ? "default" : "outline"} 
                          size="sm"
                          className="min-w-[40px]"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      ))}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleNext}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Radiology Sub Speciality Form - Add here too */}
        <RadiologySubSpecialityForm
          isOpen={showSubSpecialityForm}
          onClose={() => setShowSubSpecialityForm(false)}
          onSubmit={handleSubSpecialitySubmit}
        />
      </div>
    );
  }

  if (activeView === 'orders' || activeView === 'catalog' || activeView === 'scheduling' || activeView === 'results' || activeView === 'reports' || activeView === 'quality') {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-primary">Radiology Management - {activeView.charAt(0).toUpperCase() + activeView.slice(1)}</h1>
              <p className="text-muted-foreground">Enterprise-level radiology operations and imaging management</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setActiveView('overview')}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Back to Overview
              </Button>
              <Button className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
            <Button 
              variant={'ghost'} 
              size="sm" 
              className={''}
              onClick={() => setActiveView('overview')}
            >
              Overview
            </Button>
            <Button 
              variant={activeView === 'catalog' ? 'default' : 'ghost'} 
              size="sm"
              className={activeView === 'catalog' ? 'bg-white shadow-sm' : ''}
              onClick={() => setActiveView('catalog')}
            >
              Imaging Catalog
            </Button>
            <Button 
              variant={activeView === 'orders' ? 'default' : 'ghost'} 
              size="sm"
              className={activeView === 'orders' ? 'bg-white shadow-sm' : ''}
              onClick={() => setActiveView('orders')}
            >
              Orders
            </Button>
            <Button 
              variant={activeView === 'scheduling' ? 'default' : 'ghost'} 
              size="sm"
              className={activeView === 'scheduling' ? 'bg-white shadow-sm' : ''}
              onClick={() => setActiveView('scheduling')}
            >
              Scheduling
            </Button>
            <Button 
              variant={activeView === 'results' ? 'default' : 'ghost'} 
              size="sm"
              className={activeView === 'results' ? 'bg-white shadow-sm' : ''}
              onClick={() => setActiveView('results')}
            >
              Results
            </Button>
            <Button 
              variant={activeView === 'reports' ? 'default' : 'ghost'} 
              size="sm"
              className={activeView === 'reports' ? 'bg-white shadow-sm' : ''}
              onClick={() => setActiveView('reports')}
            >
              Reports
            </Button>
            <Button 
              variant={activeView === 'quality' ? 'default' : 'ghost'} 
              size="sm"
              className={activeView === 'quality' ? 'bg-white shadow-sm' : ''}
              onClick={() => setActiveView('quality')}
            >
              Quality Control
            </Button>
          </div>

          {activeView === 'orders' && <RadiologyDashboard />}
          {activeView === 'catalog' && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold mb-4">Imaging Catalog</h2>
              <p className="text-gray-600">Imaging catalog functionality coming soon...</p>
            </div>
          )}
          {activeView === 'scheduling' && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold mb-4">Scheduling</h2>
              <p className="text-gray-600">Scheduling functionality coming soon...</p>
            </div>
          )}
          {activeView === 'results' && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold mb-4">Results</h2>
              <p className="text-gray-600">Results functionality coming soon...</p>
            </div>
          )}
          {activeView === 'reports' && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold mb-4">Reports</h2>
              <p className="text-gray-600">Reports functionality coming soon...</p>
            </div>
          )}
          {activeView === 'quality' && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold mb-4">Quality Control</h2>
              <p className="text-gray-600">Quality control functionality coming soon...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-primary">Radiology Orders</h1>
              <p className="text-muted-foreground">Manage imaging orders and track their progress</p>
            </div>
          </div>
          <Button 
            className="flex items-center gap-2"
            onClick={() => setActiveView('addTestForm')}
          >
            <Plus className="h-4 w-4" />
            Add Test
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-6 mb-6 border-b">
          <Button 
            variant="ghost" 
            className="border-b-2 border-blue-600 text-blue-600 rounded-none pb-3"
          >
            <Activity className="h-4 w-4 mr-2" />
            Overview
          </Button>
          <Button variant="ghost" className="pb-3 rounded-none">
            <Monitor className="h-4 w-4 mr-2" />
            Modalities
          </Button>
          <Button 
            variant="ghost" 
            className="pb-3 rounded-none"
            onClick={() => setActiveView('orders')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Orders
            <Badge className="ml-2 bg-blue-100 text-blue-800">23</Badge>
          </Button>
          <Button 
            variant="ghost" 
            className="pb-3 rounded-none"
            onClick={() => setActiveView('scheduling')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Scheduling
          </Button>
          <Button variant="ghost" className="pb-3 rounded-none">
            <Camera className="h-4 w-4 mr-2" />
            PACS
          </Button>
          <Button 
            variant="ghost" 
            className="pb-3 rounded-none"
            onClick={() => setActiveView('reports')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Reporting
            <Badge className="ml-2 bg-red-100 text-red-800">5</Badge>
          </Button>
          <Button variant="ghost" className="pb-3 rounded-none">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button variant="ghost" className="pb-3 rounded-none">
            <CheckCircle className="h-4 w-4 mr-2" />
            QA & Safety
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Orders</p>
                  <p className="text-3xl font-bold text-blue-600">89</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Pending Orders</p>
                  <p className="text-3xl font-bold text-orange-600">23</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Scheduled</p>
                  <p className="text-3xl font-bold text-purple-600">34</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Completed Today</p>
                  <p className="text-3xl font-bold text-green-600">32</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 shadow-sm w-96">
            <Search className="h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by patient name, order number, or procedure..." 
              className="border-none outline-none text-sm flex-1"
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Order Status Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          <Button variant="default" size="sm" className="bg-white shadow-sm">
            All Orders
          </Button>
          <Button variant="ghost" size="sm">
            Ordered
          </Button>
          <Button variant="ghost" size="sm">
            Scheduled
          </Button>
          <Button variant="ghost" size="sm">
            In Progress
          </Button>
          <Button variant="ghost" size="sm">
            Completed
          </Button>
        </div>

        {/* Patient Order Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Rajesh Kumar</h3>
                  <p className="text-sm text-muted-foreground">45Y Male • ID: P001</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-orange-100 text-orange-800">URGENT</Badge>
                <Badge className="bg-yellow-100 text-yellow-800">ORDERED</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Order Number</p>
                <p className="font-semibold">RAD2025001</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Procedure</p>
                <p className="font-semibold">CT Brain without contrast</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Modality</p>
                <p className="font-semibold">CT</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Estimated Cost</p>
                <p className="font-semibold text-green-600">₹3,500</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Ordering Physician</p>
                <p className="font-semibold">Dr. Priya Sharma</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Department</p>
                <p className="font-semibold">Emergency</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Order Date</p>
                <p className="font-semibold">13/6/2025, 2:00:00 pm</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Requested Date</p>
                <p className="font-semibold">13/6/2025</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground mb-1">Clinical Indication</p>
              <p className="text-sm">Headache with sudden onset, rule out stroke</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Radiology Sub Speciality Form */}
      <RadiologySubSpecialityForm
        isOpen={showSubSpecialityForm}
        onClose={() => setShowSubSpecialityForm(false)}
        onSubmit={handleSubSpecialitySubmit}
      />
    </div>
  );
};

export default RadiologyManagement; 