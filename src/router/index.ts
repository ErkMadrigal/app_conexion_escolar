import { createRouter, createWebHistory } from "@ionic/vue-router";
import TabsPage from "@/views/TabsPage.vue";

const routes = [
  { path: "/", redirect: "/tabs/hijos" },

  {
    path: "/tabs/",
    component: TabsPage,
    children: [
      { path: "", redirect: "/tabs/hijos" },
      { path: "hijos", component: () => import("@/views/HijosPage.vue") },
      { path: "historial", component: () => import("@/views/HistorialPage.vue") },
      { path: "perfil", component: () => import("@/views/PerfilPage.vue") },
    ],
  },

  // Detalle (lo abrimos desde historial o desde push)
  { path: "/asistencia/:id", component: () => import("@/views/AsistenciaDetalle.vue") },
];

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});