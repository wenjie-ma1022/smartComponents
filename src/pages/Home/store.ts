import { createStore } from 'ice';
import foo from './model';

const store = createStore({ default: foo });

export default store;
