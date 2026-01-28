import { Logo } from '../common/Logo';
import { NotificationsDropdown } from '../common/NotificationsDropdown';
import { ProfileDropdownHeader } from '../common/ProfileDropdownHeader';

export const Header = () => {
  return (
    <header className="bg-dark border-b border-gray-dark px-6 py-2 flex items-center justify-between fixed top-0 left-0 right-0 z-50 h-20">
      <div className="flex items-center gap-4">
        <Logo variant="full" size="small" />
      </div>
      
      <div className="flex items-center gap-4">
        <NotificationsDropdown />
        <ProfileDropdownHeader />
      </div>
    </header>
  );
};
