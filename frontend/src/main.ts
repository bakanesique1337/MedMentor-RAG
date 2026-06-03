import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { registerRouter } from '@/stores/authGate'

const app = createApp(App)

app.use(createPinia())
app.use(router)

registerRouter(router)

app.mount('#app')
