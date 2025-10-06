import { createRoot } from '@wordpress/element';
import QRCodeApp from './components/QRCodeApp';

const rootElement = document.getElementById('rms-qrcodes-root');

if (rootElement) {
    const root = createRoot(rootElement);
    root.render(<QRCodeApp />);
}