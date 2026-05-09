import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

const rootElement = document.getElementById('root');
const root = rootElement.__dDefenceRoot ?? createRoot(rootElement);
rootElement.__dDefenceRoot = root;
root.render(<App />);
