import { createApp } from 'vue'
import { Notify, Quasar } from 'quasar'
import { AppWs, APP_WEB_SOCKET } from './services/hc-app'
import App from './App.vue'
import router from './router'
import 'quasar/src/css/index.sass'
import '@quasar/extras/material-icons/material-icons.css'

const app = createApp(App)

AppWs.connect().then((appWs => app.provide(APP_WEB_SOCKET, appWs)));

app.use(router);
app.use(Quasar, {
    plugins: { Notify }, // import Quasar plugins and add here
})

// Assumes you have a <div id="app"></div> in your index.html
app.mount('#app')
