import { createRoot } from '@wordpress/element';
import ReportsApp from './components/ReportsApp';

const rootElement = document.getElementById('rms-reports-root');

if (rootElement) {
    const root = createRoot(rootElement);
    root.render(<ReportsApp />);
}