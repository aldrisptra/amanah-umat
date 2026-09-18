import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { reveal } from "./lib/motion";

import "./style.css";

const app = createApp(App);

app.use(router);

// Directive global: <div v-reveal> akan muncul perlahan saat tergulir ke layar
app.directive("reveal", reveal);

app.mount("#app");
