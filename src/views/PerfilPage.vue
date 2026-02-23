
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Perfil</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p>Aquí luego metemos: cerrar sesión, cambiar contraseña, etc.</p>

      <ion-button expand="block" color="danger" @click="logout">
        Cerrar sesión
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from "@ionic/vue";
import { useRouter } from "vue-router";

const router = useRouter();

function logout() {
  localStorage.removeItem("session_token");
  router.replace("/"); // o /login si lo tienes
}
</script>