import { createApp } from 'vue'
import { Quasar } from 'quasar'
import App from './App.vue'
import router from './router'
import 'quasar/src/css/index.sass'

import '@quasar/extras/material-icons/material-icons.css'

const app = createApp(App)

app.use(router);
app.use(Quasar, {
    plugins: {}, // import Quasar plugins and add here
})

// Assumes you have a <div id="app"></div> in your index.html
app.mount('#app')
