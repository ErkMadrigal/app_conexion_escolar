<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/historial" />
        </ion-buttons>
        <ion-title>Detalle</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-loading :is-open="loading" message="Cargando..." />

      <ion-card v-if="info">
        <ion-card-header>
          <ion-card-title>{{ info.alumno ?? "Alumno" }}</ion-card-title>
          <ion-card-subtitle>ID asistencia: {{ info.id }}</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <p><b>Tipo:</b> {{ info.tipo_escaneo === 0 ? "ENTRADA" : "SALIDA" }}</p>
          <p><b>Fecha:</b> {{ info.ingreso }}</p>
          <p v-if="info.escuela"><b>Escuela:</b> {{ info.escuela }}</p>
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonLoading, IonCard, IonCardHeader,
  IonCardTitle, IonCardSubtitle, IonCardContent
} from "@ionic/vue";
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { apiGet } from "@/lib/api";

const route = useRoute();
const loading = ref(true);
const info = ref<any>(null);

onMounted(async () => {
  try {
    info.value = await apiGet(`/asistencias/${route.params.id}`);
  } finally {
    loading.value = false;
  }
});
</script>