/**
 * Point d’entrée unique pour dayjs en français (ESM).
 * N’utilisez pas `import dayjs from 'dayjs'` ailleurs : le build main pointe vers du UMD
 * et `import 'dayjs/locale/fr'` casse avec le pré-bundle Vite (erreur sur l’export `t`).
 */
import dayjs from 'dayjs/esm/index.js'
import 'dayjs/esm/locale/fr.js'

dayjs.locale('fr')

export { dayjs }
export default dayjs
