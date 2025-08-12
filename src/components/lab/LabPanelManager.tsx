// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Plus,
  Edit,
  Trash2,
  Package,
  FlaskConical,
  Save,
  X
} from 'lucide-react';
import { useTestPanels } from '@/hooks/useLabData';
import { useToast } from '@/hooks/use-toast';
import LabTestFormBuilder from './LabTestFormBuilder';

interface TestAttribute {
  // Basic Info
  name: string;
  type: 'Numeric' | 'Text' | 'Boolean';
  isMandatory: boolean;
  isCategory?: boolean; // "Is Category?" checkbox
  isDescriptive?: boolean; // "Is Descriptive" checkbox
  
  // Machine and Calculation
  machineName?: string; // Machine Name field
  multiplyBy?: string; // Multiply By field
  decimalPlaces?: string; // Decimal field
  
  // Range Type Selection
  isByAge: boolean;
  isBySex: boolean;
  isByRange: boolean;
  
  // Formula
  hasFormula: boolean;
  formulaText: string;
  
  // Normal Range Data (comprehensive structure)
  normalRange: {
    // By Sex data
    male: { ll: string; ul: string; default: string };
    female: { ll: string; ul: string; default: string };
    child: { ll: string; ul: string; default: string };
    
    // By Age data
    ageRanges?: Array<{
      type: string; // "Less Than For Male", "More Than For Male", etc.
      ageUnit: string; // "Day(s)", "Month(s)", "Year(s)"
      ll: string;
      ul: string;
      default: string;
    }>;
    
    // By Range data
    ranges?: Array<{
      name: string; // "Range 1", "Range 2", etc.
      ll: string;
      ul: string;
      default: string;
    }>;
  };
  
  // Units and Ordering
  units: string;
  sortOrder?: string; // Sort Order field

  // Additional Fields
  defaultResult?: string; // Default Result textarea
  noteTemplate?: string; // Note/Opinion Template textarea
}

interface LabPanel {
  id: string;
  testName: string;
  testCode: string;
  icD10Code: string;
  cghsCode: string;
  rsbyCode: string;
  loincCode: string;
  cptCode: string;
  machineName: string;
  titleMachineName: string;
  sampleType: string;
  subSpecialty: string;
  shortForm: string;
  preparationTime: string;
  specificInstruction: string;
  attachFile: boolean;
  serviceGroup: string;
  testToService: string;
  parameterType: 'Single' | 'Multiple' | '';
  descriptiveType: 'Non-Descriptive' | 'Descriptive' | '';
  testResultHelp: string;
  defaultResult: string;
  noteTemplate: string;
  specialty: string;
  testMethod: string; // Added test method field
  attributes: TestAttribute[];
  isActive: boolean;
}

// Enhanced CategoryFormContent component with proper lab test form structure
const CategoryFormContent: React.FC<{
  attribute: TestAttribute;
  onAttributeChange: (attribute: TestAttribute) => void;
  formId?: string;
  onSave?: () => void;
  onCancel?: () => void;
}> = React.memo(({ attribute, onAttributeChange, formId = 'default', onSave, onCancel }) => {
  return (
    <div className="border rounded-lg p-4 bg-white space-y-4">
      {/* Header with Category Section and Action Buttons */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-blue-600">Category Section #{formId}</h3>
        </div>
        <div className="flex gap-2">
          {onSave && (
            <Button onClick={onSave} size="sm" className="bg-gray-600 hover:bg-gray-700">
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          )}
          {onCancel && (
            <Button onClick={onCancel} variant="outline" size="sm">
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Is Category Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id={`isCategory-${formId}`}
          checked={attribute.isCategory || false}
          onCheckedChange={(checked) => onAttributeChange({...attribute, isCategory: !!checked})}
        />
        <Label htmlFor={`isCategory-${formId}`} className="font-medium">Is Category?</Label>
        <span className="text-sm text-gray-500">Yes/No</span>
      </div>

      {/* Main Form Fields Row */}
      <div className="grid grid-cols-6 gap-3">
        <div>
          <Label className="text-sm font-medium">Attribute Name</Label>
          <Input
            value={attribute.name}
            onChange={(e) => onAttributeChange({...attribute, name: e.target.value})}
            placeholder="(AFP) alpha-fetoprotein"
            className="text-sm"
          />
        </div>
        <div>
          <Label className="text-sm font-medium">Machine Name</Label>
          <Input
            value={attribute.machineName || ''}
            onChange={(e) => onAttributeChange({...attribute, machineName: e.target.value})}
            placeholder="Machine Name"
            className="text-sm"
          />
        </div>
        <div>
          <Label className="text-sm font-medium">Multiply By</Label>
          <Input
            value={attribute.multiplyBy || ''}
            onChange={(e) => onAttributeChange({...attribute, multiplyBy: e.target.value})}
            placeholder="Multiply By"
            className="text-sm"
          />
        </div>
        <div>
          <Label className="text-sm font-medium">Decimal</Label>
          <Input
            value={attribute.decimalPlaces || ''}
            onChange={(e) => onAttributeChange({...attribute, decimalPlaces: e.target.value})}
            placeholder="Decimal"
            className="text-sm"
          />
        </div>
        <div className="flex flex-col">
          <Label className="text-sm font-medium mb-2">Is Descriptive</Label>
          <Checkbox
            checked={attribute.isDescriptive || false}
            onCheckedChange={(checked) => onAttributeChange({...attribute, isDescriptive: !!checked})}
          />
        </div>
      </div>

      {/* Type, Mandatory, Formula Row */}
      <div className="grid grid-cols-4 gap-4 items-end">
        <div>
          <Label className="text-sm font-medium">Type</Label>
          <Select
            value={attribute.type}
            onValueChange={(value: 'Numeric' | 'Text' | 'Boolean') => onAttributeChange({...attribute, type: value})}
          >
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Numeric">Numeric</SelectItem>
              <SelectItem value="Text">Text</SelectItem>
              <SelectItem value="Boolean">Boolean</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={attribute.isMandatory}
            onCheckedChange={(checked) => onAttributeChange({...attribute, isMandatory: !!checked})}
          />
          <Label className="text-sm font-medium">Is Mandatory</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`formula-${formId}`}
            checked={attribute.hasFormula}
            onCheckedChange={(checked) => onAttributeChange({...attribute, hasFormula: !!checked})}
          />
          <Label htmlFor={`formula-${formId}`} className="text-sm font-medium">Formula</Label>
        </div>
      </div>

      {/* Range Type Selection */}
      <div className="flex gap-6">
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id={`bySex-${formId}`}
            name={`normalRangeType-${formId}`}
            checked={attribute.isBySex}
            onChange={() => onAttributeChange({
              ...attribute,
              isBySex: true,
              isByAge: false,
              isByRange: false
            })}
          />
          <Label htmlFor={`bySex-${formId}`} className="text-sm font-medium">By Sex</Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id={`byAge-${formId}`}
            name={`normalRangeType-${formId}`}
            checked={attribute.isByAge}
            onChange={() => onAttributeChange({
              ...attribute,
              isBySex: false,
              isByAge: true,
              isByRange: false
            })}
          />
          <Label htmlFor={`byAge-${formId}`} className="text-sm font-medium">By Age</Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id={`byRange-${formId}`}
            name={`normalRangeType-${formId}`}
            checked={attribute.isByRange}
            onChange={() => onAttributeChange({
              ...attribute,
              isBySex: false,
              isByAge: false,
              isByRange: true
            })}
          />
          <Label htmlFor={`byRange-${formId}`} className="text-sm font-medium">By Range</Label>
        </div>
      </div>

      {/* Enhanced By Sex Normal Range Table */}
      {attribute.isBySex && (
        <div className="mt-4">
          <div className="bg-blue-50 border rounded-lg p-3">
            <Table>
              <TableHeader className="bg-blue-100">
                <TableRow>
                  <TableHead className="w-12 text-center">
                    <Checkbox />
                  </TableHead>
                  <TableHead className="font-semibold"></TableHead>
                  <TableHead className="text-center font-semibold">LL</TableHead>
                  <TableHead className="text-center font-semibold">UL</TableHead>
                  <TableHead className="text-center font-semibold">Default</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-white">
                  <TableCell className="text-center">
                    <Checkbox defaultChecked />
                  </TableCell>
                  <TableCell className="font-medium text-blue-600">Male</TableCell>
                  <TableCell>
                    <Input
                      className="w-20 text-center text-sm"
                      value={attribute.normalRange.male.ll}
                      onChange={(e) => onAttributeChange({
                        ...attribute,
                        normalRange: {
                          ...attribute.normalRange,
                          male: { ...attribute.normalRange.male, ll: e.target.value }
                        }
                      })}
                      placeholder="13.0"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-20 text-center text-sm"
                      value={attribute.normalRange.male.ul}
                      onChange={(e) => onAttributeChange({
                        ...attribute,
                        normalRange: {
                          ...attribute.normalRange,
                          male: { ...attribute.normalRange.male, ul: e.target.value }
                        }
                      })}
                      placeholder="17.2"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-32 text-center text-sm"
                      value={attribute.normalRange.male.default}
                      onChange={(e) => onAttributeChange({
                        ...attribute,
                        normalRange: {
                          ...attribute.normalRange,
                          male: { ...attribute.normalRange.male, default: e.target.value }
                        }
                      })}
                      placeholder="Normal"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                      ⊗
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow className="bg-white">
                  <TableCell className="text-center">
                    <Checkbox defaultChecked />
                  </TableCell>
                  <TableCell className="font-medium text-pink-600">Female</TableCell>
                  <TableCell>
                    <Input
                      className="w-20 text-center text-sm"
                      value={attribute.normalRange.female.ll}
                      onChange={(e) => onAttributeChange({
                        ...attribute,
                        normalRange: {
                          ...attribute.normalRange,
                          female: { ...attribute.normalRange.female, ll: e.target.value }
                        }
                      })}
                      placeholder="12.1"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-20 text-center text-sm"
                      value={attribute.normalRange.female.ul}
                      onChange={(e) => onAttributeChange({
                        ...attribute,
                        normalRange: {
                          ...attribute.normalRange,
                          female: { ...attribute.normalRange.female, ul: e.target.value }
                        }
                      })}
                      placeholder="15.1"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-32 text-center text-sm"
                      value={attribute.normalRange.female.default}
                      onChange={(e) => onAttributeChange({
                        ...attribute,
                        normalRange: {
                          ...attribute.normalRange,
                          female: { ...attribute.normalRange.female, default: e.target.value }
                        }
                      })}
                      placeholder="Normal"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                      ⊗
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow className="bg-white">
                  <TableCell className="text-center">
                    <Checkbox />
                  </TableCell>
                  <TableCell className="font-medium text-green-600">Child</TableCell>
                  <TableCell>
                    <Input
                      className="w-20 text-center text-sm"
                      value={attribute.normalRange.child.ll}
                      onChange={(e) => onAttributeChange({
                        ...attribute,
                        normalRange: {
                          ...attribute.normalRange,
                          child: { ...attribute.normalRange.child, ll: e.target.value }
                        }
                      })}
                      placeholder="11.0"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-20 text-center text-sm"
                      value={attribute.normalRange.child.ul}
                      onChange={(e) => onAttributeChange({
                        ...attribute,
                        normalRange: {
                          ...attribute.normalRange,
                          child: { ...attribute.normalRange.child, ul: e.target.value }
                        }
                      })}
                      placeholder="14.0"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-32 text-center text-sm"
                      value={attribute.normalRange.child.default}
                      onChange={(e) => onAttributeChange({
                        ...attribute,
                        normalRange: {
                          ...attribute.normalRange,
                          child: { ...attribute.normalRange.child, default: e.target.value }
                        }
                      })}
                      placeholder="Normal"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                      ⊗
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* By Age Section */}
      {attribute.isByAge && (
        <div className="mt-4 p-4 bg-gray-50 border rounded-lg">
          <p className="text-center text-gray-600">✅ By Age UI section - Ready for implementation</p>
        </div>
      )}

      {/* By Range Section */}
      {attribute.isByRange && (
        <div className="mt-4 p-4 bg-gray-50 border rounded-lg">
          <p className="text-center text-gray-600">✅ By Range UI section - Ready for implementation</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <Label className="text-sm font-medium">Units</Label>
          <Input
            value={attribute.units}
            onChange={(e) => onAttributeChange({...attribute, units: e.target.value})}
            placeholder="ng/ml"
            className="text-sm"
          />
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label className="text-sm font-medium">Sort Order</Label>
            <Input
              type="number"
              value={attribute.sortOrder || ''}
              onChange={(e) => onAttributeChange({...attribute, sortOrder: parseInt(e.target.value) || 0})}
              placeholder="Sort Order"
              className="text-sm"
            />
          </div>
          <Button
            type="button"
            size="sm"
            className="bg-green-600 hover:bg-green-700 px-3"
            onClick={() => {
              // Add new test parameter logic here
              console.log('Add new parameter');
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Default Result Section */}
      <div className="mt-6">
        <Label className="text-sm font-medium">Default Result</Label>
        <textarea
          className="w-full mt-2 p-3 border rounded-md resize-none"
          rows={3}
          value={attribute.defaultResult || ''}
          onChange={(e) => onAttributeChange({...attribute, defaultResult: e.target.value})}
          placeholder="Enter default result text here..."
        />
      </div>

      {/* Note/Opinion Template Section */}
      <div className="mt-4">
        <Label className="text-sm font-medium">Note/Opinion Template</Label>
        <textarea
          className="w-full mt-2 p-3 border rounded-md resize-none"
          rows={4}
          value={attribute.noteTemplate || ''}
          onChange={(e) => onAttributeChange({...attribute, noteTemplate: e.target.value})}
          placeholder="Enter note/opinion template here..."
        />
      </div>

      {/* Bottom Save Button */}
      <div className="flex justify-end mt-6 pt-4 border-t">
        <Button
          className="bg-gray-700 hover:bg-gray-800 px-6"
          onClick={onSave}
        >
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
      </div>
    </div>
  );
});

const LabPanelManager: React.FC = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPanel, setEditingPanel] = useState<LabPanel | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const { toast } = useToast();

  // Use real database data with fallback to local storage
  const { panels: dbPanels, loading, error, refetch, createPanel, updatePanel, deletePanel } = useTestPanels();
  
  // Local storage fallback for panels
  const [localPanels, setLocalPanels] = useState<LabPanel[]>(() => {
    const saved = localStorage.getItem('labPanels');
    return saved ? JSON.parse(saved) : [];
  });

  // Transform database panels to our local format, fallback to local storage if DB fails
  const panels: LabPanel[] = error || !dbPanels.length ? localPanels : dbPanels.map(panel => ({
    id: panel.id,
    testName: panel.name || '',  // 'lab' table has 'name' field
    testCode: `LAB_${panel.id.slice(0, 8)}`, // Generate code from ID
    icD10Code: panel.icd_10_code || '', // Map from database field
    cghsCode: panel.CGHS_code || '', // Map from database field
    rsbyCode: panel.rsby_code || '', // Map from database field
    loincCode: panel.loinc_code || '', // Map from database field
    cptCode: panel.cpt_code || '', // Map from database field
    machineName: panel.machine_name || 'Please Select', // Map from database field
    titleMachineName: panel.title_machine_name || '', // Map from database field
    sampleType: panel.sample_type || 'Please Select', // Map from database field
    subSpecialty: panel.sub_specialty || panel.category || 'General', // Map from database field
    shortForm: panel.short_form || '', // Map from database field
    preparationTime: panel.preparation_time || '', // Map from database field
    specificInstruction: panel.specific_instruction_for_preparation || panel.description || '', // Map from database field
    attachFile: panel.attach_file || false, // Map from database field
    serviceGroup: panel.service_group || 'Laboratory Services', // Map from database field
    testToService: panel.map_test_to_service || 'Select Service', // Map from database field
    parameterType: (panel.parameter_panel_test as 'Single' | 'Multiple') || 'Multiple', // Map from database field with proper type casting
    descriptiveType: 'Non-Descriptive',
    testResultHelp: panel.test_result_help || '', // Map from database field
    defaultResult: panel.default_result || '', // Map from database field
    noteTemplate: panel.note_opinion_template || '', // Map from database field
    specialty: panel.speciality || 'Regular', // Map from database field
    testMethod: panel.test_method || '', // Added test method from database
    attributes: panel.attributes ? JSON.parse(JSON.stringify(panel.attributes)) : [], // Load attributes from database
    isActive: true  // 'lab' table doesn't have is_active, so defaulting to true
  }));

  const filteredPanels = panels.filter(panel =>
    panel.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    panel.testCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredPanels.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedPanels = filteredPanels.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(Number(newPageSize));
    setCurrentPage(1);
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const goToNextPage = () => setCurrentPage(Math.min(totalPages, currentPage + 1));

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const handleAddPanel = async (newPanel: Omit<LabPanel, 'id'>) => {
    try {
      // Ensure we have a panel code, generate one if empty
      const panelCode = newPanel.testCode.trim() || `PNL_${Date.now()}`;
      
      // Try database first, fallback to local storage
      try {
        await createPanel({
          panel_name: newPanel.testName,
          panel_code: panelCode,
          description: newPanel.specificInstruction,
          category: newPanel.subSpecialty,
          test_method: newPanel.testMethod,
          // Add all form fields to database save
          icd_10_code: newPanel.icD10Code,
          CGHS_code: newPanel.cghsCode,
          rsby_code: newPanel.rsbyCode,
          loinc_code: newPanel.loincCode,
          cpt_code: newPanel.cptCode,
          machine_name: newPanel.machineName !== 'Please Select' ? newPanel.machineName : null,
          title_machine_name: newPanel.titleMachineName,
          sample_type: newPanel.sampleType !== 'Please Select' ? newPanel.sampleType : null,
          sub_specialty: newPanel.subSpecialty !== 'Select Sub Specialty' ? newPanel.subSpecialty : null,
          short_form: newPanel.shortForm,
          preparation_time: newPanel.preparationTime,
          specific_instruction_for_preparation: newPanel.specificInstruction,
          attach_file: newPanel.attachFile,
          service_group: newPanel.serviceGroup,
          map_test_to_service: newPanel.testToService !== 'Select Service' ? newPanel.testToService : null,
          parameter_panel_test: newPanel.parameterType,
          test_result_help: newPanel.testResultHelp !== 'Select Test Result' ? newPanel.testResultHelp : null,
          default_result: newPanel.defaultResult,
          note_opinion_template: newPanel.noteTemplate,
          speciality: newPanel.specialty,
          attributes: newPanel.attributes // Save attributes to database
        });
      
        toast({
          title: "Success",
          description: "Panel created successfully in database!",
        });
      } catch (dbError) {
        console.warn('Database error, using local storage:', dbError);
        
        // Fallback to local storage
        const newLocalPanel: LabPanel = {
          ...newPanel,
          id: Date.now().toString(),
          testCode: panelCode,
          testMethod: newPanel.testMethod || '', // Added test method to local storage
          isActive: true
        };
        
        const updatedPanels = [...localPanels, newLocalPanel];
        setLocalPanels(updatedPanels);
        localStorage.setItem('labPanels', JSON.stringify(updatedPanels));
        
        toast({
          title: "Success",
          description: "Panel created successfully (saved locally)!",
        });
      }
      
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Panel creation error:', error);
      toast({
        title: "Error",
        description: `Failed to create panel: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        variant: "destructive",
      });
    }
  };

  const handleEditPanel = async (updatedPanel: LabPanel) => {
    try {
      await updatePanel(updatedPanel.id, {
        name: updatedPanel.testName,
        category: updatedPanel.subSpecialty,
        description: updatedPanel.specificInstruction,
        test_method: updatedPanel.testMethod,
        // Add all form fields to update
        icd_10_code: updatedPanel.icD10Code,
        CGHS_code: updatedPanel.cghsCode,
        rsby_code: updatedPanel.rsbyCode,
        loinc_code: updatedPanel.loincCode,
        cpt_code: updatedPanel.cptCode,
        machine_name: updatedPanel.machineName !== 'Please Select' ? updatedPanel.machineName : null,
        title_machine_name: updatedPanel.titleMachineName,
        sample_type: updatedPanel.sampleType !== 'Please Select' ? updatedPanel.sampleType : null,
        sub_specialty: updatedPanel.subSpecialty !== 'Select Sub Specialty' ? updatedPanel.subSpecialty : null,
        short_form: updatedPanel.shortForm,
        preparation_time: updatedPanel.preparationTime,
        specific_instruction_for_preparation: updatedPanel.specificInstruction,
        attach_file: updatedPanel.attachFile,
        service_group: updatedPanel.serviceGroup,
        map_test_to_service: updatedPanel.testToService !== 'Select Service' ? updatedPanel.testToService : null,
        parameter_panel_test: updatedPanel.parameterType,
        test_result_help: updatedPanel.testResultHelp !== 'Select Test Result' ? updatedPanel.testResultHelp : null,
        default_result: updatedPanel.defaultResult,
        note_opinion_template: updatedPanel.noteTemplate,
        speciality: updatedPanel.specialty,
        attributes: updatedPanel.attributes // Save attributes to database
      });
  
      toast({
        title: "Success",
        description: "Panel updated successfully!",
      });
  
      setEditingPanel(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update panel. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePanel = async (id: string) => {
    try {
      // Try database deletion first
      try {
        await deletePanel(id);
        
        toast({
          title: "Success",
          description: "Panel deleted successfully from database!",
        });
      } catch (dbError) {
        console.warn('Database deletion failed, trying local storage:', dbError);
        
        // Fallback to local storage deletion
      const updatedPanels = localPanels.filter(panel => panel.id !== id);
      setLocalPanels(updatedPanels);
      localStorage.setItem('labPanels', JSON.stringify(updatedPanels));
      
      toast({
        title: "Success",
          description: "Panel deleted successfully (from local storage)!",
      });
      }
    } catch (error) {
      console.error('Delete panel error:', error);
      toast({
        title: "Error",
        description: `Failed to delete panel: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        variant: "destructive",
      });
    }
  };

  // Show form builder if toggled
  if (showFormBuilder) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FlaskConical className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-2xl font-bold">Lab Test Form Builder</h2>
              <p className="text-muted-foreground">Create detailed lab test forms with categories, parameters, and normal ranges</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFormBuilder(false)}
            className="flex items-center gap-2"
          >
            <Package className="h-4 w-4" />
            Back to Panel Manager
          </Button>
        </div>
        <LabTestFormBuilder />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Add Panel</h2>
            <p className="text-muted-foreground">Create and manage laboratory test panels with detailed configurations</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFormBuilder(true)}
            className="flex items-center gap-2"
          >
            <FlaskConical className="h-4 w-4" />
            Lab Test Form Builder
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Panel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Panel</DialogTitle>
              </DialogHeader>
              <AddPanelForm onSubmit={handleAddPanel} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <Input
              placeholder="Search panels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">entries</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center justify-center p-8">
              <div className="text-sm text-muted-foreground">Loading panels...</div>
            </div>
          )}
          
          {error && (
            <div className="flex items-center justify-center p-8">
              <div className="text-sm text-red-600">Error: {error}</div>
            </div>
          )}
          
          {!loading && !error && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Test Code</TableHead>
                    <TableHead>Sub Specialty</TableHead>
                    <TableHead>Service Group</TableHead>
                    <TableHead>Parameter Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {paginatedPanels.map((panel) => (
                  <TableRow key={panel.id}>
                    <TableCell className="font-medium">{panel.testName}</TableCell>
                    <TableCell>{panel.testCode}</TableCell>
                    <TableCell>{panel.subSpecialty}</TableCell>
                    <TableCell>{panel.serviceGroup}</TableCell>
                    <TableCell>
                      <Badge variant={panel.parameterType === 'Multiple' ? 'default' : 'secondary'}>
                        {panel.parameterType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={panel.isActive ? 'default' : 'destructive'}>
                        {panel.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPanel(panel)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeletePanel(panel.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          )}

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredPanels.length)} of {filteredPanels.length} entries
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={goToPreviousPage}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {getPageNumbers().map((pageNumber) => (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => handlePageChange(pageNumber)}
                        isActive={currentPage === pageNumber}
                        className="cursor-pointer"
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={goToNextPage}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingPanel} onOpenChange={() => setEditingPanel(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Panel</DialogTitle>
          </DialogHeader>
          {editingPanel && (
            <EditPanelForm 
              panel={editingPanel}
              onSubmit={handleEditPanel}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface AddPanelFormProps {
  onSubmit: (panel: Omit<LabPanel, 'id'>) => void;
}

const AddPanelForm: React.FC<AddPanelFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<Omit<LabPanel, 'id'>>({
    testName: '',
    testCode: '',
    icD10Code: '',
    cghsCode: '',
    rsbyCode: '',
    loincCode: '',
    cptCode: '',
    machineName: 'Please Select',
    titleMachineName: '',
    sampleType: 'Please Select',
    subSpecialty: 'Select Sub Specialty',
    shortForm: '',
    preparationTime: '',
    specificInstruction: '',
    attachFile: false,
    serviceGroup: 'Laboratory Services',
    testToService: 'Select Service',
    parameterType: '',
    descriptiveType: '',
    testResultHelp: 'Select Test Result',
    defaultResult: '',
    noteTemplate: '',
    specialty: 'Regular',
    testMethod: '', // Added test method field
    attributes: [],
    isActive: true
  });

  const [currentAttribute, setCurrentAttribute] = useState<TestAttribute>({
    name: '',
    type: 'Numeric',
    isMandatory: false,
    isByAge: false,
    isBySex: false,
    isByRange: false,
    hasFormula: false,
    formulaText: '',
    normalRange: {
      male: { ll: '', ul: '', default: '' },
      female: { ll: '', ul: '', default: '' },
      child: { ll: '', ul: '', default: '' }
    },
    units: ''
  });

  const [showAttributeForm, setShowAttributeForm] = useState(false);

  // State for managing multiple attribute forms
  const [attributeForms, setAttributeForms] = useState<Array<{id: string, attribute: TestAttribute, isEditing: boolean}>>([]);
  const [nextFormId, setNextFormId] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleAddAttribute = () => {
    if (currentAttribute.name) {
      setFormData({
        ...formData,
        attributes: [...formData.attributes, currentAttribute]
      });
      setCurrentAttribute({
        name: '',
        type: 'Numeric',
        isMandatory: false,
        isByAge: false,
        isBySex: false,
        isByRange: false,
        hasFormula: false,
        formulaText: '',
        normalRange: {
          male: { ll: '', ul: '', default: '' },
          female: { ll: '', ul: '', default: '' },
          child: { ll: '', ul: '', default: '' }
        },
        units: ''
      });
      setShowAttributeForm(false);
    }
  };

  const removeAttribute = (index: number) => {
    setFormData({
      ...formData,
      attributes: formData.attributes.filter((_, i) => i !== index)
    });
  };

  // Functions for managing multiple category forms in AddPanelForm
  const addNewCategoryForm = () => {
    const newFormId = `form_${nextFormId}`;
    const newAttributeForm = {
      id: newFormId,
      attribute: {
        name: '',
        type: 'Numeric' as const,
        isMandatory: false,
        isByAge: false,
        isBySex: true,
        isByRange: false,
        hasFormula: false,
        formulaText: '',
        normalRange: {
          male: { ll: '', ul: '', default: '' },
          female: { ll: '', ul: '', default: '' },
          child: { ll: '', ul: '', default: '' },
          ageRanges: [],
          ranges: []
        },
        units: ''
      },
      isEditing: true
    };
    
    setAttributeForms([...attributeForms, newAttributeForm]);
    setNextFormId(nextFormId + 1);
  };

  const updateAttributeForm = (formId: string, updatedAttribute: TestAttribute) => {
    setAttributeForms(attributeForms.map(form => 
      form.id === formId ? { ...form, attribute: updatedAttribute } : form
    ));
  };

  const saveAttributeForm = (formId: string) => {
    const form = attributeForms.find(f => f.id === formId);
    if (form && form.attribute.name.trim()) {
      setFormData({
        ...formData,
        attributes: [...formData.attributes, { ...form.attribute }]
      });
      
      setAttributeForms(attributeForms.filter(f => f.id !== formId));
    }
  };

  const cancelAttributeForm = (formId: string) => {
    setAttributeForms(attributeForms.filter(f => f.id !== formId));
  };

  const editAttributeForm = (formId: string) => {
    setAttributeForms(attributeForms.map(f => 
      f.id === formId ? { ...f, isEditing: true } : f
    ));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Test Information */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <div>
            <Label>Select Sub Specialty *</Label>
            <Select value={formData.subSpecialty} onValueChange={(value) => setFormData({...formData, subSpecialty: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TUMOR MARKER">TUMOR MARKER</SelectItem>
                <SelectItem value="HEMATOLOGY">HEMATOLOGY</SelectItem>
                <SelectItem value="BIOCHEMISTRY">BIOCHEMISTRY</SelectItem>
                <SelectItem value="MICROBIOLOGY">MICROBIOLOGY</SelectItem>
                <SelectItem value="IMMUNOLOGY">IMMUNOLOGY</SelectItem>
                <SelectItem value="PATHOLOGY">PATHOLOGY</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox id="setAsDefault" />
            <Label htmlFor="setAsDefault">Set as Default</Label>
          </div>

          <div>
            <Label>Name *</Label>
            <Input
              value={formData.testName}
              onChange={(e) => setFormData({...formData, testName: e.target.value})}
              required
              placeholder="e.g. Complete Blood Count"
            />
          </div>

          <div>
            <Label>Test Code *</Label>
            <Input
              value={formData.testCode}
              onChange={(e) => setFormData({...formData, testCode: e.target.value})}
              required
              placeholder="Enter test code"
            />
          </div>
          
          <div>
            <Label>Interface Code</Label>
            <Input placeholder="Interface Code" />
          </div>

          <div>
            <Label>Test Order</Label>
            <Input placeholder="Test Order" />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div>
            <Label>Short Form</Label>
            <Input
              value={formData.shortForm}
              onChange={(e) => setFormData({...formData, shortForm: e.target.value})}
            />
          </div>
          
          <div>
            <Label>Preparation Time</Label>
            <Input
              value={formData.preparationTime}
              onChange={(e) => setFormData({...formData, preparationTime: e.target.value})}
            />
          </div>
          
          <div>
            <Label>Specific Instruction For Preparation</Label>
            <Textarea
              value={formData.specificInstruction}
              onChange={(e) => setFormData({...formData, specificInstruction: e.target.value})}
            />
          </div>
          
          <div>
            <Label>Attach File</Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  id="attachYes" 
                  name="attachFile" 
                  checked={formData.attachFile}
                  onChange={() => setFormData({...formData, attachFile: true})}
                />
                <Label htmlFor="attachYes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  id="attachNo" 
                  name="attachFile" 
                  checked={!formData.attachFile}
                  onChange={() => setFormData({...formData, attachFile: false})}
                />
                <Label htmlFor="attachNo">No</Label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Left Column - Codes and Machine Details */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <div>
            <Label>ICD 10 Code</Label>
            <Input
              value={formData.icD10Code}
              onChange={(e) => setFormData({...formData, icD10Code: e.target.value})}
            />
          </div>

          <div>
            <Label>CGHS Code</Label>
            <Input
              value={formData.cghsCode}
              onChange={(e) => setFormData({...formData, cghsCode: e.target.value})}
            />
          </div>

          <div>
            <Label>RSBY Code</Label>
            <Input
              value={formData.rsbyCode}
              onChange={(e) => setFormData({...formData, rsbyCode: e.target.value})}
            />
          </div>

          <div>
            <Label>Loinc Code</Label>
            <Input
              value={formData.loincCode}
              onChange={(e) => setFormData({...formData, loincCode: e.target.value})}
            />
          </div>

          <div>
            <Label>CPT Code</Label>
            <Input
              value={formData.cptCode}
              onChange={(e) => setFormData({...formData, cptCode: e.target.value})}
            />
          </div>

          <div>
            <Label>Machine Name</Label>
            <Select value={formData.machineName} onValueChange={(value) => setFormData({...formData, machineName: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Please Select">Please Select</SelectItem>
                <SelectItem value="Sysmex XN-1000">Sysmex XN-1000</SelectItem>
                <SelectItem value="Roche Cobas 8000">Roche Cobas 8000</SelectItem>
                <SelectItem value="Abbott Architect">Abbott Architect</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Title Machine Name</Label>
            <Input
              value={formData.titleMachineName}
              onChange={(e) => setFormData({...formData, titleMachineName: e.target.value})}
            />
          </div>

          <div>
            <Label>Sample Type</Label>
            <Select value={formData.sampleType} onValueChange={(value) => setFormData({...formData, sampleType: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Please Select">Please Select</SelectItem>
                <SelectItem value="Whole Blood">Whole Blood</SelectItem>
                <SelectItem value="Serum">Serum</SelectItem>
                <SelectItem value="Plasma">Plasma</SelectItem>
                <SelectItem value="Urine">Urine</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="isHeader" />
            <Label htmlFor="isHeader">Is Header</Label>
          </div>

          <div>
            <Label>Test Method</Label>
            <Textarea 
              value={formData.testMethod}
              onChange={(e) => setFormData({...formData, testMethod: e.target.value})}
              placeholder="Men: 0.5 - 5.5 ng/ml&#10;Non-Pregnant Women:0.5-5.5ng/ml&#10;Pregnancy:"
              rows={3}
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div>
            <Label>Select Service Group *</Label>
            <Select value={formData.serviceGroup} onValueChange={(value) => setFormData({...formData, serviceGroup: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Laboratory Services">Laboratory Services</SelectItem>
                <SelectItem value="Radiology Services">Radiology Services</SelectItem>
                <SelectItem value="Pathology Services">Pathology Services</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Map Test To Service *</Label>
            <div className="space-y-2">
              <Input placeholder="Search Service" />
              <Select value={formData.testToService} onValueChange={(value) => setFormData({...formData, testToService: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="(AFP) alpha-fetoprotein">(AFP) alpha-fetoprotein</SelectItem>
                  <SelectItem value="Blood Test">Blood Test</SelectItem>
                  <SelectItem value="Urine Test">Urine Test</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Parameter (Panel Test) *</Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  id="single" 
                  name="parameterType" 
                  checked={formData.parameterType === 'Single'}
                  onChange={() => setFormData({...formData, parameterType: 'Single'})}
                 />
                <Label htmlFor="single">Single</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  id="multiple" 
                  name="parameterType" 
                  checked={formData.parameterType === 'Multiple'}
                  onChange={() => setFormData({...formData, parameterType: 'Multiple'})}
                />
                <Label htmlFor="multiple">Multiple</Label>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <input 
                type="radio" 
                id="nonDescriptive" 
                name="descriptiveType" 
                checked={formData.descriptiveType === 'Non-Descriptive'}
                onChange={() => setFormData({...formData, descriptiveType: 'Non-Descriptive'})}
              />
              <Label htmlFor="nonDescriptive">Non-Descriptive</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="radio" 
                id="descriptive" 
                name="descriptiveType" 
                checked={formData.descriptiveType === 'Descriptive'}
                onChange={() => setFormData({...formData, descriptiveType: 'Descriptive'})}
              />
              <Label htmlFor="descriptive">Descriptive</Label>
            </div>
          </div>

          <div>
            <Label>Test Result Help</Label>
            <Select value={formData.testResultHelp} onValueChange={(value) => setFormData({...formData, testResultHelp: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Select Test Result">Select Test Result</SelectItem>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="Abnormal">Abnormal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Default Result</Label>
            <Textarea
              value={formData.defaultResult}
              onChange={(e) => setFormData({...formData, defaultResult: e.target.value})}
            />
          </div>

          <div>
            <Label>Note/Opinion Display Text</Label>
            <Textarea />
          </div>

          <div>
            <Label>Note/Opinion Template</Label>
            <Textarea
              value={formData.noteTemplate}
              onChange={(e) => setFormData({...formData, noteTemplate: e.target.value})}
            />
          </div>

          <div>
            <Label>Speciality *</Label>
            <Select value={formData.specialty} onValueChange={(value) => setFormData({...formData, specialty: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Regular">Regular</SelectItem>
                <SelectItem value="Emergency">Emergency</SelectItem>
                <SelectItem value="STAT">STAT</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Right Side Configuration */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label>Short Form</Label>
            <Input
              value={formData.shortForm}
              onChange={(e) => setFormData({...formData, shortForm: e.target.value})}
            />
          </div>
          <div>
            <Label>Preparation Time</Label>
            <Input
              value={formData.preparationTime}
              onChange={(e) => setFormData({...formData, preparationTime: e.target.value})}
            />
          </div>
          <div>
            <Label>Specific Instruction For Preparation</Label>
            <Textarea
              value={formData.specificInstruction}
              onChange={(e) => setFormData({...formData, specificInstruction: e.target.value})}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="attachFile"
              checked={formData.attachFile}
              onCheckedChange={(checked) => setFormData({...formData, attachFile: !!checked})}
            />
            <Label htmlFor="attachFile">Attach File</Label>
          </div>
        </div>

        <div className="space-y-4">
          {/* This duplicate section has been removed */}
        </div>
      </div>

      {/* Category and Normal Range Management */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Category Name</h3>
          <div className="flex gap-2">
          <Button 
            type="button" 
            onClick={() => setShowAttributeForm(true)}
            className="flex items-center gap-2"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              Quick Add Category
            </Button>
            <Button 
              type="button" 
              onClick={addNewCategoryForm}
              className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add More Category
          </Button>
          </div>
        </div>

        {/* Show current saved attributes */}
        {formData.attributes.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-green-700">✅ Saved Categories:</h4>
            {formData.attributes.map((attr, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                <div className="flex-1">
                  <span className="font-medium">{attr.name}</span>
                  <span className="ml-2 text-sm text-gray-600">({attr.type})</span>
                  {attr.isBySex && <Badge variant="secondary" className="ml-2">By Sex</Badge>}
                  {attr.isByAge && <Badge variant="secondary" className="ml-2">By Age</Badge>}
                  {attr.isByRange && <Badge variant="secondary" className="ml-2">By Range</Badge>}
                </div>
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="sm"
                  onClick={() => removeAttribute(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Multiple category forms */}
        {attributeForms.map((form) => (
          <Card key={form.id} className="border-2 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-blue-700">Category Section #{form.id.split('_')[1]}</h4>
                <div className="flex gap-2">
                  {form.isEditing ? (
                    <>
                      <Button 
                        type="button" 
                        size="sm"
                        onClick={() => saveAttributeForm(form.id)}
                        disabled={!form.attribute.name.trim()}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => cancelAttributeForm(form.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => editAttributeForm(form.id)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm"
                        onClick={() => cancelAttributeForm(form.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {form.isEditing ? (
                <CategoryFormContent 
                  attribute={form.attribute}
                  onAttributeChange={(updatedAttribute) => updateAttributeForm(form.id, updatedAttribute)}
                  formId={`add-${form.id}`}
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded">
                  <p><strong>Name:</strong> {form.attribute.name}</p>
                  <p><strong>Type:</strong> {form.attribute.type}</p>
                  <p><strong>Range Type:</strong> 
                    {form.attribute.isBySex && ' By Sex'}
                    {form.attribute.isByAge && ' By Age'}
                    {form.attribute.isByRange && ' By Range'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Original single attribute form (Quick Add) */}
        {showAttributeForm && (
          <Card className="border-2 border-green-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-green-700">Quick Add Category</h4>
              </div>
              <CategoryFormContent 
                attribute={currentAttribute}
                onAttributeChange={setCurrentAttribute}
                formId="add-quick"
              />
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" onClick={() => setShowAttributeForm(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleAddAttribute}>
                  <Save className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div>
        <Label>Default Result</Label>
        <Textarea
          value={formData.defaultResult}
          onChange={(e) => setFormData({...formData, defaultResult: e.target.value})}
        />
      </div>

      <div>
        <Label>Note/Opinion Template</Label>
        <Textarea
          value={formData.noteTemplate}
          onChange={(e) => setFormData({...formData, noteTemplate: e.target.value})}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>
    </form>
  );
};

interface EditPanelFormProps {
  panel: LabPanel;
  onSubmit: (panel: LabPanel) => void;
}

const EditPanelForm: React.FC<EditPanelFormProps> = ({ panel, onSubmit }) => {
  const [formData, setFormData] = useState(panel);
  const [currentAttribute, setCurrentAttribute] = useState<TestAttribute>({
    name: '',
    type: 'Numeric',
    isMandatory: false,
    isByAge: false,
    isBySex: false,
    isByRange: false,
    hasFormula: false,
    formulaText: '',
    normalRange: {
      male: { ll: '', ul: '', default: '' },
      female: { ll: '', ul: '', default: '' },
      child: { ll: '', ul: '', default: '' }
    },
    units: ''
  });

  const [showAttributeForm, setShowAttributeForm] = useState(false);

  // State for managing multiple attribute forms in EditPanelForm
  const [attributeForms, setAttributeForms] = useState<Array<{id: string, attribute: TestAttribute, isEditing: boolean}>>([]);
  const [nextFormId, setNextFormId] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleAddAttribute = () => {
    if (currentAttribute.name) {
      setFormData({
        ...formData,
        attributes: [...formData.attributes, currentAttribute]
      });
      setCurrentAttribute({
        name: '',
        type: 'Numeric',
        isMandatory: false,
        isByAge: false,
        isBySex: false,
        isByRange: false,
        hasFormula: false,
        formulaText: '',
        normalRange: {
          male: { ll: '', ul: '', default: '' },
          female: { ll: '', ul: '', default: '' },
          child: { ll: '', ul: '', default: '' }
        },
        units: ''
      });
      setShowAttributeForm(false);
    }
  };

  const removeAttribute = (index: number) => {
    setFormData({
      ...formData,
      attributes: formData.attributes.filter((_, i) => i !== index)
    });
  };

  // Functions for managing multiple category forms in EditPanelForm
  const addNewCategoryForm = () => {
    const newFormId = `form_${nextFormId}`;
    const newAttributeForm = {
      id: newFormId,
      attribute: {
        name: '',
        type: 'Numeric' as const,
        isMandatory: false,
        isByAge: false,
        isBySex: true,
        isByRange: false,
        hasFormula: false,
        formulaText: '',
        normalRange: {
          male: { ll: '', ul: '', default: '' },
          female: { ll: '', ul: '', default: '' },
          child: { ll: '', ul: '', default: '' },
          ageRanges: [],
          ranges: []
        },
        units: ''
      },
      isEditing: true
    };
    
    setAttributeForms([...attributeForms, newAttributeForm]);
    setNextFormId(nextFormId + 1);
  };

  const updateAttributeForm = (formId: string, updatedAttribute: TestAttribute) => {
    setAttributeForms(attributeForms.map(form => 
      form.id === formId ? { ...form, attribute: updatedAttribute } : form
    ));
  };

  const saveAttributeForm = (formId: string) => {
    const form = attributeForms.find(f => f.id === formId);
    if (form && form.attribute.name.trim()) {
      setFormData({
        ...formData,
        attributes: [...formData.attributes, { ...form.attribute }]
      });
      
      setAttributeForms(attributeForms.filter(f => f.id !== formId));
    }
  };

  const cancelAttributeForm = (formId: string) => {
    setAttributeForms(attributeForms.filter(f => f.id !== formId));
  };

  const editAttributeForm = (formId: string) => {
    setAttributeForms(attributeForms.map(f => 
      f.id === formId ? { ...f, isEditing: true } : f
    ));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Test Information */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <div>
            <Label>Select Sub Specialty *</Label>
            <Select value={formData.subSpecialty} onValueChange={(value) => setFormData({...formData, subSpecialty: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TUMOR MARKER">TUMOR MARKER</SelectItem>
                <SelectItem value="HEMATOLOGY">HEMATOLOGY</SelectItem>
                <SelectItem value="BIOCHEMISTRY">BIOCHEMISTRY</SelectItem>
                <SelectItem value="MICROBIOLOGY">MICROBIOLOGY</SelectItem>
                <SelectItem value="IMMUNOLOGY">IMMUNOLOGY</SelectItem>
                <SelectItem value="PATHOLOGY">PATHOLOGY</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox id="setAsDefault" />
            <Label htmlFor="setAsDefault">Set as Default</Label>
          </div>

          <div>
            <Label>Name *</Label>
            <Input
              value={formData.testName}
              onChange={(e) => setFormData({...formData, testName: e.target.value})}
              required
              placeholder="e.g. Complete Blood Count"
            />
          </div>

          <div>
            <Label>Test Code *</Label>
            <Input
              value={formData.testCode}
              onChange={(e) => setFormData({...formData, testCode: e.target.value})}
              required
              placeholder="Enter test code"
            />
          </div>
          
          <div>
            <Label>Interface Code</Label>
            <Input placeholder="Interface Code" />
          </div>

          <div>
            <Label>Test Order</Label>
            <Input placeholder="Test Order" />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div>
            <Label>Short Form</Label>
            <Input
              value={formData.shortForm}
              onChange={(e) => setFormData({...formData, shortForm: e.target.value})}
              placeholder="e.g. CBC"
            />
          </div>

          <div>
            <Label>Test (days)</Label>
            <Input 
              value={formData.preparationTime}
              onChange={(e) => setFormData({...formData, preparationTime: e.target.value})}
              placeholder="Days"
            />
          </div>

          <div>
            <Label>Note for Specific Instructions</Label>
            <Textarea
              value={formData.specificInstruction}
              onChange={(e) => setFormData({...formData, specificInstruction: e.target.value})}
              placeholder="Enter specific instructions"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="attachFile" 
              checked={formData.attachFile}
              onCheckedChange={(checked) => setFormData({...formData, attachFile: !!checked})}
            />
            <Label htmlFor="attachFile">Allow Attachment</Label>
          </div>
        </div>
      </div>

      {/* Left Column - Codes and Machine Details */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <div>
            <Label>ICD 10 Code</Label>
            <Input
              value={formData.icD10Code}
              onChange={(e) => setFormData({...formData, icD10Code: e.target.value})}
            />
          </div>

          <div>
            <Label>CGHS Code</Label>
            <Input
              value={formData.cghsCode}
              onChange={(e) => setFormData({...formData, cghsCode: e.target.value})}
            />
          </div>

          <div>
            <Label>RSBY Code</Label>
            <Input
              value={formData.rsbyCode}
              onChange={(e) => setFormData({...formData, rsbyCode: e.target.value})}
            />
          </div>

          <div>
            <Label>Loinc Code</Label>
            <Input
              value={formData.loincCode}
              onChange={(e) => setFormData({...formData, loincCode: e.target.value})}
            />
          </div>

          <div>
            <Label>CPT Code</Label>
            <Input
              value={formData.cptCode}
              onChange={(e) => setFormData({...formData, cptCode: e.target.value})}
            />
          </div>

          <div>
            <Label>Machine Name</Label>
            <Select value={formData.machineName} onValueChange={(value) => setFormData({...formData, machineName: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Please Select">Please Select</SelectItem>
                <SelectItem value="Sysmex XN-1000">Sysmex XN-1000</SelectItem>
                <SelectItem value="Roche Cobas 8000">Roche Cobas 8000</SelectItem>
                <SelectItem value="Abbott Architect">Abbott Architect</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Title Machine Name</Label>
            <Input
              value={formData.titleMachineName}
              onChange={(e) => setFormData({...formData, titleMachineName: e.target.value})}
            />
          </div>

          <div>
            <Label>Sample Type</Label>
            <Select value={formData.sampleType} onValueChange={(value) => setFormData({...formData, sampleType: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Please Select">Please Select</SelectItem>
                <SelectItem value="Whole Blood">Whole Blood</SelectItem>
                <SelectItem value="Serum">Serum</SelectItem>
                <SelectItem value="Plasma">Plasma</SelectItem>
                <SelectItem value="Urine">Urine</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="isHeader" />
            <Label htmlFor="isHeader">Is Header</Label>
          </div>

          <div>
            <Label>Test Method</Label>
            <Textarea 
              value={formData.testMethod}
              onChange={(e) => setFormData({...formData, testMethod: e.target.value})}
              placeholder="Men: 0.5 - 5.5 ng/ml&#10;Non-Pregnant Women:0.5-5.5ng/ml&#10;Pregnancy:"
              rows={3}
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div>
            <Label>Select Service Group *</Label>
            <Select value={formData.serviceGroup} onValueChange={(value) => setFormData({...formData, serviceGroup: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Laboratory Services">Laboratory Services</SelectItem>
                <SelectItem value="Radiology Services">Radiology Services</SelectItem>
                <SelectItem value="Pathology Services">Pathology Services</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Map Test To Service *</Label>
            <div className="space-y-2">
              <Input placeholder="Search Service" />
              <Select value={formData.testToService} onValueChange={(value) => setFormData({...formData, testToService: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="(AFP) alpha-fetoprotein">(AFP) alpha-fetoprotein</SelectItem>
                  <SelectItem value="Blood Test">Blood Test</SelectItem>
                  <SelectItem value="Urine Test">Urine Test</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Parameter (Panel Test) *</Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  id="single-edit" 
                  name="parameterType-edit" 
                  checked={formData.parameterType === 'Single'}
                  onChange={() => setFormData({...formData, parameterType: 'Single'})}
                 />
                <Label htmlFor="single-edit">Single</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  id="multiple-edit" 
                  name="parameterType-edit" 
                  checked={formData.parameterType === 'Multiple'}
                  onChange={() => setFormData({...formData, parameterType: 'Multiple'})}
                />
                <Label htmlFor="multiple-edit">Multiple</Label>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <input 
                type="radio" 
                id="nonDescriptive-edit" 
                name="descriptiveType-edit" 
                checked={formData.descriptiveType === 'Non-Descriptive'}
                onChange={() => setFormData({...formData, descriptiveType: 'Non-Descriptive'})}
              />
              <Label htmlFor="nonDescriptive-edit">Non-Descriptive</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="radio" 
                id="descriptive-edit" 
                name="descriptiveType-edit" 
                checked={formData.descriptiveType === 'Descriptive'}
                onChange={() => setFormData({...formData, descriptiveType: 'Descriptive'})}
              />
              <Label htmlFor="descriptive-edit">Descriptive</Label>
            </div>
          </div>

          <div>
            <Label>Test Result Help</Label>
            <Select value={formData.testResultHelp} onValueChange={(value) => setFormData({...formData, testResultHelp: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Select Test Result">Select Test Result</SelectItem>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="Abnormal">Abnormal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Default Result</Label>
            <Textarea
              value={formData.defaultResult}
              onChange={(e) => setFormData({...formData, defaultResult: e.target.value})}
            />
          </div>

          <div>
            <Label>Note/Opinion Display Text</Label>
            <Textarea />
          </div>

          <div>
            <Label>Note/Opinion Template</Label>
            <Textarea
              value={formData.noteTemplate}
              onChange={(e) => setFormData({...formData, noteTemplate: e.target.value})}
            />
          </div>

          <div>
            <Label>Speciality *</Label>
            <Select value={formData.specialty} onValueChange={(value) => setFormData({...formData, specialty: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Regular">Regular</SelectItem>
                <SelectItem value="Emergency">Emergency</SelectItem>
                <SelectItem value="STAT">STAT</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Existing Attributes Display */}
      {formData.attributes.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Test Attributes</h3>
          <div className="space-y-2">
            {formData.attributes.map((attr, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <span className="font-medium">{attr.name}</span>
                  <span className="text-sm text-muted-foreground ml-2">({attr.type})</span>
                  {attr.units && <span className="text-sm text-muted-foreground ml-2">[{attr.units}]</span>}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAttribute(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category and Normal Range Management - Same as Add Panel Form */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Category Name</h3>
          <div className="flex gap-2">
        <Button
          type="button"
          onClick={() => setShowAttributeForm(true)}
          className="flex items-center gap-2"
              variant="outline"
        >
          <Plus className="h-4 w-4" />
              Quick Add Category
            </Button>
            <Button 
              type="button" 
              onClick={addNewCategoryForm}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add More Category
        </Button>
          </div>
      </div>

        {/* Show current saved attributes */}
        {formData.attributes.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-green-700">✅ Saved Categories:</h4>
            {formData.attributes.map((attr, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                <div className="flex-1">
                  <span className="font-medium">{attr.name}</span>
                  <span className="ml-2 text-sm text-gray-600">({attr.type})</span>
                  {attr.isBySex && <Badge variant="secondary" className="ml-2">By Sex</Badge>}
                  {attr.isByAge && <Badge variant="secondary" className="ml-2">By Age</Badge>}
                  {attr.isByRange && <Badge variant="secondary" className="ml-2">By Range</Badge>}
                </div>
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="sm"
                  onClick={() => removeAttribute(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
                </div>
            ))}
              </div>
        )}

        {/* Multiple category forms */}
        {attributeForms.map((form) => (
          <Card key={form.id} className="border-2 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-blue-700">Category Section #{form.id.split('_')[1]}</h4>
                <div className="flex gap-2">
                  {form.isEditing ? (
                    <>
                      <Button 
                        type="button" 
                        size="sm"
                        onClick={() => saveAttributeForm(form.id)}
                        disabled={!form.attribute.name.trim()}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                    </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => cancelAttributeForm(form.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => editAttributeForm(form.id)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm"
                        onClick={() => cancelAttributeForm(form.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  </div>
                </div>

              {form.isEditing ? (
                <CategoryFormContent 
                  attribute={form.attribute}
                  onAttributeChange={(updatedAttribute) => updateAttributeForm(form.id, updatedAttribute)}
                  formId={`edit-${form.id}`}
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded">
                  <p><strong>Name:</strong> {form.attribute.name}</p>
                  <p><strong>Type:</strong> {form.attribute.type}</p>
                  <p><strong>Range Type:</strong> 
                    {form.attribute.isBySex && ' By Sex'}
                    {form.attribute.isByAge && ' By Age'}
                    {form.attribute.isByRange && ' By Range'}
                  </p>
              </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Original single attribute form (Quick Add) */}
        {showAttributeForm && (
          <Card className="border-2 border-green-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-green-700">Quick Add Category</h4>
              </div>
              <CategoryFormContent 
                attribute={currentAttribute}
                onAttributeChange={setCurrentAttribute}
                formId="edit-quick"
              />
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" onClick={() => setShowAttributeForm(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleAddAttribute}>
                  <Save className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Update Panel
        </Button>
      </div>
    </form>
  );
};

export default LabPanelManager;
