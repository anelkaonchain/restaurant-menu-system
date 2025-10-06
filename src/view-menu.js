import { render } from '@wordpress/element';
import ViewMenuApp from './components/ViewMenuApp';

const rootElement = document.getElementById('rms-view-menu-root');
if (rootElement) {
    render(<ViewMenuApp />, rootElement);
}