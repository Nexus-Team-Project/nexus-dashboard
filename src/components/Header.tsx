import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import './Header.css';

interface HeaderProps {
  title: string;
}

const Header = ({ title }: HeaderProps) => {
  const { t } = useLanguage();

  return (
    <header className="header">
      <h2 className="header-title">{title}</h2>
      <div className="header-actions">
        <LanguageSwitcher />
        <div className="header-user">
          <span className="user-name">{t('adminUser')}</span>
          <div className="user-avatar">A</div>
        </div>
      </div>
    </header>
  );
};

export default Header;
