import { createRoot } from '@wordpress/element';
import AdminApp from './components/AdminApp';

const rootElement = document.getElementById('rms-admin-root');

if (rootElement) {
    const root = createRoot(rootElement);
    root.render(<AdminApp />);
}