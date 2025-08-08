
import { useMemo } from 'react';
import { menuItems } from './menuItems';
import { AppSidebarProps, MenuItem } from './types';

export const useMenuItems = (props: AppSidebarProps): MenuItem[] => {
  const {
    diagnosesCount = 0,
    patientsCount = 0,
    usersCount = 0,
    complicationsCount = 0,
    cghsSurgeryCount = 0,
    labCount = 0,
    radiologyCount = 0,
    medicationCount = 0,
    esicSurgeonsCount = 0,
    refereesCount = 0,
    hopeSurgeonsCount = 0,
    hopeConsultantsCount = 0
  } = props;

  return useMemo(() => 
    menuItems.map(item => ({
      title: item.title,
      icon: item.icon,
      description: `View ${item.title.toLowerCase()} data`,
      route: item.url,
      count: item.title === "Patient Dashboard" ? patientsCount :
             item.title === "Diagnoses" ? diagnosesCount :
             item.title === "Patients" ? patientsCount :
             item.title === "Users" ? usersCount :
             item.title === "Complications" ? complicationsCount :
             item.title === "CGHS Surgery" ? cghsSurgeryCount :
             item.title === "Lab" ? labCount :
             item.title === "Radiology" ? radiologyCount :
             item.title === "Medications" ? medicationCount :
             item.title === "ESIC Surgeons" ? esicSurgeonsCount :
             item.title === "Referees" ? refereesCount :
             item.title === "Hope Surgeons" ? hopeSurgeonsCount :
             item.title === "Hope Consultants" ? hopeConsultantsCount : 0
    })), [
      diagnosesCount, patientsCount, usersCount, complicationsCount,
      cghsSurgeryCount, labCount, radiologyCount, medicationCount,
      esicSurgeonsCount, refereesCount, hopeSurgeonsCount, hopeConsultantsCount
    ]
  );
};
