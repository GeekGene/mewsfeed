import { createApp } from 'vue'
import { Notify, Quasar } from 'quasar'
import { connectAppWebSocket, APP_WEB_SOCKET } from './services/clutter-dna'
import App from './App.vue'
import router from './router'
import 'quasar/src/css/index.sass'
import '@quasar/extras/material-icons/material-icons.css'

const app = createApp(App)

connectAppWebSocket().then((appService => app.provide(APP_WEB_SOCKET, appService)));

app.use(router);
app.use(Quasar, {
    plugins: { Notify }
})

app.mount('#app')
