
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Pill } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AddItemDialog } from '@/components/AddItemDialog';

const Medications = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: medications = [], isLoading } = useQuery({
    queryKey: ['medication'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medication')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching medications:', error);
        throw error;
      }
      
      return data;
    }
  });

  const addMedicationMutation = useMutation({
    mutationFn: async ({ name, description, generic_name, category, dosage }: { 
      name: string; 
      description?: string; 
      generic_name?: string; 
      category?: string; 
      dosage?: string; 
    }) => {
      const { data, error } = await supabase
        .from('medication')
        .insert({ name, description, generic_name, category, dosage })
        .select()
        .single();

      if (error) {
        console.error('Error adding medication:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medication'] });
      toast({
        title: "Success",
        description: "Medication added successfully",
      });
    },
    onError: (error) => {
      console.error('Add medication error:', error);
      toast({
        title: "Error",
        description: "Failed to add medication",
        variant: "destructive"
      });
    }
  });

  const filteredMedications = medications.filter(medication =>
    medication.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (medication.description && medication.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (medication.generic_name && medication.generic_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (medication.category && medication.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading medications...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-16 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Pill className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-primary">
              Medications Master List
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Manage all medications
          </p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search medications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Medication
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMedications.map((medication) => (
            <Card key={medication.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">{medication.name}</span>
                  <div className="flex gap-2">
                    {medication.dosage && (
                      <Badge variant="outline">
                        {medication.dosage}
                      </Badge>
                    )}
                    {medication.category && (
                      <Badge variant="secondary">
                        {medication.category}
                      </Badge>
                    )}
                  </div>
                </CardTitle>
                {medication.generic_name && (
                  <p className="text-sm text-muted-foreground">
                    Generic: {medication.generic_name}
                  </p>
                )}
              </CardHeader>
              {medication.description && (
                <CardContent>
                  <p className="text-muted-foreground">{medication.description}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {filteredMedications.length === 0 && (
          <div className="text-center py-12">
            <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">
              {searchTerm ? 'No medications found matching your search.' : 'No medications available.'}
            </p>
          </div>
        )}

        <AddItemDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onAdd={(formData) => 
            addMedicationMutation.mutate({ 
              name: formData.name, 
              description: formData.description,
              generic_name: formData.generic_name,
              category: formData.category,
              dosage: formData.dosage
            })
          }
          title="Add New Medication"
          fields={[
            {
              key: 'name',
              label: 'Medication Name',
              type: 'text',
              required: true,
              placeholder: 'Enter medication name'
            },
            {
              key: 'generic_name',
              label: 'Generic Name',
              type: 'text',
              placeholder: 'Enter generic name'
            },
            {
              key: 'category',
              label: 'Category',
              type: 'text',
              placeholder: 'Enter category (e.g., Antibiotic, Analgesic)'
            },
            {
              key: 'dosage',
              label: 'Dosage',
              type: 'text',
              placeholder: 'Enter dosage (e.g., 500mg)'
            },
            {
              key: 'description',
              label: 'Description (Optional)',
              type: 'textarea',
              placeholder: 'Enter description'
            }
          ]}
        />
      </div>
    </div>
  );
};

export default Medications;
