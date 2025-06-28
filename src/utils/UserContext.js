// utils/UserContext.js
import { createContext } from 'react';

/* ① “named export” 방식 */
export const UserContext = createContext(null);

/*  또는
   ② “default export” 한 가지만 쓰고 싶다면
export default createContext(null);
*/
