import { createRoot } from '@wordpress/element';
import StockApp from './components/StockApp';

const rootElement = document.getElementById('rms-stock-root');

if (rootElement) {
    const root = createRoot(rootElement);
    root.render(<StockApp />);
}