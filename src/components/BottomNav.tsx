import { Link, useLocation } from 'react-router-dom';
import { Home, Plus, Receipt, Settings } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: Home, label: 'Groups' },
    { path: '/add', icon: Plus, label: 'Add' },
    { path: '/receipts', icon: Receipt, label: 'Receipts' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-4">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-lg transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
