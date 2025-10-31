import { useShop } from '../contexts/ShopContext';

export function requireOwnerRole() {
  const { currentShop } = useShop();

  if (currentShop?.userRole !== 'owner') {
    throw new Error('Owner access required');
  }
}

export function requireManagerOrOwner() {
  const { currentShop } = useShop();

  if (!currentShop || !['owner', 'manager'].includes(currentShop.userRole || '')) {
    throw new Error('Manager or Owner access required');
  }
}

export function canManageStaff(): boolean {
  const { currentShop } = useShop();
  return ['owner', 'manager'].includes(currentShop?.userRole || '');
}

export function canViewPayroll(): boolean {
  const { currentShop } = useShop();
  return ['owner', 'manager'].includes(currentShop?.userRole || '');
}

export function canCheckInCustomers(): boolean {
  // All staff can check in customers
  return true;
}

export function useCanManageStaff() {
  return canManageStaff();
}

export function useCanViewPayroll() {
  return canViewPayroll();
}

