<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Historial</ion-title>
      </ion-toolbar>

      <ion-toolbar>
        <ion-item lines="none">
          <ion-label>Hijo</ion-label>
          <ion-select :value="selectedId" interface="popover" @ionChange="onChangeHijo">
            <ion-select-option v-for="h in hijos" :key="h.id" :value="h.id">
              {{ fullName(h) }}
            </ion-select-option>
          </ion-select>
        </ion-item>

        <ion-segment :value="range" @ionChange="onChangeRange">
          <ion-segment-button value="hoy"><ion-label>Hoy</ion-label></ion-segment-button>
          <ion-segment-button value="semana"><ion-label>Semana</ion-label></ion-segment-button>
          <ion-segment-button value="todo"><ion-label>Todo</ion-label></ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>

      <ion-list v-if="items.length">
        <ion-item v-for="a in items" :key="a.id" button @click="openDetalle(a.id)">
          <ion-icon slot="start" :icon="a.tipo_escaneo === 0 ? logInOutline : logOutOutline" />
          <ion-label>
            <h2>{{ a.tipo_escaneo === 0 ? "ENTRADA" : "SALIDA" }}</h2>
            <p>{{ formatDate(a.ingreso) }}</p>
          </ion-label>
          <ion-badge color="medium">{{ a.id }}</ion-badge>
        </ion-item>
      </ion-list>

      <ion-item v-else-if="!loading">
        <ion-label>No hay asistencias para este rango.</ion-label>
      </ion-item>

      <ion-loading :is-open="loading" message="Cargando..." />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonLabel, IonSelect, IonSelectOption,
  IonList, IonLoading, IonIcon, IonBadge,
  IonRefresher, IonRefresherContent,
  IonSegment, IonSegmentButton
} from "@ionic/vue";
import { onMounted, ref, computed } from "vue";
import { useRouter } from "vue-router";
import { apiGet } from "@/lib/api";
import { getSelectedHijo, setSelectedHijo, type Hijo } from "@/lib/state";
import { logInOutline, logOutOutline } from "ionicons/icons";

type Asistencia = {
  id: number;
  id_estudiante: number;
  ingreso: string;      // datetime string
  tipo_escaneo: 0 | 1;  // 0 entrada, 1 salida
};

const router = useRouter();

const hijos = ref<Hijo[]>([]);
const selected = ref<Hijo | null>(getSelectedHijo());
const selectedId = computed(() => selected.value?.id ?? null);

const items = ref<Asistencia[]>([]);
const loading = ref(false);
const range = ref<"hoy"|"semana"|"todo">("hoy");

function fullName(h: Hijo) {
  return `${h.nombres} ${h.apellidos}`.trim();
}

function formatDate(s: string) {
  // si te llega "2026-02-21 08:01:10" lo muestra bonito
  try {
    const iso = s.includes("T") ? s : s.replace(" ", "T");
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return s;
  }
}

function getRangeParams() {
  if (range.value === "todo") return "";
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const fromDate = new Date(now);
  if (range.value === "hoy") {
    // mismo día
  } else {
    fromDate.setDate(fromDate.getDate() - 7);
  }
  const from = fromDate.toISOString().slice(0, 10);
  return `&from=${from}&to=${to}`;
}

async function loadHijos() {
  const data = await apiGet("/me/hijos");
  hijos.value = Array.isArray(data) ? data : (data?.items ?? []);
  if (!selected.value && hijos.value.length) {
    selected.value = hijos.value[0];
    setSelectedHijo(hijos.value[0]);
  } else if (selected.value) {
    // refrescar referencia por si cambió
    const found = hijos.value.find(h => h.id === selected.value!.id);
    if (found) selected.value = found;
  }
}

async function loadHistorial() {
  if (!selected.value) {
    items.value = [];
    return;
  }
  loading.value = true;
  try {
    const q = `?hijo_id=${selected.value.id}${getRangeParams()}`;
    const data = await apiGet(`/asistencias${q}`);

    // soporta {items: []} o [] directo
    items.value = Array.isArray(data) ? data : (data?.items ?? []);
  } finally {
    loading.value = false;
  }
}

async function onChangeHijo(ev: any) {
  const id = Number(ev.detail.value);
  const h = hijos.value.find(x => x.id === id) || null;
  selected.value = h;
  if (h) setSelectedHijo(h);
  await loadHistorial();
}

async function onChangeRange(ev: any) {
  range.value = ev.detail.value;
  await loadHistorial();
}

function openDetalle(id: number) {
  router.push(`/asistencia/${id}`);
}

async function onRefresh(ev: CustomEvent) {
  await loadHijos();
  await loadHistorial();
  (ev.target as any).complete();
}

onMounted(async () => {
  await loadHijos();
  await loadHistorial();
});
</script>