import { createRoot } from '@wordpress/element';
import SettingsApp from './components/SettingsApp';

const rootElement = document.getElementById('rms-settings-root');

if (rootElement) {
    const root = createRoot(rootElement);
    root.render(<SettingsApp />);
}