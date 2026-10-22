/**
 * main.jsx
 * React entry point; renders the App component.
 */
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(<App />);
