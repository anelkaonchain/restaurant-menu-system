import { createRoot } from '@wordpress/element';
import CategoriesApp from './components/CategoriesApp';

const rootElement = document.getElementById('rms-categories-root');

if (rootElement) {
    const root = createRoot(rootElement);
    root.render(<CategoriesApp />);
}