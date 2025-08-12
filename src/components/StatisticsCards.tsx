
import { Card, CardContent } from '@/components/ui/card';
import { Users, FileText, Activity } from 'lucide-react';

interface StatisticsCardsProps {
  totalPatients: number;
}

export const StatisticsCards: React.FC<StatisticsCardsProps> = ({
  totalPatients
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Users className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <p className="text-2xl font-bold text-primary">{totalPatients}</p>
            <p className="text-sm text-muted-foreground">Total Patients</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Activity className="h-8 w-8 text-red-600 mr-3" />
          <div>
            <p className="text-2xl font-bold text-primary">Active</p>
            <p className="text-sm text-muted-foreground">System Status</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
