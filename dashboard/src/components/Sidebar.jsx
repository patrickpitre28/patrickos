import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/tasks', label: 'Tasks' },
  { to: '/agents', label: 'Agents' },
  { to: '/vault', label: 'Vault' },
  { to: '/briefings', label: 'Briefings' },
];

const sidebarStyle = {
  width: 220,
  background: '#161822',
  borderRight: '1px solid #2a2d3a',
  padding: '24px 0',
  display: 'flex',
  flexDirection: 'column',
};

const logoStyle = {
  fontSize: 20,
  fontWeight: 700,
  color: '#7c8aff',
  padding: '0 20px 24px',
  borderBottom: '1px solid #2a2d3a',
  marginBottom: 16,
};

const linkStyle = {
  display: 'block',
  padding: '10px 20px',
  color: '#8b8fa3',
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 500,
  transition: 'color 0.15s, background 0.15s',
};

const activeLinkStyle = {
  ...linkStyle,
  color: '#e1e4e8',
  background: '#1e2030',
  borderLeft: '3px solid #7c8aff',
};

export default function Sidebar() {
  return (
    <nav style={sidebarStyle}>
      <div style={logoStyle}>PatrickOS</div>
      {navItems.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
