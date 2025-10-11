import { createRoot } from '@wordpress/element';
import ExpensesApp from './components/ExpensesApp';

const rootElement = document.getElementById('rms-expenses-root');

if (rootElement) {
    const root = createRoot(rootElement);
    root.render(<ExpensesApp />);
}