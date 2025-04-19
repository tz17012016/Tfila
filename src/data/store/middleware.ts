import {FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE} from 'redux-persist';
import {connectionApi} from '../redux/api/connectionApi';
import {dbApi} from '../redux/api/dbApi';
import {halchYomitApi} from '../redux/api/halchYomitApi';
import {hebcalApi} from '../redux/api/hebcalApi';
import {omerApi} from '../redux/api/omerApi';
import {parashaApi} from '../redux/api/parashaApi';
import {zmanimApi} from '../redux/api/zmanimApi';

const middleware = (getDefaultMiddleware: any) =>
  getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
    },
  }).concat(
    dbApi.middleware,
    connectionApi.middleware,
    halchYomitApi.middleware,
    hebcalApi.middleware,
    omerApi.middleware,
    parashaApi.middleware,
    zmanimApi.middleware,
  );

export default middleware;
