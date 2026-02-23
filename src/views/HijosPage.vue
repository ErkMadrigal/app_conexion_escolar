<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Mis hijos</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>

      <ion-card v-if="selected">
        <ion-card-header>
          <ion-card-title>Seleccionado</ion-card-title>
          <ion-card-subtitle>{{ fullName(selected) }}</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-button expand="block" router-link="/tabs/historial">
            Ver historial
          </ion-button>
        </ion-card-content>
      </ion-card>

      <ion-list>
        <ion-item v-for="h in hijos" :key="h.id" button @click="pick(h)">
          <ion-label>
            <h2>{{ fullName(h) }}</h2>
            <p v-if="h.grado || h.grupo">
              {{ (h.grado ?? '') }} {{ (h.grupo ?? '') }}
            </p>
            <p v-if="h.matricula">Matrícula: {{ h.matricula }}</p>
          </ion-label>

          <ion-badge v-if="selected?.id === h.id" color="success">Activo</ion-badge>
        </ion-item>
      </ion-list>

      <ion-item v-if="!loading && !hijos.length">
        <ion-label>No tienes hijos vinculados.</ion-label>
      </ion-item>

      <ion-loading :is-open="loading" message="Cargando..." />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonBadge, IonLoading,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonButton, IonRefresher, IonRefresherContent
} from "@ionic/vue";
import { onMounted, ref } from "vue";
import { apiGet } from "@/lib/api";
import { getSelectedHijo, setSelectedHijo, type Hijo } from "@/lib/state";

const hijos = ref<Hijo[]>([]);
const loading = ref(false);
const selected = ref<Hijo | null>(getSelectedHijo());

function fullName(h: Hijo) {
  return `${h.nombres} ${h.apellidos}`.trim();
}

async function load() {
  loading.value = true;
  try {
    // endpoint esperado
    const data = await apiGet("/me/hijos");
    hijos.value = Array.isArray(data) ? data : (data?.items ?? []);
    // si no hay seleccionado, elige el primero
    if (!selected.value && hijos.value.length) {
      selected.value = hijos.value[0];
      setSelectedHijo(hijos.value[0]);
    }
  } finally {
    loading.value = false;
  }
}

function pick(h: Hijo) {
  selected.value = h;
  setSelectedHijo(h);
}

async function onRefresh(ev: CustomEvent) {
  await load();
  (ev.target as any).complete();
}

onMounted(load);
</script>