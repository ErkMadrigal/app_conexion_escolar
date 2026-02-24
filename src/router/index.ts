import { createRouter, createWebHistory } from "@ionic/vue-router";
import TabsPage from "@/views/TabsPage.vue";
import { isLoggedIn } from "@/services/session";

const routes = [
  { path: "/", redirect: "/tabs/hijos" },

  { path: "/login", component: () => import("@/views/LoginPage.vue") },
  { path: "/change-password", component: () => import("@/views/ChangePasswordPage.vue"), meta: { auth: true } },

  {
    path: "/tabs/",
    component: TabsPage,
    meta: { auth: true },
    children: [
      { path: "", redirect: "/tabs/hijos" },
      { path: "hijos", component: () => import("@/views/HijosPage.vue") },
      { path: "historial", component: () => import("@/views/HistorialPage.vue") },
      { path: "perfil", component: () => import("@/views/PerfilPage.vue") },
    ],
  },

  { path: "/asistencia/:id", component: () => import("@/views/AsistenciaDetalle.vue"), meta: { auth: true } },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to) => {
  const needAuth = Boolean(to.meta?.auth);
  if (needAuth && !isLoggedIn()) return "/login";
  if (to.path === "/login" && isLoggedIn()) return "/tabs/hijos";
});

export default router;