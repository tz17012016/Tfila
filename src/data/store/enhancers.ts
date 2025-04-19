import {composeWithDevTools} from '@redux-devtools/remote';
import {StoreEnhancer} from 'redux'; // compose is handled by composeWithDevTools

const devToolsComposer = composeWithDevTools({
  // Renamed for clarity
  realtime: true,
  name: 'Tfila App DevTools',
  hostname: 'localhost',
  port: 8000,
});

interface EnhancerFunction {
  (): [StoreEnhancer, ...StoreEnhancer[]];
}

// Apply the devTools enhancer by returning an array of enhancers
const enhancers = (getDefaultEnhancers: EnhancerFunction): StoreEnhancer[] => [
  ...getDefaultEnhancers(),
  devToolsComposer as StoreEnhancer,
];

export default enhancers;
