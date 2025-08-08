
import { useNavigate, useLocation } from 'react-router-dom';
import { SidebarMenuButton, SidebarMenuItem as SidebarMenuItemBase } from '@/components/ui/sidebar';
import { MenuItem } from './types';

interface SidebarMenuItemProps {
  item: MenuItem;
}

export const SidebarMenuItem = ({ item }: SidebarMenuItemProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleItemClick = (route: string) => {
    navigate(route);
  };

  return (
    <SidebarMenuItemBase key={item.title}>
      <SidebarMenuButton asChild>
        <div 
          className={`flex items-center justify-between w-full p-2 cursor-pointer hover:bg-accent rounded-md transition-colors gap-2 ${
            location.pathname === item.route ? 'bg-accent' : ''
          }`}
          onClick={() => handleItemClick(item.route)}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <item.icon className="h-4 w-4 flex-shrink-0" />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-medium text-sm truncate">{item.title}</span>
              <span className="text-xs text-muted-foreground truncate">
                {item.description}
              </span>
            </div>
          </div>
          <div className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 min-w-[2rem] text-center">
            {item.count}
          </div>
        </div>
      </SidebarMenuButton>
    </SidebarMenuItemBase>
  );
};
