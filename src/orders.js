import { createRoot } from '@wordpress/element';
import OrdersApp from './components/OrdersApp';

const rootElement = document.getElementById('rms-orders-root');

if (rootElement) {
    const root = createRoot(rootElement);
    root.render(<OrdersApp />);
}